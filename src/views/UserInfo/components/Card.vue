<script setup lang="ts">
import { computed } from "vue";
import DOMPurify from "dompurify";
import type { postList } from "@/api/people";
import ViewIcon from "~icons/ri/eye-line";
import HeartIcon from "~icons/ri/heart-line";
import CommentIcon from "~icons/ri/chat-3-line";

defineOptions({
  name: "UserPostCard"
});

const props = defineProps<{
  post: postList;
}>();

/** 统一兜底为空数组，避免图片字段异常时模板报错 */
const images = computed(() => props.post.images ?? []);

/** 帖子正文为富文本，渲染前过滤，防止存储型 XSS */
const safeContent = computed(() =>
  DOMPurify.sanitize(props.post.content ?? "", {
    USE_PROFILES: { html: true }
  })
);

/** 根据图片数量决定九宫格列数：1 张单列，2/4 张两列，其余三列 */
const galleryClass = computed(() => {
  const count = images.value.length;
  if (count === 1) return "gallery-single";
  if (count === 2 || count === 4) return "gallery-two";
  return "gallery-nine";
});

/** 帖子状态标签颜色 */
const statusTagType = computed(() => {
  const status = props.post.status || "";
  if (status === "normal") return "success";
  if (status.includes("pending")) return "warning";
  if (status.includes("reported") || status.includes("banned")) return "danger";
  return "info";
});
</script>

<template>
  <article class="post-card">
    <span class="card-tape" aria-hidden="true" />

    <header class="card-head">
      <span class="card-type">{{ post.category || "未分类" }}</span>
      <div class="card-meta">
        <span class="card-no">NO. {{ post.post_id }}</span>
        <span class="card-date">{{ post.created_at }}</span>
      </div>
    </header>

    <!-- 正文为过滤后的富文本，保留换行的同时避免 XSS -->
    <div class="card-content" v-html="safeContent" />

    <div v-if="images.length" class="card-gallery" :class="galleryClass">
      <el-image
        v-for="(img, index) in images"
        :key="img"
        class="gallery-item"
        :src="img"
        :preview-src-list="images"
        :initial-index="index"
        fit="cover"
        preview-teleported
        hide-on-click-modal
      />
    </div>

    <div v-if="post.offline_reason" class="card-reason">
      下架原因：{{ post.offline_reason }}
    </div>

    <footer class="card-foot">
      <div class="card-stats">
        <span class="stat">
          <ViewIcon class="stat-icon" />
          {{ post.view_count }}
        </span>
        <span class="stat">
          <HeartIcon class="stat-icon" />
          {{ post.like_count }}
        </span>
        <span class="stat">
          <CommentIcon class="stat-icon" />
          {{ post.comment_count }}
        </span>
      </div>
      <el-tag :type="statusTagType" effect="light" size="small" round>
        {{ post.status_text }}
      </el-tag>
    </footer>
  </article>
</template>

<style lang="scss" scoped>
.post-card {
  --card-paper: #fffdf6;
  --card-line: #ebe2ce;
  --card-ink: #4a4236;
  --card-muted: #9b9280;
  --card-rule: #eee5d2;
  --card-tape: rgb(226 206 156 / 72%);
  --card-tape-shadow: 0 2px 5px rgb(96 78 40 / 12%);
  --card-accent: #7d977c;
  --card-accent-soft: rgb(125 151 124 / 12%);
  --card-accent-line: rgb(125 151 124 / 26%);
  --card-warning-ink: #8a6a34;
  --card-warning-bg: rgb(198 160 88 / 12%);
  --card-warning-line: rgb(198 160 88 / 34%);
  --card-shadow: 0 10px 24px rgb(96 78 40 / 9%), 0 1px 3px rgb(96 78 40 / 5%);

  position: relative;
  display: flex;
  flex-direction: column;
  padding: 28px 20px 14px;
  background-color: var(--card-paper);
  border: 1px solid var(--card-line);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    box-shadow:
      0 16px 30px rgb(96 78 40 / 13%),
      0 2px 6px rgb(96 78 40 / 7%);
    transform: translateY(-3px);
  }
}

:global(html.dark) .post-card {
  --card-paper: #24252b;
  --card-line: #34353d;
  --card-ink: #d4d0c6;
  --card-muted: #8e8a80;
  --card-rule: #383941;
  --card-tape: rgb(190 172 120 / 30%);
  --card-tape-shadow: 0 2px 5px rgb(0 0 0 / 25%);
  --card-accent: #93c6a6;
  --card-accent-soft: rgb(147 198 166 / 14%);
  --card-accent-line: rgb(130 180 150 / 42%);
  --card-warning-ink: #d6b176;
  --card-warning-bg: rgb(198 160 88 / 14%);
  --card-warning-line: rgb(198 160 88 / 38%);
  --card-shadow: 0 10px 24px rgb(0 0 0 / 30%), 0 1px 3px rgb(0 0 0 / 20%);

  &:hover {
    box-shadow:
      0 16px 30px rgb(0 0 0 / 38%),
      0 2px 6px rgb(0 0 0 / 25%);
  }
}

.card-tape {
  position: absolute;
  top: -11px;
  left: 50%;
  width: 88px;
  height: 22px;
  background-color: var(--card-tape);
  box-shadow: var(--card-tape-shadow);
  clip-path: polygon(3% 0, 100% 5%, 97% 100%, 0 94%);
  transform: translateX(-50%) rotate(-1.5deg);
}

.card-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-type {
  flex-shrink: 0;
  padding: 2px 10px;
  font-size: 12px;
  line-height: 18px;
  color: var(--card-accent);
  letter-spacing: 0.3px;
  background-color: var(--card-accent-soft);
  border: 1px solid var(--card-accent-line);
  border-radius: 999px;
}

.card-meta {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
}

.card-no {
  font-size: 11px;
  color: var(--card-muted);
  letter-spacing: 0.8px;
}

.card-date {
  font-size: 12px;
  color: var(--card-muted);
  letter-spacing: 0.3px;
}

.card-content {
  display: -webkit-box;
  flex: 1;
  margin: 0;
  overflow: hidden;
  -webkit-line-clamp: 6;
  font-size: 14.5px;
  line-height: 1.85;
  color: var(--card-ink);
  overflow-wrap: break-word;
  white-space: pre-wrap;
  -webkit-box-orient: vertical;

  :deep(p) {
    margin: 0 0 6px;
  }

  :deep(p:last-child) {
    margin-bottom: 0;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
  }

  :deep(a) {
    color: var(--card-accent);
    text-decoration: underline;
  }
}

.card-gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 14px;

  &.gallery-two {
    grid-template-columns: repeat(2, 1fr);
  }

  &.gallery-single {
    grid-template-columns: 1fr;
    max-width: 180px;
  }
}

.gallery-item {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: zoom-in;
  background-color: var(--card-rule);
  border-radius: 6px;
}

.card-reason {
  padding: 7px 10px;
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--card-warning-ink);
  background-color: var(--card-warning-bg);
  border: 1px solid var(--card-warning-line);
  border-radius: 6px;
}

.card-foot {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  margin-top: 16px;
  border-top: 1px dashed var(--card-rule);
}

.card-stats {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  color: var(--card-muted);
}

.stat {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.stat-icon {
  font-size: 13px;
}

/* 便签卡片：纸张底色 + 顶部胶带，整体保持柔和不抢眼 */
</style>
