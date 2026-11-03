<template>
  <div class="complain-container">
    <!-- 工具栏 -->
    <div class="complain-tool">
      <div class="filter-group">
        <el-select
          v-model="status"
          placeholder="申诉状态:全部"
          clearable
          style="width: 150px"
        >
          <el-option label="全部" value="all" />
          <el-option label="待处理" value="pending" />
          <el-option label="驳回" value="rejected" />
          <el-option label="同意" value="approved" />
        </el-select>

        <div class="date-item">
          <span>申诉时间:</span>
          <el-date-picker
            v-model="complainDate"
            type="date"
            placeholder="请选择申诉时间"
            value-format="YYYY-MM-DD"
            style="width: 180px"
            :editable="false"
            :disabled-date="(d: Date) => d.getTime() > Date.now()"
          />
        </div>
      </div>

      <div class="button-group">
        <el-button
          type="success"
          size="small"
          :disabled="loading"
          @click="findComplains"
        >
          查询
        </el-button>
        <el-button size="small" :disabled="loading" @click="resetFilter">
          重置
        </el-button>
      </div>
    </div>

    <!-- 申诉列表 -->
    <div class="complain-table">
      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="appeal_id"
        stripe
        style="width: 100%"
        empty-text="暂无用户申诉"
      >
        <el-table-column label="申诉时间" min-width="180">
          <template #default="{ row }">
            <span v-if="row.appeal_at" class="time-text">
              {{ row.appeal_at }}
            </span>
            <span v-else class="empty-text">—</span>
          </template>
        </el-table-column>

        <el-table-column label="申诉理由" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.appeal_reason">{{ row.appeal_reason }}</span>
            <span v-else class="empty-text">未填写</span>
          </template>
        </el-table-column>

        <el-table-column label="用户昵称" min-width="160">
          <template #default="{ row }">
            <span class="nickname">{{ row.nickname }}</span>
          </template>
        </el-table-column>

        <el-table-column label="申诉状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              :type="statusTagType(row.status)"
              size="small"
              effect="light"
            >
              {{ row.status_text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="驳回理由" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.reject_reason">{{ row.reject_reason }}</span>
            <span v-else class="empty-text">—</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewUser(row)">
              查看用户信息
            </el-button>
            <el-button
              size="small"
              type="warning"
              plain
              :disabled="
                rejectSubmitting ||
                approveSubmitting ||
                row.status !== 'pending'
              "
              :title="
                row.status !== 'pending' ? '该申诉已处理，不可重复操作' : ''
              "
              @click="rejectComplain(row)"
            >
              驳回
            </el-button>
            <el-button
              size="small"
              type="success"
              plain
              :disabled="
                rejectSubmitting ||
                approveSubmitting ||
                row.status !== 'pending'
              "
              :title="
                row.status !== 'pending' ? '该申诉已处理，不可重复操作' : ''
              "
              @click="agreeComplain(row)"
            >
              同意
            </el-button>
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
        :disabled="loading"
        @current-change="Loadpage"
      />
    </div>

    <CoRejectWindow
      v-model:visible="rejectVisible"
      :nickname="rejectNickname"
      :loading="rejectSubmitting"
      @confirm="handleReject"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getBanAppealsApi,
  rejectBanAppeal,
  approveAppealApi,
  type banAppealsList
} from "@/api/ban";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import CoRejectWindow from "./Co-RejectWindow.vue";

defineOptions({
  name: "BanComplain"
});

/** 已生效的查询条件：只有点击「查询」且请求成功后才更新 */
type QueryParams = {
  status?: string;
  date?: string;
};

/** 分页数据 */
const tableData = ref<banAppealsList[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

/** 查询表单：未点击查询前只存在于表单，不参与分页 */
const status = ref("");
const complainDate = ref<string | null>("");

/**
 * 已生效的查询条件
 * 翻页始终沿用这份条件，避免「改了筛选却没点查询」影响分页结果
 */
const appliedQuery = ref<QueryParams>({});

const loading = ref(false);

/** 请求序号：防止快速翻页或连续查询时旧请求覆盖新数据 */
let requestId = 0;

/** 拉取当前页：filter 为本次请求使用的查询条件 */
const fetchPage = async (filter: QueryParams) => {
  const id = ++requestId;
  loading.value = true;
  try {
    const res = await getBanAppealsApi({
      page: page.value,
      size: pageSize.value,
      ...filter
    });
    if (id !== requestId) return "stale" as const;
    if (res.status === 0) {
      tableData.value = res.data.list;
      total.value = res.data.total;
      return "success" as const;
    }
    ElMessage.warning(res.msg || "查询失败");
    return "fail" as const;
  } catch {
    if (id !== requestId) return "stale" as const;
    ElMessage.warning("服务器或者网络异常");
    return "fail" as const;
  } finally {
    if (id === requestId) loading.value = false;
  }
};

/** 翻页：只使用已生效的查询条件 */
const Loadpage = async () => {
  await fetchPage(appliedQuery.value);
};

onMounted(async () => {
  await Loadpage();
});

/** 查询：页码回到第一页，成功后新条件才生效 */
const findComplains = async () => {
  if (loading.value) return;

  const filter: QueryParams = {
    status: status.value === "all" ? undefined : status.value || undefined,
    date: complainDate.value || undefined
  };
  const previousPage = page.value;
  page.value = 1;

  const state = await fetchPage(filter);
  if (state === "success") {
    appliedQuery.value = filter;
  } else if (state === "fail") {
    // 查询失败时恢复页码，保证分页与当前展示的数据一致
    page.value = previousPage;
  }
};

/** 重置：清空表单与已生效条件，页码回到第一页 */
const resetFilter = async () => {
  status.value = "";
  complainDate.value = "";
  appliedQuery.value = {};
  page.value = 1;
  await Loadpage();
};

/** 申诉状态对应的标签类型 */
const statusTagType = (value: string) => {
  if (value === "approved" || value === "agree") return "success";
  if (value === "rejected" || value === "reject") return "danger";
  return "warning";
};

/** 查看用户信息：先补标签，再带用户 ID 跳转到隐藏的用户详情路由 */
const router = useRouter();

const viewUser = (row: banAppealsList) => {
  if (!router.hasRoute("userdetail")) {
    ElMessage.warning("暂无权限查看该用户信息");
    return;
  }
  const resolved = router.resolve({
    name: "userdetail",
    params: { id: row.user_id }
  });
  useMultiTagsStoreHook().handleTags("push", {
    path: resolved.path,
    name: resolved.name,
    params: resolved.params,
    meta: { ...resolved.meta, showLink: true }
  });
  router.push({ name: "userdetail", params: { id: row.user_id } });
};

/** 驳回弹窗状态 */
const rejectVisible = ref(false);
const rejectAppealId = ref(0);
const rejectNickname = ref("");
/** 驳回请求进行中：防止重复提交，并让弹窗禁用关闭 */
const rejectSubmitting = ref(false);

/** 打开驳回弹窗：仅待处理的申诉可驳回 */
const rejectComplain = (row: banAppealsList) => {
  if (row.status !== "pending") {
    return ElMessage.warning("该申诉已处理，不可重复操作");
  }
  rejectAppealId.value = row.appeal_id;
  rejectNickname.value = row.nickname;
  rejectVisible.value = true;
};

/** 确认驳回：成功后关闭弹窗并按当前页码与已生效条件重新拉取数据 */
const handleReject = async (reason: string) => {
  if (rejectSubmitting.value) return;
  rejectSubmitting.value = true;
  try {
    const res = await rejectBanAppeal(rejectAppealId.value, reason);
    if (res.status === 0) {
      ElMessage.success(res.msg || "驳回成功");
      rejectVisible.value = false;
      await Loadpage();
    } else {
      ElMessage.warning(res.msg || "驳回失败");
    }
  } catch {
    ElMessage.warning("服务器或者网络异常");
  } finally {
    rejectSubmitting.value = false;
  }
};

/** 同意请求进行中：防止重复提交 */
const approveSubmitting = ref(false);

/** 同意申诉：二次确认后调用接口，成功后按当前页重新拉取数据 */
const agreeComplain = async (row: banAppealsList) => {
  if (row.status !== "pending") {
    return ElMessage.warning("该申诉已处理，不可重复操作");
  }
  if (approveSubmitting.value) return;

  try {
    await ElMessageBox.confirm(
      `确定同意用户「${row.nickname}」的申诉吗？同意后该账号将解除封禁，此操作会推翻原有封禁决定。`,
      "同意申诉确认",
      {
        type: "warning",
        confirmButtonText: "确定同意",
        cancelButtonText: "取消",
        closeOnClickModal: false
      }
    );
  } catch {
    return;
  }

  approveSubmitting.value = true;
  try {
    const res = await approveAppealApi(row.user_id);
    if (res.status === 0) {
      ElMessage.success(res.msg || "同意成功");
      await Loadpage();
    } else {
      ElMessage.warning(res.msg || "同意失败");
    }
  } catch {
    ElMessage.warning("服务器或者网络异常");
  } finally {
    approveSubmitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.complain-container {
  width: 95%;
  height: 100%;

  .complain-tool {
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
    }

    .button-group {
      display: flex;
      flex-shrink: 0;
      gap: 8px;
      align-items: center;
    }
  }

  .complain-table {
    width: 100%;
    margin-top: 15px;
  }

  .nickname {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .time-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
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
  .complain-container .complain-tool {
    flex-direction: column;
    align-items: stretch;

    .button-group {
      flex-wrap: wrap;
    }
  }
}
</style>
