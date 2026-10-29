<template>
  <div class="reportrecord-container">
    <div class="reportrecord-tool">
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
        <el-button type="success" size="small" @click="findRecords">
          查询
        </el-button>
        <el-button size="small" @click="resetFilter">重置</el-button>
        <el-divider direction="vertical" />
        <el-button size="small" type="warning" plain @click="handleClearPage">
          清空当前页
        </el-button>
        <el-button size="small" type="danger" plain @click="handleClearAll">
          清空所有记录
        </el-button>
      </div>
    </div>

    <div class="reportrecord-table">
      <el-table
        :data="record"
        row-key="post_id"
        stripe
        style="width: 100%"
        empty-text="暂无举报处理记录"
      >
        <!-- 展开行：该帖的历史举报明细（仅留存证据，不显示状态） -->
        <el-table-column type="expand" width="48">
          <template #default="{ row }">
            <div class="report-detail">
              <div class="detail-head">
                <span class="detail-title">举报明细</span>
                <el-tag type="info" size="small" effect="plain" round>
                  共 {{ row.report_count }} 条
                </el-tag>
              </div>

              <el-table
                :data="row.reports || []"
                size="small"
                class="detail-table"
                empty-text="暂无举报明细"
              >
                <el-table-column
                  type="index"
                  label="#"
                  width="56"
                  align="center"
                />
                <el-table-column
                  prop="reporter"
                  label="举报人"
                  width="150"
                  show-overflow-tooltip
                />
                <el-table-column label="举报理由" min-width="220">
                  <template #default="{ row: detail }">
                    <div v-if="detail.reasons?.length" class="reason-tags">
                      <el-tag
                        v-for="reason in detail.reasons"
                        :key="reason"
                        type="info"
                        size="small"
                        effect="plain"
                      >
                        {{ reason }}
                      </el-tag>
                    </div>
                    <span v-else class="empty-text">未填写</span>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="description"
                  label="补充说明"
                  min-width="220"
                  show-overflow-tooltip
                >
                  <template #default="{ row: detail }">
                    <span v-if="detail.description">
                      {{ detail.description }}
                    </span>
                    <span v-else class="empty-text">未填写</span>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="created_at"
                  label="提交时间"
                  width="180"
                />
              </el-table>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="被举报帖子" min-width="200">
          <template #default="{ row }">
            <div class="post-cell">
              <span class="post-id">#{{ row.post_id }}</span>
              <el-tag type="info" size="small" effect="plain">
                {{ row.post_type }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="举报量" width="100" align="center">
          <template #default="{ row }">
            <span
              class="report-count"
              :class="{ 'is-many': row.report_count >= 3 }"
            >
              {{ row.report_count }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="举报时间" min-width="190">
          <template #default="{ row }">
            <div class="time-cell">
              <div class="time-line">
                <span class="time-label">首次</span>
                <span>{{ firstReportAt(row) }}</span>
              </div>
              <div class="time-line">
                <span class="time-label">最近</span>
                <span>{{ lastReportAt(row) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="处理结果" min-width="180" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.handle_result"
              :type="handleResultType(row.handle_result)"
              size="small"
              effect="light"
              class="result-tag"
            >
              {{ row.handle_result }}
            </el-tag>
            <span v-else class="empty-text">—</span>
          </template>
        </el-table-column>

        <el-table-column label="处理时间" min-width="180">
          <template #default="{ row }">
            <span v-if="row.handled_at" class="handle-time">
              {{ row.handled_at }}
            </span>
            <span v-else class="empty-text">—</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              @click="viewPost(row.post_id)"
            >
              查看帖子
            </el-button>
            <el-button
              size="small"
              type="danger"
              plain
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="page-tool">
      <el-pagination
        v-model:current-page="page"
        :total="total"
        layout="total,prev,pager,next"
        background
        @current-change="Loadpage"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.reportrecord-container {
  width: 95%;
  height: 100%;

  .reportrecord-tool {
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: space-between;

    .filter-group {
      display: flex;
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

      :deep(.el-divider--vertical) {
        margin: 0 4px;
      }
    }
  }

  .reportrecord-table {
    width: 100%;
    margin-top: 15px;

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

  .report-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 48px;
    height: 24px;
    padding: 0 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-color-warning-dark-2);
    background-color: var(--el-color-warning-light-9);
    border-radius: 999px;

    &.is-many {
      color: var(--el-color-danger);
      background-color: var(--el-color-danger-light-9);
    }
  }

  .result-tag {
    height: auto;
    padding: 2px 9px;
    line-height: 1.5;
    white-space: normal;
    word-break: break-word;
    border-radius: 6px;

    :deep(.el-tag__content) {
      white-space: normal;
      line-height: 1.5;
    }
  }

  .time-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .time-line {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .time-label {
    flex-shrink: 0;
    width: 28px;
    color: var(--el-text-color-placeholder);
  }

  .handle-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .report-detail {
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

  .reason-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
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
  .reportrecord-container .reportrecord-tool {
    flex-direction: column;
    align-items: stretch;

    .button-group {
      flex-wrap: wrap;
    }
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getReportRecordApi,
  delReportRecordApi,
  delAllRecordApi,
  type reportRecordRes
} from "@/api/report";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";

defineOptions({
  name: "ReportRecord"
});

/** 举报记录行数据类型 */
type RecordRow = reportRecordRes["data"]["list"][number];

const router = useRouter();

/** 举报记录列表 */
const record = ref<RecordRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
/** 处理时间筛选（YYYY-MM-DD） */
const handleDate = ref<string | null>("");

/** 请求序号：防止快速翻页时旧请求覆盖新数据 */
let requestId = 0;

/** 获取举报记录列表 */
const loadRecords = async () => {
  const id = ++requestId;
  try {
    const res = await getReportRecordApi({
      page: page.value,
      size: pageSize.value,
      date: handleDate.value || undefined
    });
    if (id !== requestId) return;
    if (res.status === 0) {
      record.value = res.data.list;
      total.value = res.data.total;
    } else {
      ElMessage.warning(res.msg || "查询失败");
    }
  } catch {
    ElMessage.warning("服务器或者网络异常");
  }
};

onMounted(() => {
  loadRecords();
});

/** 查询 */
const findRecords = async () => {
  page.value = 1;
  await loadRecords();
};

/** 重置筛选条件 */
const resetFilter = async () => {
  page.value = 1;
  handleDate.value = "";
  await loadRecords();
};

/** 翻页 */
const Loadpage = async () => {
  await loadRecords();
};

/** 删除后刷新：当前页被删空时自动回退一页 */
const refreshAfterDelete = async (deletedCount: number) => {
  if (record.value.length <= deletedCount && page.value > 1) {
    page.value -= 1;
  }
  await loadRecords();
};

/** 删除单条记录（按帖子聚合的整条举报记录） */
const handleDelete = async (row: RecordRow) => {
  try {
    await ElMessageBox.confirm(
      `确定删除帖子 #${row.post_id} 的举报记录吗？删除后不可恢复。`,
      "删除确认",
      {
        type: "warning",
        confirmButtonText: "确定删除",
        cancelButtonText: "取消"
      }
    );
  } catch {
    return;
  }

  try {
    const res = await delReportRecordApi({ post_ids: [row.post_id] });
    if (res.status === 0) {
      ElMessage.success(res.msg || "删除成功");
      await refreshAfterDelete(1);
    } else {
      ElMessage.warning(res.msg || "删除失败");
    }
  } catch {
    ElMessage.warning("服务器或者网络异常");
  }
};

/** 清空当前页记录 */
const handleClearPage = async () => {
  if (!record.value.length) {
    return ElMessage.warning("当前页没有可清空的记录");
  }
  const postIds = record.value.map(item => item.post_id);

  try {
    await ElMessageBox.confirm(
      `确定清空当前页的 ${postIds.length} 条举报记录吗？删除后不可恢复。`,
      "清空确认",
      {
        type: "warning",
        confirmButtonText: "确定清空",
        cancelButtonText: "取消"
      }
    );
  } catch {
    return;
  }

  try {
    const res = await delReportRecordApi({ post_ids: postIds });
    if (res.status === 0) {
      ElMessage.success(res.msg || "清空成功");
      await refreshAfterDelete(postIds.length);
    } else {
      ElMessage.warning(res.msg || "清空失败");
    }
  } catch {
    ElMessage.warning("服务器或者网络异常");
  }
};

/** 清空所有记录 */
const handleClearAll = async () => {
  if (!total.value) {
    return ElMessage.warning("暂无举报记录");
  }

  try {
    await ElMessageBox.confirm(
      `确定清空全部 ${total.value} 条举报记录吗？该操作不可恢复！`,
      "清空所有记录",
      {
        type: "error",
        confirmButtonText: "确定清空",
        cancelButtonText: "取消"
      }
    );
  } catch {
    return;
  }

  try {
    const res = await delAllRecordApi();
    if (res.status === 0) {
      ElMessage.success(res.msg || "已清空所有记录");
      page.value = 1;
      await loadRecords();
    } else {
      ElMessage.warning(res.msg || "清空失败");
    }
  } catch {
    ElMessage.warning("服务器或者网络异常");
  }
};

/** 跳转查看帖子详情 */
const viewPost = (postId: number) => {
  const resolved = router.resolve({ name: "detail", params: { id: postId } });
  useMultiTagsStoreHook().handleTags("push", {
    path: resolved.path,
    name: resolved.name,
    params: resolved.params,
    meta: { ...resolved.meta, showLink: true }
  });
  router.push({ name: "detail", params: { id: postId } });
};

/** 首次举报时间：取明细中的最早时间 */
const firstReportAt = (row: RecordRow) => {
  if (!row.reports?.length) return "—";
  return row.reports.reduce(
    (min, item) => (item.created_at < min ? item.created_at : min),
    row.reports[0].created_at
  );
};

/** 最近举报时间：取明细中的最晚时间 */
const lastReportAt = (row: RecordRow) => {
  if (!row.reports?.length) return "—";
  return row.reports.reduce(
    (max, item) => (item.created_at > max ? item.created_at : max),
    row.reports[0].created_at
  );
};

/** 处理结果标签颜色：下架为危险，驳回为灰色 */
const handleResultType = (result: string) => {
  if (/下架|offline/i.test(result)) return "danger";
  if (/驳回|reject/i.test(result)) return "info";
  return "success";
};
</script>
