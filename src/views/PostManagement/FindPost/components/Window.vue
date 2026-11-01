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
                aria-label="下架帖子"
            >
                <header class="window-header">
                    <span class="window-title">下架帖子</span>
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
                    <div class="reason-label">下架理由</div>
                    <el-input
                        v-model="reason"
                        type="textarea"
                        :rows="4"
                        maxlength="50"
                        show-word-limit
                        resize="none"
                        placeholder="请输入下架理由（50字以内）"
                    />

                    <!-- 一级管理员：提示需要审批 -->
                    <div v-if="isFirstLevel" class="approval-tip">
                        由于您的权限不足，下架帖子必须经过审批
                    </div>
                </div>

                <footer class="window-footer">
                    <el-button size="small" @click="visible = false">取消</el-button>

                    <!-- 一级管理员：提交审批 -->
                    <el-button
                        v-if="isFirstLevel"
                        size="small"
                        type="warning"
                        :disabled="!reason.trim()"
                        @click="handleSubmit"
                    >
                        提交
                    </el-button>

                    <!-- 其他管理员：直接确定 -->
                    <el-button
                        v-if="!isFirstLevel"
                        size="small"
                        type="danger"
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

    .approval-tip {
        padding: 6px 10px;
        font-size: 12px;
        line-height: 1.5;
        color: #e6a23c;
        background-color: #fdf6ec;
        border-radius: 4px;
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
import { useUserStoreHook } from "@/store/modules/user";
import { outApplyApi,directOutApi } from "@/api/post";
import { ElMessage } from "element-plus";

defineOptions({
    name: "PullPostWindow"
});

// 弹窗显隐，由父组件通过 v-model 控制
const visible = defineModel<boolean>("visible",{ default: false });
const postid=defineModel<number>("postid")
//判断是不是一级管理员
const pemission=useUserStoreHook().permissions
const isFirstLevel=pemission.includes("post:offline")?false:true

// 下架理由（最多 50 字，由输入框 maxlength 限制）
const reason=ref("");

// 一级管理员提交审批（业务逻辑自行实现）
const handleSubmit = async() => {
try{
const res=await outApplyApi(reason.value,postid.value)
if(res.status===0){
    ElMessage.success(res.msg)
    reason.value=""
    visible.value=false
}else{
    ElMessage.warning("服务器或者网络异常")
}
}catch{
ElMessage.warning("服务器或者网路异常")
}    
};

// 其他管理员直接下架（业务逻辑自行实现）
const handleConfirm =async () => {
    try{
      const res=await directOutApi(reason.value,postid.value)
if(res.status===0){
    ElMessage.warning(res.msg)
    reason.value=""
    visible.value=false
}else{
    ElMessage.warning("服务器或者网络异常")
}
    }catch{
    ElMessage.warning("服务器或者网络异常")
    }
};
</script>
