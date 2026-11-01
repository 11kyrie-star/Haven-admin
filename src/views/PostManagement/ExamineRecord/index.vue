<template>
    <div class="examinerecord-container">
        <!-- 工具栏 -->
        <div class="examinerecord-tool">
            <div class="filter-group">
                <el-select v-model="result" placeholder="审批结果:全部" style="width: 150px;" clearable>
                    <el-option label="全部" value="all"></el-option>
                    <el-option label="批准" value="approved"></el-option>
                    <el-option label="驳回" value="rejected"></el-option>
                </el-select>
                <div class="date-item">
                    <span>处理时间:</span>
                    <el-date-picker
                        v-model="handleDate"
                        type="date"
                        placeholder="请选择处理时间"
                        value-format="YYYY-MM-DD"
                        style="width: 180px;"
                        :editable="false"
                        :disabled-date="(d: Date) => d.getTime() > Date.now()"
                    ></el-date-picker>
                </div>
                <div class="count-filter">
                    <span class="label">下架申请数量</span>
                    <el-input-number
                        v-model="applyCount.min"
                        :min="1"
                        :controls="false"
                        placeholder="最少"
                        style="width: 100px;"
                    ></el-input-number>
                    <span class="separator">至</span>
                    <el-input-number
                        v-model="applyCount.max"
                        :min="1"
                        :controls="false"
                        placeholder="最多"
                        style="width: 100px;"
                    ></el-input-number>
                </div>
            </div>
            <div class="button-group">
                <el-button type="success" size="small" :disabled="doing" @click="findRecords">查询</el-button>
                <el-button size="small" @click="resetFilter">重置</el-button>
                <el-divider direction="vertical" />
                <el-button size="small" type="danger" plain @click="handleClearAll">清空所有记录</el-button>
            </div>
        </div>

        <!-- 聚合表格：一行一条审批记录，展开后显示该帖子的下架申请明细 -->
        <div class="examinerecord-table">
            <el-table
                :data="tableData"
                row-key="post_id"
                stripe
                style="width: 100%;"
                empty-text="暂无审批记录"
            >
                <el-table-column type="expand" width="48">
                    <template #default="{ row }">
                        <div class="examine-detail">
                            <div class="detail-head">
                                <span class="detail-title">下架申请明细</span>
                                <el-tag type="info" size="small" effect="plain" round>
                                    共 {{ row.application_count }} 条
                                </el-tag>
                            </div>
                            <el-table
                                :data="row.applications || []"
                                size="small"
                                class="detail-table"
                                empty-text="暂无申请明细"
                            >
                                <el-table-column type="index" label="#" width="56" align="center"></el-table-column>
                                <el-table-column
                                    prop="applicant_name"
                                    label="提交人"
                                    width="150"
                                    show-overflow-tooltip
                                ></el-table-column>
                                <el-table-column label="申请状态" width="120">
                                    <template #default="{ row: detail }">
                                        <el-tag size="small" effect="plain">{{ detail.status_text }}</el-tag>
                                    </template>
                                </el-table-column>
                                <el-table-column label="下架理由" min-width="260" show-overflow-tooltip>
                                    <template #default="{ row: detail }">
                                        <span v-if="detail.apply_reason">{{ detail.apply_reason }}</span>
                                        <span v-else class="empty-text">未填写</span>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="created_at" label="提交时间" width="180"></el-table-column>
                            </el-table>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="被审批帖子" min-width="180">
                    <template #default="{ row }">
                        <div class="post-cell">
                            <span class="post-id">#{{ row.post_id }}</span>
                            <el-tag type="info" size="small" effect="plain">{{ row.post_type }}</el-tag>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column prop="author" label="作者" min-width="140" show-overflow-tooltip></el-table-column>

                <el-table-column label="审批结果" width="110" align="center">
                    <template #default="{ row }">
                        <el-tag :type="resultTagType(row.status)" size="small" effect="light">
                            {{ row.status_text }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="审批理由" min-width="240" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span v-if="row.handle_reason">{{ row.handle_reason }}</span>
                        <span v-else class="empty-text">未填写</span>
                    </template>
                </el-table-column>

                <el-table-column prop="handled_at" label="处理时间" min-width="180"></el-table-column>

                <el-table-column label="下架申请数量" width="140" align="center">
                    <template #default="{ row }">
                        <span class="apply-count">
                            {{ row.application_count }}
                            <span class="unit">条</span>
                        </span>
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" type="primary" @click="viewPost(row.post_id)">查看帖子</el-button>
                        <el-button size="small" type="danger" plain @click="handleDelete(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- 分页 -->
        <div class="page-tool">
            <el-pagination
                v-model:current-page="page"
                :total="total"
                layout="total,prev,pager,next"
                background
                :disabled="doing"
                @current-change="Loadpage"
            ></el-pagination>
        </div>
    </div>
</template>

<style scoped lang="scss">
.examinerecord-container {
    width: 95%;
    height: 100%;

    .examinerecord-tool {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        align-items: center;
        justify-content: space-between;

        .filter-group {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            align-items: center;
            min-width: 0;

            .date-item {
                display: flex;
                gap: 10px;
                align-items: center;
                white-space: nowrap;
            }

            .count-filter {
                display: flex;
                gap: 8px;
                align-items: center;

                .label {
                    font-size: 14px;
                    color: var(--el-text-color-regular);
                    white-space: nowrap;
                }

                .separator {
                    font-size: 14px;
                    color: var(--el-text-color-secondary);
                }
            }
        }

        .button-group {
            display: flex;
            flex-shrink: 0;
            gap: 8px;
            align-items: center;

            :deep(.el-divider--vertical) {
                margin: 0 4px;
            }
        }
    }

    .examinerecord-table {
        width: 100%;
        margin-top: 15px;

        /* 去掉展开行自带内边距，改为自定义明细面板间距 */
        :deep(.el-table__expanded-cell) {
            padding: 0;
            background-color: var(--el-fill-color-lighter);
        }
    }

    .post-cell {
        display: flex;
        gap: 8px;
        align-items: center;
        min-width: 0;
    }

    .post-id {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
    }

    .apply-count {
        font-weight: 600;
        color: var(--el-color-danger);

        .unit {
            margin-left: 2px;
            font-size: 12px;
            font-weight: 400;
            color: var(--el-text-color-secondary);
        }
    }

    .examine-detail {
        padding: 14px 20px 18px;
    }

    .detail-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
    }

    .detail-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--el-text-color-primary);
    }

    .detail-table {
        width: 100%;
        background-color: transparent;
    }

    .empty-text {
        font-size: 12px;
        color: var(--el-text-color-placeholder);
    }

    .page-tool {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
    }
}

@media (width <= 900px) {
    .examinerecord-container .examinerecord-tool {
        flex-direction: column;
        align-items: stretch;

        .button-group {
            flex-wrap: wrap;
        }
    }
}
</style>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import { useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import {
    type approveRecordList,
    getApproveRecord,
    delApproveRecord,
    clearApproveRecords
} from "@/api/applies"
import { useMultiTagsStoreHook } from "@/store/modules/multiTags"

defineOptions({
    name: "ExamineRecord"
})

/** 审批记录列表与分页 */
const tableData = ref<approveRecordList[]>([])
const total = ref(0)
const page = ref(1)

/** 查询条件：审批结果、处理时间、下架申请数量区间 */
const result = ref<"all" | "approved" | "rejected" | "">("")
const handleDate = ref("")
const applyCount = reactive<{ min: number | null; max: number | null }>({
    min: null,
    max: null
})

/** 已经生效的查询条件：翻页、重置、删除后刷新都沿用这份条件 */
type RecordFilter = {
    status?: "all" | "approved" | "rejected"
    date?: string
    apply_count_min?: number
    apply_count_max?: number
}
const appliedFilter = ref<RecordFilter>({})

/** 请求序号：防止快速翻页时旧请求覆盖新数据 */
let requestId = 0

/** 加载当前页，filter 为本次请求使用的查询条件 */
const fetchPage = async (filter: RecordFilter) => {
    const id = ++requestId
    try {
        const res = await getApproveRecord({ page: page.value, ...filter })
        if (id !== requestId) return "stale" as const
        if (res.status === 0) {
            tableData.value = res.data.list
            total.value = res.data.total
            return "success" as const
        }
        ElMessage.warning(res.msg || "查询失败")
        return "fail" as const
    } catch {
        if (id !== requestId) return "stale" as const
        ElMessage.warning("服务器或者网络异常")
        return "fail" as const
    }
}

/** 翻页：始终使用已生效的查询条件，避免用了没点查询的条件 */
const Loadpage = async () => {
    await fetchPage(appliedFilter.value)
}

onMounted(async () => {
    await Loadpage()
})

/** 查询 */
const doing = ref(false) // 防止用户重复点击查询
const findRecords = async () => {
    const hasDate = !!handleDate.value
    const min = applyCount.min
    const max = applyCount.max
    if (result.value === "" && !hasDate && min === null && max === null) {
        return ElMessage.warning("查询条件不能为空")
    }
    if (min !== null && max !== null && min > max) {
        return ElMessage.warning("下架申请数量区间有误，最少不能大于最多")
    }
    if (doing.value) return
    doing.value = true

    const filter: RecordFilter = {
        status: result.value || undefined,
        date: handleDate.value || undefined,
        apply_count_min: min ?? undefined,
        apply_count_max: max ?? undefined
    }
    const previousPage = page.value
    page.value = 1
    try {
        const state = await fetchPage(filter)
        if (state === "success") {
            // 查询成功后才让条件生效，避免查询失败后翻页用了未生效的条件
            appliedFilter.value = filter
        } else if (state === "fail") {
            // 查询失败时恢复页码，保证分页与当前展示的数据一致
            page.value = previousPage
        }
    } finally {
        doing.value = false
    }
}

/** 重置查询条件 */
const resetFilter = async () => {
    result.value = ""
    handleDate.value = ""
    applyCount.min = null
    applyCount.max = null
    appliedFilter.value = {}
    page.value = 1
    await Loadpage()
}

/** 删除后刷新：当前页被删空时自动回退一页 */
const refreshAfterDelete = async (deletedCount: number) => {
    if (tableData.value.length <= deletedCount && page.value > 1) {
        page.value -= 1
    }
    await Loadpage()
}

/** 删除单条审批记录 */
const handleDelete = async (row: approveRecordList) => {
    try {
        await ElMessageBox.confirm(
            `确定删除帖子 #${row.post_id} 的审批记录吗？删除后不可恢复。`,
            "删除确认",
            {
                type: "warning",
                confirmButtonText: "确定删除",
                cancelButtonText: "取消",
                closeOnClickModal: false
            }
        )
    } catch {
        return
    }

    try {
        const res = await delApproveRecord(row.record_id)
        if (res.status === 0) {
            ElMessage.success(res.msg || "删除成功")
            await refreshAfterDelete(1)
        } else {
            ElMessage.warning(res.msg || "删除失败")
        }
    } catch {
        ElMessage.warning("服务器或者网络异常")
    }
}

/** 清空所有审批记录 */
const handleClearAll = async () => {
    if (!total.value) {
        return ElMessage.warning("暂无审批记录")
    }

    try {
        await ElMessageBox.confirm(
            `确定清空全部 ${total.value} 条审批记录吗？该操作不可恢复！`,
            "清空所有记录",
            {
                type: "error",
                confirmButtonText: "确定清空",
                cancelButtonText: "取消",
                closeOnClickModal: false
            }
        )
    } catch {
        return
    }

    try {
        const res = await clearApproveRecords()
        if (res.status === 0) {
            ElMessage.success(res.msg || "已清空所有记录")
            page.value = 1
            await Loadpage()
        } else {
            ElMessage.warning(res.msg || "清空失败")
        }
    } catch {
        ElMessage.warning("服务器或者网络异常")
    }
}

/** 跳转查看帖子详情 */
const router = useRouter()
const viewPost = (postId: number) => {
    const resolved = router.resolve({ name: "detail", params: { id: postId } })
    useMultiTagsStoreHook().handleTags("push", {
        path: resolved.path,
        name: resolved.name,
        params: resolved.params,
        meta: { ...resolved.meta, showLink: true }
    })
    router.push({ name: "detail", params: { id: postId } })
}

/** 审批结果标签颜色：批准为成功色，驳回为危险色 */
const resultTagType = (status: string) => {
    if (status === "approved") return "success"
    if (status === "rejected") return "danger"
    return "warning"
}
</script>
