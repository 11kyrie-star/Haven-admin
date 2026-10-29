<template>
    <!-- 传送到 body，避免被父级的 transform / overflow 影响定位 -->
    <Teleport to="body">
        <div
            v-if="visible"
            class="window-mask"
            @click.self="visible = false"
        >
            <div
                class="window-panel"
                role="dialog"
                aria-modal="true"
                aria-label="申诉"
            >
                <header class="window-header">
                    <span class="window-title">申诉</span>
                    <button
                        type="button"
                        class="window-close"
                        aria-label="关闭"
                        @click="visible = false"
                    >
                        ×
                    </button>
                </header>

                <div class="window-body">
                    <div class="reason-label">申请理由</div>
                    <el-input
                        v-model="reason"
                        type="textarea"
                        :rows="4"
                        maxlength="50"
                        show-word-limit
                        resize="none"
                        placeholder="请输入申请理由（50字以内）"
                    />
                </div>

                <footer class="window-footer">
                    <el-button size="small" @click="visible = false">取消</el-button>
                    <el-button
                        size="small"
                        type="warning"
                        :disabled="!reason.trim()"
                        @click="handleSubmit"
                    >
                        提交
                    </el-button>
                </footer>
            </div>
        </div>
    </Teleport>
</template>

<style lang="scss" scoped>
/* 遮罩层：fixed 相对视口定位，inset: 0 铺满整个视口，脱离文档流 */
.window-mask {
    position: fixed;
    inset: 0;
    z-index: 3000;
    background-color: rgba(0, 0, 0, 0.5);
}

/* 弹窗面板：absolute 相对遮罩层定位，top/left 50% + translate 居中 */
.window-panel {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    width: 420px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 32px);
    overflow: hidden;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
}

.window-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 48px 14px;
    border-bottom: 1px solid #f0f0f0;
}

.window-title {
    font-size: 18px;
    font-weight: 600;
    line-height: 24px;
    color: #303133;
    text-align: center;
    letter-spacing: 0.5px;
}

.window-close {
    position: absolute;
    top: 50%;
    right: 16px;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    padding: 0;
    font-size: 18px;
    line-height: 1;
    color: #909399;
    cursor: pointer;
    background-color: transparent;
    border: none;
    border-radius: 4px;
    transition: color 0.2s, background-color 0.2s;

    &:hover {
        color: #303133;
        background-color: #f2f3f5;
    }
}

.window-body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
    padding: 16px 20px;
    overflow-y: auto;

    .reason-label {
        font-size: 14px;
        font-weight: 500;
        color: #606266;
    }
}

.window-footer {
    padding: 14px 20px 18px;
    text-align: right;
    border-top: 1px solid #f0f0f0;
}
</style>

<script setup lang="ts">
import { ref } from "vue";
import { complainAppliesApi } from "@/api/applies";
import { ElMessage } from "element-plus";

defineOptions({
    name: "OutApplyWindow"
});

// 弹窗显隐，由父组件通过 v-model 控制
const visible = defineModel<boolean>("visible", { default: false });
const id=defineModel<number>('id')
// 申请理由（最多 50 字，由输入框 maxlength 限制）
const reason = ref("");

const emit = defineEmits<{
    submit: [];
}>();

// 提交：仅抛出理由，具体业务逻辑由父组件处理
const handleSubmit =async()=> {
    try{
       const res=await complainAppliesApi(id.value,{reason:reason.value})
    if(res.status===0){
        ElMessage.success(res.msg)
        visible.value=false
        reason.value=""
        emit("submit")
    }else{
        ElMessage.warning(res.msg || '提交失败')
    }
    }catch{
        ElMessage.warning("服务器或者网络异常")
    }
};
</script>
