<script setup lang="ts">
import { ref,watch } from "vue";

defineOptions({
  name: "RejectWindow"
});

// 弹窗显隐，由父组件通过 v-model 控制
const visible = defineModel<boolean>("visible", { default: false });
// 当前要驳回的帖子 id，由父组件传入
const postid = defineModel<number>("postid");

// 驳回理由（最多 50 字，由输入框 maxlength 限制）
const reason = ref("");

const emit = defineEmits<{
  confirm: [postid: number, reason: string];
}>();

// 取消：关闭弹窗并清空输入，避免下次打开残留上一次的理由
const handleCancel = () => {
  visible.value = false;
  reason.value = "";
};
//清理掉理由
watch(visible,v=>{
    if(!v){
        reason.value=""
    }
})

// TODO 业务逻辑：提交驳回，由你自己补充接口调用
const handleConfirm = () => {
  emit("confirm", postid.value, reason.value.trim());
};
</script>

<template>
  <!-- 传送到 body，避免被父级的 transform / overflow 影响定位 -->
  <Teleport to="body">
    <div v-if="visible" class="reject-mask">
      <div
        class="reject-panel"
        role="dialog"
        aria-modal="true"
        aria-label="驳回举报"
      >
        <header class="reject-header">
          <span class="reject-title">驳回举报</span>
        </header>

        <div class="reject-body">
          <div class="reject-tip">请根据所有举报理由进行综合评估</div>

          <div class="reject-label">驳回理由</div>
          <el-input
            v-model="reason"
            type="textarea"
            :rows="4"
            maxlength="50"
            show-word-limit
            resize="none"
            placeholder="请输入驳回理由（50字以内）"
          />
        </div>

        <footer class="reject-footer">
          <el-button size="small" @click="handleCancel">取消</el-button>
          <el-button
            type="primary"
            size="small"
            :disabled="!reason.trim()"
            @click="handleConfirm"
          >
            确定
          </el-button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
/* 遮罩层：fixed 相对视口定位，inset: 0 铺满整个视口 */
.reject-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background-color: rgb(0 0 0 / 50%);
}

/* 弹窗面板：absolute 相对遮罩层定位，top/left 50% + translate 居中 */
.reject-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  width: 420px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  overflow: hidden;
  background-color: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 16%);
  transform: translate(-50%, -50%);
}

.reject-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 20px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.reject-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: var(--el-text-color-primary);
  letter-spacing: 0.5px;
}

.reject-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  padding: 16px 20px;
  overflow-y: auto;
}

.reject-tip {
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-color-warning-dark-2);
  background-color: var(--el-color-warning-light-9);
  border-left: 3px solid var(--el-color-warning);
  border-radius: 4px;
}

.reject-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.reject-footer {
  padding: 14px 20px 18px;
  text-align: right;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
