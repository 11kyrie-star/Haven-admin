<template>
  <!-- 传送到 body，避免被父级的 transform / overflow 影响定位 -->
  <Teleport to="body">
    <div v-if="visible" class="revoke-mask" @click.self="handleCancel">
      <div
        class="revoke-panel"
        role="dialog"
        aria-modal="true"
        aria-label="撤销封禁"
      >
        <header class="revoke-header">
          <span class="revoke-title">撤销封禁</span>
          <button
            type="button"
            class="revoke-close"
            aria-label="关闭"
            @click="handleCancel"
          >
            ×
          </button>
        </header>

        <div class="revoke-body">
          <div class="revoke-tip">
            <span class="tip-strong">
              撤销后该用户将立即恢复登录和发帖权限。
            </span>
            <span class="tip-text">
              请确认撤销理由充分，避免误操作放行违规账号。
            </span>
          </div>

          <div class="revoke-target">
            <span class="target-label">撤销对象</span>
            <span class="target-name">{{ nickname || "—" }}</span>
          </div>

          <div class="revoke-label">撤销理由</div>
          <el-input
            v-model="reason"
            type="textarea"
            :rows="4"
            maxlength="50"
            show-word-limit
            resize="none"
            :disabled="loading"
            placeholder="请输入撤销理由（50字以内）"
          />
        </div>

        <footer class="revoke-footer">
          <el-button size="small" :disabled="loading" @click="handleCancel">
            取消
          </el-button>
          <el-button
            type="primary"
            size="small"
            :loading="loading"
            :disabled="!reason.trim()"
            @click="handleConfirm"
          >
            确认撤销
          </el-button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

defineOptions({
  name: "ReCancelWindow"
});

/** 弹窗显隐，由父组件通过 v-model 控制 */
const visible = defineModel<boolean>("visible", { default: false });

/** 用户昵称用于展示撤销对象；loading 由父组件提交接口时传入 */
const props = defineProps<{
  nickname?: string;
  loading?: boolean;
}>();

/** 撤销理由（最多 50 字，由输入框 maxlength 限制） */
const reason = ref("");

const emit = defineEmits<{
  confirm: [reason: string];
}>();

/** 关闭弹窗：提交中不允许关闭 */
const handleCancel = () => {
  if (props.loading) return;
  visible.value = false;
};

/** 确认撤销：校验通过后把理由交给父组件提交接口 */
const handleConfirm = () => {
  if (props.loading) return;
  const text = reason.value.trim();
  if (!text) return;
  emit("confirm", text);
};

/** 弹窗关闭时重置理由，避免下次打开残留上一次的内容 */
watch(visible, value => {
  if (!value) reason.value = "";
});
</script>

<style lang="scss" scoped>
/* 遮罩层：fixed 相对视口定位，inset: 0 铺满整个视口 */
.revoke-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background-color: rgb(0 0 0 / 50%);
}

/* 弹窗面板：absolute 相对遮罩层定位，top/left 50% + translate 居中 */
.revoke-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  width: 440px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  overflow: hidden;
  background-color: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 16%);
  transform: translate(-50%, -50%);
}

.revoke-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 48px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.revoke-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: var(--el-text-color-primary);
  letter-spacing: 0.5px;
}

.revoke-close {
  position: absolute;
  top: 50%;
  right: 16px;
  width: 24px;
  height: 24px;
  padding: 0;
  font-size: 18px;
  line-height: 1;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  transform: translateY(-50%);
  transition:
    color 0.2s,
    background-color 0.2s;

  &:hover {
    color: var(--el-text-color-primary);
    background-color: var(--el-fill-color-light);
  }
}

.revoke-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 16px 20px;
  overflow-y: auto;
}

.revoke-tip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-color-warning-dark-2);
  background-color: var(--el-color-warning-light-9);
  border-left: 3px solid var(--el-color-warning);
  border-radius: 4px;

  .tip-strong {
    font-weight: 600;
  }

  .tip-text {
    color: var(--el-color-warning);
  }
}

.revoke-target {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 6px;

  .target-label {
    flex-shrink: 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .target-name {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;
  }
}

.revoke-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.revoke-footer {
  padding: 14px 20px 18px;
  text-align: right;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
