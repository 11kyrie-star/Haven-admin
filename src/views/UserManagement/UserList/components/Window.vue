<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";

defineOptions({
  name: "UserBanWindow"
});

/** 封禁时长选项：value 为提交给后端的值 */
const durationOptions = [
  { label: "永久", value: "permanent", hint: "永久封禁，不会自动解封" },
  { label: "一个星期", value: "7d", hint: "封禁 7 天，到期后自动解封" },
  { label: "一个月", value: "30d", hint: "封禁 30 天，到期后自动解封" },
  { label: "半年", value: "180d", hint: "封禁 180 天，到期后自动解封" },
  { label: "一年", value: "365d", hint: "封禁 365 天，到期后自动解封" }
] as const;

/** 弹窗显隐，由父组件通过 v-model 控制 */
const visible = defineModel<boolean>("visible", { default: false });
/** 当前要封禁的用户 id，由父组件传入 */
const userid = defineModel<number>("userid", { default: 0 });
/** 用户昵称，用于提示与二次确认文案 */
const props = defineProps<{
  nickname?: string;
  /** 父组件正在提交封禁请求，期间禁止重复提交与关闭弹窗 */
  loading?: boolean;
}>();

const emit = defineEmits<{
  confirm: [userid: number, reason: string, duration: string];
}>();

/** 封禁理由（最多 50 字，由输入框 maxlength 限制） */
const reason = ref("");
/** 封禁时长，默认永久 */
const duration = ref<string>(durationOptions[0].value);

/** 当前选中时长的提示文案 */
const durationHint = computed(
  () =>
    durationOptions.find(item => item.value === duration.value)?.hint ??
    durationOptions[0].hint
);
/** 当前选中时长的中文名，用于二次确认文案 */
const durationLabel = computed(
  () =>
    durationOptions.find(item => item.value === duration.value)?.label ??
    durationOptions[0].label
);

/** 关闭弹窗：提交中不允许关闭，关闭时统一重置表单 */
const handleCancel = () => {
  if (props.loading) return;
  visible.value = false;
};

/** 提交前进行二次确认，确认通过后由父组件调用封禁接口 */
const handleConfirm = async () => {
  if (props.loading) return;

  const text = reason.value.trim();
  if (!text) return;

  const target = props.nickname ? `「${props.nickname}」` : "该用户";
  const effectText =
    duration.value === "permanent"
      ? "操作立即生效且不可撤销。"
      : "操作立即生效，到期后自动解封。";
  try {
    await ElMessageBox.confirm(
      `确定封禁${target}吗？封禁时长：${durationLabel.value}。封禁后该用户将无法登录和发帖，${effectText}`,
      "二次确认",
      {
        confirmButtonText: "确认封禁",
        cancelButtonText: "取消",
        type: "warning",
        closeOnClickModal: false,
        distinguishCancelAndClose: true,
        // 二次确认层级必须高于封禁弹窗（3000），否则会被遮挡
        modalClass: "ban-confirm-overlay"
      }
    );
  } catch {
    return;
  }

  emit("confirm", userid.value, text, duration.value);
};

/** 弹窗关闭时重置表单，避免下次打开残留上一次的内容（提交失败时保留现场） */
watch(visible, value => {
  if (!value) {
    reason.value = "";
    duration.value = durationOptions[0].value;
  }
});
</script>

<template>
  <!-- 传送到 body，避免被父级的 transform / overflow 影响定位 -->
  <Teleport to="body">
    <div v-if="visible" class="ban-mask" @click.self="handleCancel">
      <div
        class="ban-panel"
        role="dialog"
        aria-modal="true"
        aria-label="封禁用户"
      >
        <header class="ban-header">
          <span class="ban-title">封禁用户</span>
          <button
            type="button"
            class="ban-close"
            aria-label="关闭"
            @click="handleCancel"
          >
            ×
          </button>
        </header>

        <div class="ban-body">
          <div class="ban-tip">
            <span class="tip-strong">
              封禁后该用户将无法登录和发帖，且立即生效。
            </span>
            <span class="tip-text">
              请确认理由充分后再提交，该操作不可撤销。
            </span>
          </div>

          <div class="ban-target">
            <span class="target-label">封禁对象</span>
            <span class="target-name">{{ nickname || "—" }}</span>
          </div>

          <div class="ban-label">封禁时长</div>
          <el-radio-group
            v-model="duration"
            class="ban-duration"
            :disabled="loading"
          >
            <el-radio-button
              v-for="item in durationOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
          <span class="duration-hint">{{ durationHint }}</span>

          <div class="ban-label">封禁理由</div>
          <el-input
            v-model="reason"
            type="textarea"
            :rows="4"
            maxlength="50"
            show-word-limit
            resize="none"
            :disabled="loading"
            placeholder="请输入封禁理由（50字以内）"
          />
        </div>

        <footer class="ban-footer">
          <el-button size="small" :disabled="loading" @click="handleCancel">
            取消
          </el-button>
          <el-button
            type="danger"
            size="small"
            :loading="loading"
            :disabled="!reason.trim()"
            @click="handleConfirm"
          >
            封禁用户
          </el-button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
/* 遮罩层：fixed 相对视口定位，inset: 0 铺满整个视口 */
.ban-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background-color: rgb(0 0 0 / 50%);
}

/* 二次确认遮罩：Element Plus 默认层级（2000 起）低于封禁弹窗，这里单独抬高 */
:global(.ban-confirm-overlay) {
  z-index: 4000 !important;
}

/* 弹窗面板：absolute 相对遮罩层定位，top/left 50% + translate 居中 */
.ban-panel {
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

.ban-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 48px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.ban-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: var(--el-text-color-primary);
  letter-spacing: 0.5px;
}

.ban-close {
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

.ban-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 16px 20px;
  overflow-y: auto;
}

.ban-tip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-color-danger-dark-2);
  background-color: var(--el-color-danger-light-9);
  border-left: 3px solid var(--el-color-danger);
  border-radius: 4px;

  .tip-strong {
    font-weight: 600;
  }

  .tip-text {
    color: var(--el-color-danger);
  }
}

.ban-target {
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

.ban-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

/* 时长选择：五等分铺满，避免标签长短不一时出现空档 */
.ban-duration {
  display: flex;
  width: 100%;

  :deep(.el-radio-button) {
    flex: 1;
  }

  :deep(.el-radio-button__inner) {
    width: 100%;
    padding: 8px 0;
    font-size: 13px;
  }
}

.duration-hint {
  margin-top: -6px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.ban-footer {
  padding: 14px 20px 18px;
  text-align: right;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
