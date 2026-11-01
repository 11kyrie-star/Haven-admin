<template>
    <!-- 传送到 body，避免被父级的 transform / overflow 影响定位 -->
    <Teleport to="body">
        <div v-if="visible" class="reject-mask" @click.self="handleClose">
            <div class="reject-panel" role="dialog" aria-modal="true" aria-label="驳回下架申请">
                <header class="panel-header">
                    <span class="panel-title">驳回下架申请</span>
                    <button type="button" class="panel-close" aria-label="关闭" @click="handleClose">×</button>
                </header>

                <div class="panel-body">
                    <div class="reason-label">驳回理由</div>
                    <div class="reason-tip">请根据各管理员的申请理由进行统一回复</div>
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

                <footer class="panel-footer">
                    <el-button size="small" :disabled="submitting" @click="handleClose">取消</el-button>
                    <el-button
                        size="small"
                        type="danger"
                        :loading="submitting"
                        :disabled="!reason.trim()"
                        @click="handleSubmit"
                    >
                        确认驳回
                    </el-button>
                </footer>
            </div>
        </div>
    </Teleport>
</template>

<style scoped lang="scss">
/* 遮罩层：fixed 相对视口定位，inset: 0 铺满整个视口，脱离文档流 */
.reject-mask {
    position: fixed;
    inset: 0;
    z-index: 3000;
    background-color: rgba(0, 0, 0, 0.5);
}

/* 弹窗面板：absolute 相对遮罩层定位，top/left 50% + translate 居中 */
.reject-panel {
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

.panel-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 48px 14px;
    border-bottom: 1px solid #f0f0f0;
}

.panel-title {
    font-size: 18px;
    font-weight: 600;
    line-height: 24px;
    color: #303133;
    text-align: center;
    letter-spacing: 0.5px;
}

.panel-close {
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

.panel-body {
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

    /* 一行提示文案 */
    .reason-tip {
        padding-left: 8px;
        font-size: 12px;
        line-height: 18px;
        color: var(--el-color-warning);
        border-left: 2px solid var(--el-color-warning);
    }
}

.panel-footer {
    padding: 14px 20px 18px;
    text-align: right;
    border-top: 1px solid #f0f0f0;
}
</style>

<script setup lang="ts">
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import { rejectApproveApi } from "@/api/applies"

defineOptions({
    name: "RejectWindow"
})

//弹窗显隐与目标帖子 id，由父组件通过 v-model 控制
const visible = defineModel<boolean>("visible", { default: false })
const postId = defineModel<number>("post_id", { required: true })

//驳回理由（最多 50 字，由输入框 maxlength 限制）
const reason = ref("")
const submitting = ref(false) //防止重复提交

const emit = defineEmits<{
    submit: []
}>()

//弹窗关闭（取消、点遮罩、右上角 ×）或打开时都清空驳回理由
watch(visible, () => {
    reason.value = ""
})

//关闭弹窗，提交过程中禁止关闭
const handleClose = () => {
    if (submitting.value) return
    visible.value = false
}

//提交驳回
const handleSubmit = async () => {
    const text = reason.value.trim()
    if (!text) return ElMessage.warning("请输入驳回理由")
    if (submitting.value) return
    submitting.value = true
    try {
        const res = await rejectApproveApi({
            post_id: postId.value,
            reason: text
        })
        if (res.status === 0) {
            ElMessage.success(res.msg || "驳回成功")
            visible.value = false
            emit("submit")
        } else {
            ElMessage.warning(res.msg || "驳回失败")
        }
    } catch {
        ElMessage.warning("服务器或者网络异常")
    } finally {
        submitting.value = false
    }
}
</script>
