<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { type DetailPost, getDetailPost } from "@/api/post";
import DOMPurify from "dompurify";
import Globe from "~icons/ri/earth-line";
import Lock from "~icons/ri/lock-2-line";
import { ElMessage } from "element-plus";

defineOptions({ name: "Detail" });
const route = useRoute();
onMounted(async () => {
  await getDetailData();
});
//获取帖子的函数
const getDetailData = async () => {
  const res = await getDetailPost(Number(route.params.id));
  if (res.status === 0) {
    detail.value = res.data;
  } else {
    return ElMessage.warning("服务器或者网络异常");
  }
};

/** TODO 业务逻辑：后续根据 route.params.id 请求详情接口，当前为写死的模拟数据 */
const detail = ref<DetailPost>();

/** 富文本正文：渲染前过滤，防止存储型 XSS */
const safeContent = computed(() =>
  DOMPurify.sanitize(detail.value?.content ?? "", {
    USE_PROFILES: { html: true }
  })
);

/** 展示名称：昵称为空时回落到用户名 */
const displayName = computed(() => detail.value?.author);

/** 根据图片数量决定九宫格列数：1 张单列，2/4 张两列，其余三列 */
const galleryClass = computed(() => {
  const count = detail.value?.images.length;
  if (count === 1) return "gallery-single";
  if (count === 2 || count === 4) return "gallery-two";
  return "gallery-nine";
});

/** 状态标签颜色 */
const statusTagType = computed(() => {
  if (detail.value?.status === "normal") return "success";
  if (detail.value?.status === "pending") return "warning";
  if (detail.value?.status === "multi_reported") return "danger";
  return "info";
});
</script>

<template>
  <div class="detail-page">
    <article class="note">
      <span class="note-tape" aria-hidden="true" />

      <header class="note-header">
        <el-avatar :size="56" :src="detail?.avatar" class="note-avatar">
          {{ displayName?.slice(0, 1) }}
        </el-avatar>
        <div class="note-author">
          <div class="note-name">{{ displayName }}</div>
          <div class="note-meta">
            <span>{{ detail?.date }}</span>
            <i class="meta-dot" />
            <span>{{ detail?.type }}</span>
          </div>
        </div>
        <div class="note-badges">
          <span
            class="visibility-badge"
            :class="detail?.is_public === 1 ? 'is-public' : 'is-private'"
          >
            <Globe v-if="detail?.is_public === 1" class="visibility-icon" />
            <Lock v-else class="visibility-icon" />
            {{ detail?.is_public === 1 ? "公开" : "私密" }}
          </span>
          <el-tag
            class="note-status"
            :type="statusTagType"
            effect="light"
            round
            size="small"
          >
            {{ detail?.status_text }}
          </el-tag>
        </div>
      </header>

      <div class="note-divider" />

      <!-- 正文为过滤后的富文本，防止存储型 XSS -->
      <section class="post-content" v-html="safeContent" />

      <div
        v-if="detail?.images.length"
        class="note-gallery"
        :class="galleryClass"
      >
        <el-image
          v-for="(img, index) in detail.images"
          :key="img"
          class="gallery-item"
          :src="img"
          :preview-src-list="detail.images"
          :initial-index="index"
          fit="cover"
          preview-teleported
          hide-on-click-modal
        />
      </div>

      <footer class="note-footer">
        <span>NO. {{ detail?.id }}</span>
        <span>— 帖子详情 —</span>
      </footer>
    </article>
  </div>
</template>

<style lang="scss" scoped>
.detail-page {
  --note-bg: #f2eee3;
  --note-dot: rgb(90 76 40 / 8%);
  --note-paper: #fffdf6;
  --note-border: #e9e2ce;
  --note-ink: #453f33;
  --note-ink-strong: #2f2a20;
  --note-muted: #9a927f;
  --note-line: #d9d0b8;
  --note-quote-bg: rgb(214 196 150 / 14%);
  --note-shadow: 0 18px 40px rgb(72 58 26 / 12%), 0 2px 6px rgb(72 58 26 / 6%);
  --public-ink: #4e7a5f;
  --public-bg: rgb(110 160 128 / 12%);
  --public-border: rgb(110 160 128 / 32%);
  --private-ink: #8a6a34;
  --private-bg: rgb(198 160 88 / 14%);
  --private-border: rgb(198 160 88 / 38%);
  --tape-bg: rgb(228 208 158 / 78%);
  --tape-shadow: 0 2px 5px rgb(72 58 26 / 12%);
  --back-bg: rgb(255 253 246 / 82%);
  --back-border: #e6dfcc;
  --back-ink: #6f6754;
  --back-shadow: 0 4px 12px rgb(72 58 26 / 8%);

  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100vh;
  padding: 88px 20px 72px;
  overflow-x: hidden;
  background-color: var(--note-bg);
  background-image: radial-gradient(var(--note-dot) 1px, transparent 1px);
  background-size: 18px 18px;
}

:global(html.dark) .detail-page {
  --note-bg: #131418;
  --note-dot: rgb(255 255 255 / 5%);
  --note-paper: #23242a;
  --note-border: #35363e;
  --note-ink: #d7d3c8;
  --note-ink-strong: #f0ede5;
  --note-muted: #8e8a80;
  --note-line: #3b3c44;
  --note-quote-bg: rgb(255 255 255 / 4%);
  --note-shadow: 0 18px 40px rgb(0 0 0 / 35%), 0 2px 6px rgb(0 0 0 / 25%);
  --public-ink: #93c6a6;
  --public-bg: rgb(110 160 128 / 16%);
  --public-border: rgb(130 180 150 / 42%);
  --private-ink: #d6b176;
  --private-bg: rgb(198 160 88 / 16%);
  --private-border: rgb(198 160 88 / 42%);
  --tape-bg: rgb(190 172 120 / 28%);
  --tape-shadow: 0 2px 5px rgb(0 0 0 / 25%);
  --back-bg: rgb(35 36 42 / 82%);
  --back-border: #3b3c44;
  --back-ink: #b5b0a4;
  --back-shadow: 0 4px 12px rgb(0 0 0 / 25%);
}

.back-btn {
  position: fixed;
  top: 24px;
  left: 24px;
  z-index: 10;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 8px 14px;
  font-size: 13px;
  color: var(--back-ink);
  letter-spacing: 0.5px;
  cursor: pointer;
  background: var(--back-bg);
  border: 1px solid var(--back-border);
  border-radius: 999px;
  box-shadow: var(--back-shadow);
  backdrop-filter: blur(6px);
  transition:
    color 0.2s,
    background-color 0.2s,
    transform 0.2s;

  &:hover {
    color: var(--note-ink-strong);
    background: var(--note-paper);
    transform: translateX(-2px);
  }
}

.back-icon {
  width: 15px;
  height: 15px;
}

.note {
  position: relative;
  width: 100%;
  max-width: 720px;
  padding: 44px 44px 28px;
  background: var(--note-paper);
  border: 1px solid var(--note-border);
  border-radius: 6px;
  box-shadow: var(--note-shadow);
}

.note-tape {
  position: absolute;
  top: -14px;
  left: 50%;
  width: 132px;
  height: 28px;
  background: var(--tape-bg);
  box-shadow: var(--tape-shadow);
  clip-path: polygon(3% 0, 100% 5%, 97% 100%, 0 94%);
  transform: translateX(-50%) rotate(-2deg);
}

.note-header {
  display: flex;
  gap: 14px;
  align-items: center;
}

.note-avatar {
  flex-shrink: 0;
  font-size: 20px;
  color: var(--note-muted);
  background: var(--note-bg);
  border: 2px solid var(--note-border);
  box-shadow: 0 3px 8px rgb(72 58 26 / 10%);
}

.note-author {
  flex: 1;
  min-width: 0;
}

.note-name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 17px;
  font-weight: 600;
  color: var(--note-ink-strong);
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.note-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
  font-size: 12.5px;
  color: var(--note-muted);
  letter-spacing: 0.3px;
}

.meta-dot {
  width: 3px;
  height: 3px;
  background: currentcolor;
  border-radius: 50%;
  opacity: 0.6;
}

.note-badges {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: center;
}

.visibility-badge {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  font-size: 12px;
  line-height: 1;
  letter-spacing: 0.3px;
  border: 1px solid;
  border-radius: 999px;

  &.is-public {
    color: var(--public-ink);
    background: var(--public-bg);
    border-color: var(--public-border);
  }

  &.is-private {
    color: var(--private-ink);
    background: var(--private-bg);
    border-color: var(--private-border);
  }
}

.visibility-icon {
  width: 12px;
  height: 12px;
}

.note-status {
  flex-shrink: 0;
}

.note-divider {
  height: 0;
  margin: 22px 0 24px;
  border-top: 1px dashed var(--note-line);
}

.post-content {
  font-size: 15px;
  line-height: 1.9;
  color: var(--note-ink);
  overflow-wrap: break-word;

  :deep(p) {
    margin: 0 0 12px;
  }

  :deep(p:last-child) {
    margin-bottom: 0;
  }

  :deep(strong) {
    font-weight: 600;
    color: var(--note-ink-strong);
  }

  :deep(a) {
    color: #8a6ad4;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  :deep(img) {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 12px 0;
    border-radius: 6px;
  }

  :deep(blockquote) {
    padding: 10px 14px;
    margin: 12px 0;
    color: var(--note-muted);
    background: var(--note-quote-bg);
    border-left: 3px solid var(--note-line);
    border-radius: 4px;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 22px;
    margin: 0 0 12px;
  }

  :deep(ul) {
    list-style: disc;
  }

  :deep(ol) {
    list-style: decimal;
  }

  :deep(li) {
    margin-bottom: 4px;
  }

  :deep(code) {
    padding: 2px 6px;
    font-size: 13px;
    background: var(--note-quote-bg);
    border-radius: 4px;
  }
}

.note-gallery {
  display: grid;
  gap: 8px;
  max-width: 440px;
  margin-top: 22px;

  &.gallery-nine {
    grid-template-columns: repeat(3, 1fr);
  }

  &.gallery-two {
    grid-template-columns: repeat(2, 1fr);
  }

  &.gallery-single {
    grid-template-columns: 1fr;
    max-width: 240px;
  }
}

.gallery-item {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: zoom-in;
  background: var(--note-bg);
  border-radius: 6px;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 14px;
  margin-top: 28px;
  font-size: 12px;
  color: var(--note-muted);
  letter-spacing: 1px;
  border-top: 1px dashed var(--note-line);
}

@media (width <= 640px) {
  .detail-page {
    padding: 76px 12px 48px;
  }

  .back-btn {
    top: 16px;
    left: 12px;
  }

  .note {
    padding: 32px 22px 22px;
  }

  .note-avatar {
    width: 46px;
    height: 46px;
    font-size: 17px;
  }

  .note-name {
    font-size: 16px;
  }

  .note-header {
    flex-wrap: wrap;
  }

  .note-badges {
    justify-content: flex-end;
    width: 100%;
  }

  .note-gallery {
    max-width: 100%;
  }
}
</style>
