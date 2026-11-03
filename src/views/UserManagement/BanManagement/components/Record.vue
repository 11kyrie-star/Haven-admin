<template>
  <div class="record-container">
    <!-- 工具栏 -->
    <div class="record-tool">
      <div class="filter-group">
        <div class="date-item">
          <span>处理时间:</span>
          <el-date-picker
            v-model="handleDate"
            type="date"
            placeholder="请选择处理时间"
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
          @click="findRecords"
        >
          查询
        </el-button>
        <el-button size="small" :disabled="loading" @click="resetFilter">
          重置
        </el-button>
      </div>
    </div>

    <!-- 封号记录表格 -->
    <div class="record-table">
      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="record_id"
        stripe
        style="width: 100%"
        empty-text="暂无封号记录"
      >
        <el-table-column label="处理时间" min-width="180">
          <template #default="{ row }">
            <span v-if="row.handled_at" class="time-text">
              {{ row.handled_at }}
            </span>
            <span v-else class="empty-text">—</span>
          </template>
        </el-table-column>

        <el-table-column label="封禁理由" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.ban_reason">{{ row.ban_reason }}</span>
            <span v-else class="empty-text">未填写</span>
          </template>
        </el-table-column>

        <el-table-column label="封禁时间" min-width="180">
          <template #default="{ row }">
            <span v-if="row.ban_until" class="time-text">
              {{ row.ban_until }}
            </span>
            <span v-else class="empty-text">—</span>
          </template>
        </el-table-column>

        <el-table-column label="封禁的用户昵称" min-width="180">
          <template #default="{ row }">
            <span class="nickname">{{ row.nickname }}</span>
          </template>
        </el-table-column>

        <el-table-column label="账号状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.account_status === 'banned' ? 'danger' : 'success'"
              size="small"
              effect="light"
            >
              {{ row.account_status_text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewUser(row)">
              查看用户信息
            </el-button>
            <el-button
              size="small"
              type="warning"
              plain
              :disabled="revokeSubmitting || row.account_status !== 'banned'"
              :title="
                row.account_status !== 'banned'
                  ? '该账号当前未被封禁，无需撤销'
                  : ''
              "
              @click="revokeBan(row)"
            >
              撤销
            </el-button>
            <el-button
              size="small"
              type="danger"
              plain
              :disabled="deleting || row.account_status === 'banned'"
              :title="
                row.account_status === 'banned'
                  ? '账号处于封禁状态，请先撤销封禁'
                  : ''
              "
              @click="handleDelete(row)"
            >
              删除
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

    <ReCancelWindow
      v-model:visible="revokeVisible"
      :nickname="revokeNickname"
      :loading="revokeSubmitting"
      @confirm="handleRevoke"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  cancelBanApi,
  delBanRecordApi,
  getBanRecordsApi,
  type banRecordList
} from "@/api/ban";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import ReCancelWindow from "./Re-CancelWindow.vue";

defineOptions({
  name: "BanRecord"
});

/** 已生效的查询条件：只有点击「查询」且请求成功后才更新 */
type QueryParams = {
  date?: string;
};

const tableData = ref<banRecordList[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

/** 处理时间输入框：未点击查询前只存在于表单，不参与分页 */
const handleDate = ref<string | null>("");

/**
 * 已生效的查询条件
 * 翻页始终沿用这份条件，避免「改了日期却没点查询」影响分页结果
 */
const appliedQuery = ref<QueryParams>({});

const loading = ref(false);

/** 删除请求进行中：防止重复提交 */
const deleting = ref(false);

/** 请求序号：防止快速翻页或连续查询时旧请求覆盖新数据 */
let requestId = 0;

/** 拉取当前页：filter 为本次请求使用的查询条件 */
const fetchPage = async (filter: QueryParams) => {
  const id = ++requestId;
  loading.value = true;
  try {
    const res = await getBanRecordsApi({
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
const findRecords = async () => {
  if (loading.value) return;

  const filter: QueryParams = {
    date: handleDate.value || undefined
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
  handleDate.value = "";
  appliedQuery.value = {};
  page.value = 1;
  await Loadpage();
};

/** 查看用户信息：先补标签，再带用户 ID 跳转到隐藏的用户详情路由 */
const router = useRouter();

const viewUser = (row: banRecordList) => {
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

/** 撤销弹窗状态 */
const revokeVisible = ref(false);
const revokeUserid = ref(0);
const revokeNickname = ref("");
/** 撤销请求进行中：防止重复提交，并让弹窗禁用关闭 */
const revokeSubmitting = ref(false);

/** 打开撤销弹窗：仅封禁中的账号可撤销 */
const revokeBan = (row: banRecordList) => {
  if (row.account_status !== "banned") {
    return ElMessage.warning("该账号当前未被封禁，无需撤销");
  }
  revokeUserid.value = row.user_id;
  revokeNickname.value = row.nickname;
  revokeVisible.value = true;
};

/** 确认撤销：成功后关闭弹窗并按当前页重新拉取数据 */
const handleRevoke = async (reason: string) => {
  if (revokeSubmitting.value) return;
  revokeSubmitting.value = true;
  try {
    const res = await cancelBanApi(revokeUserid.value, reason);
    if (res.status === 0) {
      ElMessage.success(res.msg || "撤销成功");
      revokeVisible.value = false;
      await Loadpage();
    } else {
      ElMessage.warning(res.msg || "撤销失败");
    }
  } catch {
    ElMessage.warning("服务器或者网络异常");
  } finally {
    revokeSubmitting.value = false;
  }
};

/** 删除记录 */
const handleDelete = async (row: banRecordList) => {
  if (row.account_status === "banned") {
    return ElMessage.warning("该账号仍处于封禁状态，请先撤销封禁再删除记录");
  }
  if (deleting.value) return;

  try {
    await ElMessageBox.confirm(
      `确定删除用户「${row.nickname}」的封禁记录吗？删除后不可恢复。`,
      "删除确认",
      {
        type: "warning",
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        closeOnClickModal: false
      }
    );
  } catch {
    return;
  }

  deleting.value = true;
  try {
    const res = await delBanRecordApi(row.record_id);
    if (res.status === 0) {
      ElMessage.success(res.msg || "删除成功");
      await Loadpage();
    } else {
      ElMessage.warning(res.msg || "删除失败");
    }
  } catch {
    ElMessage.warning("服务器或者网络异常");
  } finally {
    deleting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.record-container {
  width: 95%;
  height: 100%;

  .record-tool {
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

  .record-table {
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
  .record-container .record-tool {
    flex-direction: column;
    align-items: stretch;

    .button-group {
      flex-wrap: wrap;
    }
  }
}
</style>
