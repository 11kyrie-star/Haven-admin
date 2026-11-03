<template>
  <div class="userlist-container">
    <div class="userlist-tool">
      <div class="filter-group">
        <div class="filter-item">
          <span>用户昵称:</span>
          <el-input
            v-model="filterForm.nickname"
            placeholder="请输入用户昵称"
            clearable
            style="width: 160px"
          />
        </div>

        <div class="filter-item">
          <span>用户标签:</span>
          <el-select
            v-model="filterForm.user_tag"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option label="高危用户" value="high" />
            <el-option label="中风险用户" value="medium" />
            <el-option label="绿色用户" value="green" />
          </el-select>
        </div>

        <div class="filter-item">
          <span>被举报次数:</span>
          <el-input-number
            v-model="filterForm.report_count"
            :min="0"
            :controls="false"
            placeholder="最小值"
            style="width: 130px"
          />
        </div>

        <div class="filter-item">
          <span>账号状态:</span>
          <el-select
            v-model="filterForm.account_status"
            placeholder="全部"
            clearable
            style="width: 130px"
          >
            <el-option label="正常" value="normal" />
            <el-option label="已封禁" value="banned" />
          </el-select>
        </div>

        <div class="filter-item">
          <span>发帖数量:</span>
          <el-input-number
            v-model="filterForm.post_count"
            :min="0"
            :controls="false"
            placeholder="最小值"
            style="width: 130px"
          />
        </div>
      </div>

      <div class="button-group">
        <el-button type="success" size="small" @click="findUsers">
          查询
        </el-button>
        <el-button size="small" @click="resetFilter">重置</el-button>
      </div>
    </div>

    <div class="userlist-table">
      <el-table
        v-loading="loading"
        :data="userList"
        row-key="user_id"
        stripe
        style="width: 100%"
        empty-text="暂无用户数据"
      >
        <el-table-column label="用户昵称" min-width="180">
          <template #default="{ row }">
            <span class="nickname">{{ row.nickname }}</span>
          </template>
        </el-table-column>

        <el-table-column label="被举报次数" width="120" align="center">
          <template #default="{ row }">
            <span
              class="report-count"
              :class="{ 'is-many': row.report_count >= 3 }"
            >
              {{ row.report_count }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="最近被举报时间" min-width="190">
          <template #default="{ row }">
            <span v-if="row.last_reported_at" class="time-text">
              {{ row.last_reported_at }}
            </span>
            <span v-else class="empty-text">—</span>
          </template>
        </el-table-column>

        <el-table-column label="用户标签" width="140" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.risk_text"
              :type="riskTagType(row.risk_level)"
              size="small"
              effect="light"
            >
              {{ row.risk_text }}
            </el-tag>
            <span v-else class="empty-text">—</span>
          </template>
        </el-table-column>

        <el-table-column label="账号状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'banned' ? 'danger' : 'success'"
              size="small"
              effect="light"
            >
              {{ row.status_text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="发帖数量" width="110" align="center">
          <template #default="{ row }">
            <span class="post-count">{{ row.post_count }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewUser(row)">
              查看用户信息
            </el-button>
            <el-button
              size="small"
              type="danger"
              plain
              :disabled="row.status === 'banned'"
              @click="banUser(row)"
            >
              封号
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
        @current-change="loadUsers"
      />
    </div>

    <Window
      v-model:visible="banVisible"
      v-model:userid="banUserid"
      :nickname="banNickname"
      :loading="banSubmitting"
      @confirm="handleBan"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  getUserListApi,
  banUserApi,
  type userList as UserRow
} from "@/api/people";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import Window from "./components/Window.vue";

defineOptions({
  name: "UserList"
});

type RiskLevel = "high" | "medium" | "green";
type AccountStatus = "normal" | "banned";

/** 传给后端的查询参数：只保留有值的条件 */
type QueryParams = {
  keyword?: string;
  risk?: RiskLevel;
  status?: AccountStatus;
  report_count_min?: number;
  post_count_min?: number;
};

/** 筛选表单 */
const filterForm = reactive<{
  nickname: string;
  user_tag: RiskLevel | "";
  report_count: number | undefined;
  account_status: AccountStatus | "";
  post_count: number | undefined;
}>({
  nickname: "",
  user_tag: "",
  report_count: undefined,
  account_status: "",
  post_count: undefined
});

/** 用户列表 */
const userList = ref<UserRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const loading = ref(false);

/**
 * 已生效的查询条件：仅点击「查询」时更新
 * 分页始终沿用这份条件，避免用户改了表单却没查询就翻页，导致分页结果被污染
 */
const activeQuery = ref<QueryParams>({});

/** 请求序号：防止快速翻页时旧请求覆盖新数据 */
let requestId = 0;

/** 收集当前表单中的有效查询条件 */
const buildQuery = (): QueryParams => {
  const params: QueryParams = {};
  const keyword = filterForm.nickname.trim();
  if (keyword) params.keyword = keyword;
  if (filterForm.user_tag) params.risk = filterForm.user_tag;
  if (filterForm.account_status) params.status = filterForm.account_status;
  if (typeof filterForm.report_count === "number") {
    params.report_count_min = filterForm.report_count;
  }
  if (typeof filterForm.post_count === "number") {
    params.post_count_min = filterForm.post_count;
  }
  return params;
};

/** 获取用户列表：查询、重置、分页都重新向后端拉取 */
const loadUsers = async () => {
  const currentId = ++requestId;
  loading.value = true;
  try {
    const res = await getUserListApi({
      page: page.value,
      size: pageSize.value,
      ...activeQuery.value
    });
    if (currentId !== requestId) return;
    if (res.status === 0) {
      userList.value = res.data.list;
      total.value = res.data.total;
    } else {
      ElMessage.warning(res.msg || "查询失败");
    }
  } catch {
    if (currentId === requestId) {
      ElMessage.warning("服务器或者网络异常");
    }
  } finally {
    if (currentId === requestId) {
      loading.value = false;
    }
  }
};

onMounted(() => {
  loadUsers();
});

/** 查询：记录本次生效条件，页码回到第一页后重新请求 */
const findUsers = () => {
  activeQuery.value = buildQuery();
  page.value = 1;
  loadUsers();
};

/** 重置：清空表单与已生效条件，页码回到第一页后重新请求 */
const resetFilter = () => {
  filterForm.nickname = "";
  filterForm.user_tag = "";
  filterForm.report_count = undefined;
  filterForm.account_status = "";
  filterForm.post_count = undefined;
  activeQuery.value = {};
  page.value = 1;
  loadUsers();
};

/** 封禁弹窗状态 */
const banVisible = ref(false);
const banUserid = ref(0);
const banNickname = ref("");
/** 封禁请求进行中：防止重复提交，并让弹窗禁用关闭 */
const banSubmitting = ref(false);

/** 查看用户信息：先补标签，再带用户 ID 跳转到隐藏的用户详情路由 */
const router = useRouter();

const viewUser = (row: UserRow) => {
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

/** 打开封禁弹窗 */
const banUser = (row: UserRow) => {
  banUserid.value = row.user_id;
  banNickname.value = row.nickname;
  banVisible.value = true;
};

/** 确认封禁：带上时长调用接口，成功后提示、关闭弹窗并重新拉取当前页数据 */
const handleBan = async (userid: number, reason: string, duration: string) => {
  if (banSubmitting.value) return;
  banSubmitting.value = true;
  try {
    const res = await banUserApi(userid, reason, duration);
    if (res.status === 0) {
      ElMessage.success(res.msg || "封禁成功");
      banVisible.value = false;
      // 当前页只有这一条记录且不是第一页时，封禁后本页会变空，回退一页再刷新
      if (userList.value.length === 1 && page.value > 1) {
        page.value -= 1;
      }
      await loadUsers();
    } else {
      ElMessage.warning(res.msg || "封禁失败");
    }
  } catch {
    ElMessage.warning("服务器或者网络异常");
  } finally {
    banSubmitting.value = false;
  }
};

/** 用户标签颜色 */
const riskTagType = (level: string) => {
  if (level === "high") return "danger";
  if (level === "medium") return "warning";
  if (level === "green") return "success";
  return "info";
};
</script>

<style lang="scss" scoped>
.userlist-container {
  width: 95%;
  height: 100%;

  .userlist-tool {
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: space-between;

    .filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      min-width: 0;

      .filter-item {
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

  .userlist-table {
    width: 100%;
    margin-top: 15px;
  }

  .nickname {
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

  .time-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .post-count {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-regular);
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
  .userlist-container .userlist-tool {
    flex-direction: column;
    align-items: stretch;

    .button-group {
      flex-wrap: wrap;
    }
  }
}
</style>
