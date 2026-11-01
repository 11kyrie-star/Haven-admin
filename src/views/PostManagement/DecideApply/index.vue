<template>
    <div class="decideapply-container">
        <!-- 工具栏 -->
        <div class="decideapply-tool">
            <div class="filter">
                <el-date-picker
                    v-model="dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="最早申请时间"
                    end-placeholder="最晚申请时间"
                    value-format="YYYY-MM-DD"
                    style="width: 280px;"
                    :editable="false"
                    :disabled-date="(d: Date) => d.getTime() > Date.now()"
                ></el-date-picker>
                <div class="count-filter">
                    <span class="label">申请数量</span>
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
            <div class="button">
                <el-button type="success" size="small" :disabled="doing" @click="handleSearch">查询</el-button>
                <el-button size="small" @click="handleReset">重置</el-button>
            </div>
        </div>

        <!-- 聚合表格：一行对应一条帖子，展开后显示该帖子的所有下架申请明细 -->
        <div class="decideapply-table">
            <el-table stripe :data="tableData" row-key="post_id" style="width: 100%;">
                <el-table-column type="expand" width="56">
                    <template #default="scope">
                        <div class="expand-panel">
                            <div class="expand-title">
                                <span class="title-text">下架申请明细</span>
                                <span class="title-count">共 {{ scope.row.apply_count }} 条</span>
                            </div>
                            <el-table
                                :data="scope.row.applications"
                                size="small"
                                class="apply-detail-table"
                                empty-text="暂无申请明细"
                            >
                                <el-table-column type="index" label="序号" width="70" align="center"></el-table-column>
                                <el-table-column label="提交人" prop="applicant_name" min-width="160" show-overflow-tooltip></el-table-column>
                                <el-table-column label="提交时间" prop="created_at" min-width="180"></el-table-column>
                                <el-table-column label="申请状态" min-width="130">
                                    <template #default="scope">
                                        <el-tag size="small" effect="plain">{{ scope.row.status_text }}</el-tag>
                                    </template>
                                </el-table-column>
                                <el-table-column label="下架理由" prop="apply_reason" min-width="360" show-overflow-tooltip></el-table-column>
                            </el-table>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="帖子类型" min-width="140">
                    <template #default="scope">
                        <el-tag size="small" effect="plain" type="info">{{ scope.row.post_type }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="帖子ID" prop="post_id" min-width="120"></el-table-column>
                <el-table-column label="作者" prop="author" min-width="160" show-overflow-tooltip></el-table-column>
                <el-table-column label="下架申请数量" width="140" align="center">
                    <template #default="scope">
                        <span class="apply-count">
                            {{ scope.row.apply_count }}
                            <span class="unit">条</span>
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="最早申请时间" prop="first_apply_at" min-width="180"></el-table-column>
                <el-table-column label="最近申请时间" min-width="180">
                    <template #default="scope">
                        <span class="latest-time">{{ scope.row.last_apply_at }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="260" fixed="right">
                    <template #default="scope">
                        <el-button size="small" type="primary" @click="handleViewPost(scope.row)">查看帖子</el-button>
                        <el-button size="small" type="success" @click="handleApprove(scope.row)">批准</el-button>
                        <el-button size="small" type="danger" @click="handleReject(scope.row)">驳回</el-button>
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
                @current-change="handlePageChange"
            ></el-pagination>
        </div>

        <!-- 驳回弹窗 -->
        <reject-window
            v-model:visible="rejectVisible"
            v-model:post_id="rejectPostId"
            @submit="Loadpage"
        ></reject-window>

        <!-- 批准弹窗 -->
        <approve-window
            v-model:visible="approveVisible"
            v-model:post_id="approvePostId"
            @submit="Loadpage"
        ></approve-window>
    </div>
</template>

<style scoped lang="scss">
.decideapply-container {
    width: 95%;
    height: 100%;

    .decideapply-tool {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 16px;

        .filter {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 20px;

            .count-filter {
                display: flex;
                align-items: center;
                gap: 8px;

                .label {
                    font-size: 14px;
                    color: var(--el-text-color-regular);
                }

                .separator {
                    font-size: 14px;
                    color: var(--el-text-color-secondary);
                }
            }
        }
    }

    .decideapply-table {
        width: 100%;
        margin-top: 20px;

        /* 去掉 Element Plus 展开行自带的默认内边距，改为自定义面板间距 */
        :deep(.el-table__expanded-cell) {
            padding: 0 !important;
            background-color: var(--el-fill-color-lighter);
        }
    }

    /* 展开行内的申请明细分组 */
    .expand-panel {
        padding: 12px 24px 18px 56px;

        .expand-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;

            .title-text {
                font-size: 14px;
                font-weight: 600;
                color: var(--el-text-color-primary);
            }

            .title-count {
                font-size: 12px;
                color: var(--el-text-color-secondary);
            }
        }

        .apply-detail-table {
            width: 100%;
        }
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

    .latest-time {
        color: var(--el-color-warning);
    }

    .page-tool {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
    }
}
</style>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { type approveList, getApproveOutsApi } from "@/api/applies"
import { useMultiTagsStoreHook } from "@/store/modules/multiTags"
import RejectWindow from "./components/rejectWindow.vue"
import ApproveWindow from "./components/approveWindow.vue"

defineOptions({
    name: "PostExame"
})

//分页要用到的数据
const total = ref(0)
const page = ref(1)

//查询条件：时间范围、申请数量范围
const dateRange = ref<[string, string] | null>(null)
const applyCount = reactive<{ min: number | null; max: number | null }>({
    min: null,
    max: null
})

//已经生效的查询条件，翻页时复用，避免用户改了筛选条件却没点查询就翻页
type ApproveFilter = {
    start_date?: string
    end_date?: string
    apply_count_min?: number
    apply_count_max?: number
}
const appliedFilter = ref<ApproveFilter>({})

//聚合表格数据
const tableData = ref<approveList[]>([])

//请求序号，用于防止异步竞态
let requestId = 0

//加载当前页数据，filter 为本次请求使用的查询条件
//返回 success / fail / stale，让查询逻辑判断条件是否生效
const fetchPage = async (filter: ApproveFilter): Promise<"success" | "fail" | "stale"> => {
    const id = ++requestId
    try {
        const res = await getApproveOutsApi({
            page: page.value,
            ...filter
        })
        if (id !== requestId) return "stale"
        if (res.status === 0) {
            tableData.value = res.data.list
            total.value = res.data.total
            return "success"
        }
        ElMessage.warning(res.msg || "服务器或者网络异常")
        return "fail"
    } catch {
        if (id !== requestId) return "stale"
        ElMessage.warning("服务器或者网络异常")
        return "fail"
    }
}

//翻页、重置、批准/驳回成功后刷新，始终使用已生效的查询条件
const Loadpage = async () => {
    await fetchPage(appliedFilter.value)
}

onMounted(async () => {
    await Loadpage()
})

//查询
const doing = ref(false) //防止用户重复点击查询
const handleSearch = async () => {
    const hasDate = !!dateRange.value?.[0]
    const min = applyCount.min
    const max = applyCount.max
    if (!hasDate && min === null && max === null) {
        return ElMessage.warning("查询条件不能为空")
    }
    if (min !== null && max !== null && min > max) {
        return ElMessage.warning("申请数量区间有误，最少不能大于最多")
    }
    if (doing.value) return
    doing.value = true

    const filter: ApproveFilter = {
        start_date: dateRange.value?.[0] || undefined,
        end_date: dateRange.value?.[1] || undefined,
        apply_count_min: min ?? undefined,
        apply_count_max: max ?? undefined
    }
    const previousPage = page.value
    page.value = 1
    try {
        const result = await fetchPage(filter)
        if (result === "success") {
            //查询成功后才让条件生效，避免请求失败后翻页使用未生效的条件
            appliedFilter.value = filter
        } else if (result === "fail") {
            //查询失败时恢复页码，保证分页与当前展示的数据一致
            page.value = previousPage
        }
    } finally {
        doing.value = false
    }
}

//重置查询条件
const handleReset = async () => {
    dateRange.value = null
    applyCount.min = null
    applyCount.max = null
    appliedFilter.value = {}
    page.value = 1
    await Loadpage()
}

//翻页，页码由 el-pagination 的 v-model 自动更新
const handlePageChange = async () => {
    await Loadpage()
}

//查看帖子详情
const router = useRouter()
const handleViewPost = (row: approveList) => {
    const resolved = router.resolve({ name: "detail", params: { id: row.post_id } })
    useMultiTagsStoreHook().handleTags("push", {
        path: resolved.path,
        name: resolved.name,
        params: resolved.params,
        meta: { ...resolved.meta, showLink: true }
    })
    router.push({ name: "detail", params: { id: row.post_id } })
}

//批准弹窗
const approveVisible = ref(false)
const approvePostId = ref(0)

//批准：打开弹窗，接口调用与提示在弹窗内部完成，成功后刷新列表
const handleApprove = (row: approveList) => {
    approvePostId.value = row.post_id
    approveVisible.value = true
}

//驳回弹窗
const rejectVisible = ref(false)
const rejectPostId = ref(0)

//驳回：打开弹窗，接口调用与提示在弹窗内部完成，成功后刷新列表
const handleReject = (row: approveList) => {
    rejectPostId.value = row.post_id
    rejectVisible.value = true
}
</script>
