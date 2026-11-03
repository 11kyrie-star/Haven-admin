<template>
  <div class="userinfo-container">
    <!-- 用户档案：基本信息来自用户详情接口 -->
    <section v-loading="userLoading" class="profile-card">
      <div class="profile-main">
        <el-avatar
          :size="72"
          :src="user?.avatar || undefined"
          class="profile-avatar"
        >
          {{ user?.nickname?.slice(0, 1) || "?" }}
        </el-avatar>
        <div class="profile-text">
          <span class="profile-name">{{ user?.nickname || "—" }}</span>
          <span class="profile-id">用户 ID：{{ user?.user_id ?? "—" }}</span>
        </div>
      </div>

      <div class="profile-meta">
        <div class="meta-item">
          <span class="meta-icon"><MailIcon /></span>
          <div class="meta-text">
            <span class="meta-label">注册邮箱</span>
            <span class="meta-value">{{ user?.email || "—" }}</span>
          </div>
        </div>

        <div class="meta-item">
          <span class="meta-icon"><CalendarIcon /></span>
          <div class="meta-text">
            <span class="meta-label">注册时间</span>
            <span class="meta-value">{{ user?.register_at || "—" }}</span>
          </div>
        </div>

        <div class="meta-item">
          <span class="meta-icon"><ArticleIcon /></span>
          <div class="meta-text">
            <span class="meta-label">发帖数量</span>
            <span class="meta-value">{{ user?.post_count ?? 0 }} 篇</span>
          </div>
        </div>

        <div class="meta-item">
          <span class="meta-icon"><UserIcon /></span>
          <div class="meta-text">
            <span class="meta-label">账号状态</span>
            <span class="meta-value">
              <el-tag
                v-if="user"
                :type="user.status === 'banned' ? 'danger' : 'success'"
                size="small"
                effect="light"
                round
              >
                {{ user.status_text }}
              </el-tag>
              <template v-else>—</template>
            </span>
          </div>
        </div>
      </div>

      <div v-if="user?.status === 'banned'" class="ban-notice">
        <span class="ban-title">账号已被封禁</span>
        <span class="ban-text">原因：{{ user.ban_reason || "—" }}</span>
        <span class="ban-text">时间：{{ user.ban_at || "—" }}</span>
      </div>
    </section>

    <!-- 用户发布的帖子：滚动到底部自动加载下一页 -->
    <section class="post-section">
      <header class="section-head">
        <div class="section-title">
          发布的帖子
          <span class="section-count">{{ postTotal }}</span>
        </div>
        <span class="section-sub">TA 在树洞里留下的记录</span>
      </header>

      <div v-if="posts.length" class="post-grid">
        <Card v-for="post in posts" :key="post.post_id" :post="post" />
      </div>
      <div v-else-if="postsLoading" class="post-placeholder">正在加载帖子…</div>
      <div
        v-else-if="postsError"
        class="post-placeholder is-retry"
        @click="retryPosts"
      >
        帖子加载失败，点击重试
      </div>
      <div v-else class="post-placeholder">TA 还没有发布过帖子</div>

      <div v-if="posts.length" class="post-foot">
        <span v-if="postsLoading" class="foot-text">
          <LoadingIcon class="spin" />
          正在加载更多
        </span>
        <el-button
          v-else-if="postsError"
          link
          type="warning"
          @click="retryPosts"
        >
          加载失败，点击重试
        </el-button>
        <span v-else-if="noMore" class="foot-text is-muted">
          没有更多帖子了
        </span>
        <span v-else class="foot-text is-muted">继续下滑加载更多</span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { getUserInfoApi, getUserPostApi, type postList } from "@/api/people";
import Card from "./components/Card.vue";
import MailIcon from "~icons/ri/mail-line";
import CalendarIcon from "~icons/ri/calendar-line";
import ArticleIcon from "~icons/ri/article-line";
import UserIcon from "~icons/ri/user-line";
import LoadingIcon from "~icons/ri/loader-4-line";

defineOptions({
  name: "userdetail"
});

/** 用户详情接口返回的数据类型 */
type UserInfo = Awaited<ReturnType<typeof getUserInfoApi>>["data"];

const route = useRoute();
const userId = Number(route.params.id);

/** 用户信息 */
const user = ref<UserInfo | null>(null);
const userLoading = ref(true);

const loadUserInfo = async () => {
  userLoading.value = true;
  try {
    const res = await getUserInfoApi(userId);
    if (res.status === 0) {
      user.value = res.data;
    } else {
      ElMessage.warning(res.msg || "获取用户信息失败");
    }
  } catch {
    ElMessage.warning("服务器或者网络异常");
  } finally {
    userLoading.value = false;
  }
};

/** 帖子列表与分页状态 */
const posts = ref<postList[]>([]);
const postTotal = ref(0);
const postsLoading = ref(false);
const postsError = ref(false);
const noMore = ref(false);
let postPage = 1;
/** 请求序号：防止旧请求覆盖新数据 */
let postsRequestId = 0;

/** 是否允许继续加载 */
const canLoadMore = () =>
  posts.value.length > 0 &&
  !postsLoading.value &&
  !noMore.value &&
  !postsError.value;

const loadPosts = async (reset = false) => {
  if (postsLoading.value) return;
  if (!reset && (noMore.value || postsError.value)) return;

  const currentId = ++postsRequestId;
  postsLoading.value = true;

  if (reset) {
    postPage = 1;
    postTotal.value = 0;
    posts.value = [];
    noMore.value = false;
    postsError.value = false;
  }

  try {
    const res = await getUserPostApi(userId, postPage);
    if (currentId !== postsRequestId) return;
    if (res.status === 0) {
      posts.value = reset ? res.data.list : [...posts.value, ...res.data.list];
      postTotal.value = res.data.total;
      noMore.value = !res.data.hasMore;
      if (res.data.hasMore) postPage += 1;
    } else {
      postsError.value = true;
      ElMessage.warning(res.msg || "获取帖子失败");
    }
  } catch {
    if (currentId === postsRequestId) {
      postsError.value = true;
      ElMessage.warning("服务器或者网络异常");
    }
  } finally {
    if (currentId === postsRequestId) {
      postsLoading.value = false;
      await checkContainerFill();
    }
  }
};

/** 加载失败后重试当前页 */
const retryPosts = () => {
  postsError.value = false;
  loadPosts();
};

/** 页面滚动容器：优先取布局的 el-scrollbar，未开启固定头部时回退到 window */
const scrollTarget = ref<HTMLElement | Window | null>(null);

const getScrollMetrics = () => {
  const target = scrollTarget.value;
  if (!target) return null;
  if (target instanceof Window) {
    return {
      top: window.scrollY,
      viewport: window.innerHeight,
      total: document.documentElement.scrollHeight
    };
  }
  return {
    top: target.scrollTop,
    viewport: target.clientHeight,
    total: target.scrollHeight
  };
};

/** 容器还没被内容撑满时继续加载，避免首屏内容不足无法触发滚动 */
const checkContainerFill = async () => {
  await nextTick();
  if (!canLoadMore()) return;
  const metrics = getScrollMetrics();
  if (metrics && metrics.total <= metrics.viewport + 24) {
    loadPosts();
  }
};

const handleScroll = () => {
  if (!canLoadMore()) return;
  const metrics = getScrollMetrics();
  if (metrics && metrics.top + metrics.viewport >= metrics.total - 240) {
    loadPosts();
  }
};

const bindScroll = () => {
  const wrap = document.querySelector<HTMLElement>(
    ".app-main .el-scrollbar__wrap"
  );
  scrollTarget.value = wrap ?? window;
  if (scrollTarget.value === window) {
    window.addEventListener("scroll", handleScroll, { passive: true });
  } else {
    wrap?.addEventListener("scroll", handleScroll, { passive: true });
  }
};

const unbindScroll = () => {
  const target = scrollTarget.value;
  if (target === window) {
    window.removeEventListener("scroll", handleScroll);
  } else {
    target?.removeEventListener("scroll", handleScroll);
  }
};

onMounted(async () => {
  bindScroll();
  if (!userId) {
    userLoading.value = false;
    ElMessage.warning("缺少用户 ID");
    return;
  }
  await Promise.all([loadUserInfo(), loadPosts(true)]);
});

onBeforeUnmount(() => {
  unbindScroll();
});
</script>

<style lang="scss" scoped>
.userinfo-container {
  --ui-paper: #fffdf7;
  --ui-paper-soft: #f8f3e6;
  --ui-line: #ece3d0;
  --ui-ink: #4a4337;
  --ui-ink-strong: #2f2a21;
  --ui-muted: #9a917f;
  --ui-accent: #7d977c;
  --ui-accent-soft: rgb(125 151 124 / 12%);
  --ui-danger: #a85f50;
  --ui-danger-soft: rgb(190 110 90 / 9%);
  --ui-danger-line: rgb(190 110 90 / 32%);
  --ui-shadow: 0 10px 26px rgb(96 78 40 / 8%);

  width: 95%;
  padding-bottom: 32px;
}

:global(html.dark) .userinfo-container {
  --ui-paper: #23242a;
  --ui-paper-soft: #26272e;
  --ui-line: #35363e;
  --ui-ink: #d7d3c8;
  --ui-ink-strong: #f0ede5;
  --ui-muted: #8e8a80;
  --ui-accent: #93c6a6;
  --ui-accent-soft: rgb(147 198 166 / 14%);
  --ui-danger: #e0a094;
  --ui-danger-soft: rgb(190 110 90 / 14%);
  --ui-danger-line: rgb(190 110 90 / 38%);
  --ui-shadow: 0 10px 26px rgb(0 0 0 / 30%);
}

.profile-card {
  display: flex;
  flex-wrap: wrap;
  gap: 24px 40px;
  align-items: center;
  min-height: 128px;
  padding: 26px 30px;
  background: linear-gradient(135deg, var(--ui-paper), var(--ui-paper-soft));
  border: 1px solid var(--ui-line);
  border-radius: 12px;
  box-shadow: var(--ui-shadow);
}

.profile-main {
  display: flex;
  flex: 0 0 auto;
  gap: 18px;
  align-items: center;
  min-width: 0;
}

.profile-avatar {
  flex-shrink: 0;
  font-size: 24px;
  color: var(--ui-muted);
  background-color: var(--ui-paper-soft);
  border: 3px solid var(--ui-paper);
  box-shadow: 0 4px 12px rgb(96 78 40 / 12%);
}

.profile-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.profile-name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 20px;
  font-weight: 600;
  color: var(--ui-ink-strong);
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.profile-id {
  font-size: 12px;
  color: var(--ui-muted);
  letter-spacing: 0.5px;
}

.profile-meta {
  display: grid;
  flex: 1 1 460px;
  grid-template-columns: repeat(2, minmax(190px, 1fr));
  gap: 16px 28px;
}

.meta-item {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.meta-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 16px;
  color: var(--ui-accent);
  background-color: var(--ui-accent-soft);
  border-radius: 8px;
}

.meta-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.meta-label {
  font-size: 12px;
  color: var(--ui-muted);
  letter-spacing: 0.3px;
}

.meta-value {
  display: flex;
  gap: 6px;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 500;
  color: var(--ui-ink);
  white-space: nowrap;
}

.ban-notice {
  display: flex;
  flex-basis: 100%;
  flex-wrap: wrap;
  gap: 6px 20px;
  align-items: center;
  padding: 10px 14px;
  font-size: 12.5px;
  color: var(--ui-danger);
  background-color: var(--ui-danger-soft);
  border: 1px dashed var(--ui-danger-line);
  border-radius: 8px;
}

.ban-title {
  font-weight: 600;
}

.ban-text {
  color: var(--ui-danger);
}

.post-section {
  margin-top: 30px;
}

.section-head {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 14px;
  margin-bottom: 18px;
  border-bottom: 1px dashed var(--ui-line);
}

.section-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 17px;
  font-weight: 600;
  color: var(--ui-ink-strong);

  &::before {
    width: 4px;
    height: 16px;
    content: "";
    background-color: var(--ui-accent);
    border-radius: 2px;
  }
}

.section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 20px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ui-accent);
  background-color: var(--ui-accent-soft);
  border-radius: 999px;
}

.section-sub {
  font-size: 12.5px;
  color: var(--ui-muted);
  letter-spacing: 0.3px;
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 22px;
  align-items: start;
}

.post-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 160px;
  font-size: 14px;
  color: var(--ui-muted);
  background-color: var(--ui-paper);
  border: 1px dashed var(--ui-line);
  border-radius: 10px;

  &.is-retry {
    color: var(--ui-danger);
    cursor: pointer;
    border-color: var(--ui-danger-line);
  }
}

.post-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 0 6px;
}

.foot-text {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 12.5px;
  color: var(--ui-muted);

  &.is-muted {
    letter-spacing: 0.3px;
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (width <= 900px) {
  .profile-meta {
    flex-basis: 100%;
    grid-template-columns: 1fr;
  }
}

@media (width <= 640px) {
  .profile-card {
    padding: 20px;
  }

  .profile-name {
    font-size: 18px;
  }

  .post-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
