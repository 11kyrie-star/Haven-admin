<script setup lang="ts">
import { ref,onMounted } from "vue";
import  {type reportData,getRportApi,handleReportApi ,rejectApi} from "@/api/report";
import { hasPerms } from "@/utils/auth.js";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { outApplyApi } from "@/api/post.js";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import OutWindow from "./components/OutWindow.vue";
import RejectWindow from "./components/RejectWindow.vue";

defineOptions({
  name: "ReportAppending"
});
onMounted(async()=>{
await getReports()
})
const route=useRouter()
/** 聚合后的待处理举报列表：一行一篇帖子，reports 为该帖举报明细 */
const report = ref<reportData[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const reportDate = ref("");
const count=ref(null) //举报数量

/** 状态标签颜色映射 */
const statusTagType = (
  status?: string
): "primary" | "success" | "info" | "warning" | "danger" => {
  switch (status) {
    case "pending":
      return "warning";
    case "accepted":
    case "offline":
      return "danger";
    case "rejected":
      return "info";
    default:
      return "info";
  }
};

//查询举报
const doing=ref(false) //防止重复查询
const findReports = async() => {
    if(count.value===null && reportDate.value===""){
        return ElMessage.warning("查询条件不能为空")
    }
    if(doing.value){return}else{doing.value=true}
    try{
        page.value=1
        await getReports()
    }finally{
        doing.value=false
    }
};
//重置
const resetFilter = async() => {
    page.value=1
    count.value=null
    reportDate.value=""
    await getReports()
};
//分页要用的函数
let currentid=ref(1) //防止旧值覆盖新值
const Loadpage = async() => { 
    let id=++currentid.value
    try{
        const res=await getRportApi(page.value,pageSize.value,count.value,count.value)
    if(id!==currentid.value){return}
    if(res.status===0){
        report.value=res.data.list
        total.value=res.data.total
    }else{
        ElMessage.warning(res.msg || '查询失败')
    }
    }catch{
        ElMessage.warning("网络或者服务器异常")
    }
};
//跳转查看帖子详情
const viewPost = (_postId: number) => {
    const resolve=route.resolve({name:'detail',params:{_postId}})
useMultiTagsStoreHook().handleTags('push',{
    path:resolve.path,
    name:resolve.name,
    params:resolve.params,
    meta:{...resolve.meta,showLink:true}
})
route.push({name:'detail',params:{id:_postId}})
};
//处理驳回的函数
const rejectedvisible=ref(false) //决定驳回窗口的显示
const rejectpostid=ref(0) //用于记录驳回的帖子id
const handleReject = (post_id:number) => {
rejectedvisible.value=true
rejectpostid.value=post_id
};
//发送驳回请求
const confirmReject=async(post_id:number,reason:string)=>{
    try{
const res=await rejectApi({post_id:post_id,reason:reason})
if(res.status===0){
ElMessage.success(res.msg)
rejectedvisible.value=false
await getReports()
}else{
    ElMessage.warning(res.msg || '驳回失败')
}
    }catch{
        ElMessage.warning("服务器或者网络异常")
    }
}
//打开下架弹窗的函数
const offlinemode=ref<'direct' | 'apply'>('apply') // 根据用户权限决定走那套流程
const openWindow=(post_id:number,mode:'direct'| 'apply')=>{
offlineid.value=post_id
offlinevisible.value=true
offlinemode.value=mode
}

//提交下架函数
const offlinevisible=ref(false)  //决定下架弹窗的显示
const offlineid=ref(0) //记录提交的是哪个帖子
const submitOffline = (post_id:number) => {
    openWindow(post_id,'apply')
};

//直接下架函数
const directOffline = (post_id:number) => {
    openWindow(post_id,'direct')
};

//获取待处理举报的列表
const getReports=async()=>{
try{
const res=await getRportApi(page.value,pageSize.value,count.value,reportDate.value)
if(res.status===0){
    report.value=res.data.list
    total.value=res.data.total
}else{
    ElMessage.warning(res.msg)
}
}catch{
    ElMessage.warning("服务器或者网络异常")
}    
}

//发起下架请求
const handleOffline=async(post_id:number,reasons:string)=>{
    if(offlinemode.value==='direct'){
        if(!hasPerms("post:offline")){
            return ElMessage.warning("您没有直接下架帖子的权限")
        }else{
            try{const res=await outApplyApi(reasons,post_id)
            if(res.status===0){
                ElMessage.success(res.msg)
                offlinevisible.value=false
                await getReports()
            }else{
                ElMessage.warning(res.msg || '下架失败')
            }}catch{
                ElMessage.warning("服务器或者网络异常")
            }
        }
    }else{
        try{
          const res=await handleReportApi({post_id:post_id,reason:reasons})
        if(res.status===0){
            ElMessage.success(res.msg)
            offlinevisible.value=false
            await getReports()
        }else{
            ElMessage.warning(res.msg || '提交失败')
        }
        }catch{
            ElMessage.warning("服务器或者网络异常")
        }
    }
}
</script>

<template>
  <div class="appendingreport-container">
    <div class="appendingreport-tool"> 
      <div class="filter-group">
        <div class="number">
        <span>举报数量:</span>
        <el-input-number v-model="count" :min="1"></el-input-number>
        </div>
        <el-date-picker
          v-model="reportDate"
          type="date"
          placeholder="举报提交时间"
          value-format="YYYY-MM-DD"
          style="width: 180px"
          :editable="false"
          :disabled-date="(d: Date) => d.getTime() > Date.now()"
        />
      </div>
      <div class="button-group">
        <el-button type="success" size="small" @click="findReports">
          查询
        </el-button>
        <el-button size="small" @click="resetFilter">重置</el-button>
      </div>
    </div>

    <div class="appendingreport-table">
      <el-table
        :data="report"
        row-key="post_id"
        stripe
        style="width: 100%"
        empty-text="暂无待处理举报"
      >
        <!-- 展开行：该帖的全部举报明细 -->
        <el-table-column type="expand" width="48">
          <template #default="{ row }">
            <div class="report-detail">
              <div class="detail-head">
                <span class="detail-title">举报明细</span>
                <el-tag type="info" size="small" effect="plain" round>
                  共 {{ row.report_count }} 条
                </el-tag>
              </div>

              <el-table
                :data="row.reports || []"
                size="small"
                class="detail-table"
                empty-text="暂无举报明细"
              >
                <el-table-column
                  type="index"
                  label="#"
                  width="56"
                  align="center"
                />
                <el-table-column
                  prop="reporter"
                  label="举报人"
                  width="150"
                  show-overflow-tooltip
                />
                <el-table-column label="举报理由" min-width="220">
                  <template #default="{ row: detail }">
                    <div v-if="detail.reasons?.length" class="reason-tags">
                      <el-tag
                        v-for="reason in detail.reasons"
                        :key="reason"
                        type="info"
                        size="small"
                        effect="plain"
                      >
                        {{ reason }}
                      </el-tag>
                    </div>
                    <span v-else class="empty-text">未填写</span>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="description"
                  label="补充说明"
                  min-width="220"
                  show-overflow-tooltip
                >
                  <template #default="{ row: detail }">
                    <span v-if="detail.description">
                      {{ detail.description }}
                    </span>
                    <span v-else class="empty-text">未填写</span>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="created_at"
                  label="提交时间"
                  width="180"
                />
                <el-table-column label="状态" width="100">
                  <template #default="{ row: detail }">
                    <el-tag
                      v-if="detail.status_text"
                      :type="statusTagType(detail.status)"
                      size="small"
                      effect="light"
                    >
                      {{ detail.status_text }}
                    </el-tag>
                    <span v-else class="empty-text">—</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="被举报帖子" min-width="220">
          <template #default="{ row }">
            <div class="post-cell">
              <span class="post-id">#{{ row.post_id }}</span>
              <el-tag type="info" size="small" effect="plain">
                {{ row.post_type }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="举报量" width="110" align="center">
          <template #default="{ row }">
            <span
              class="report-count"
              :class="{ 'is-many': row.report_count >= 3 }"
            >
              {{ row.report_count }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="举报时间" min-width="200">
          <template #default="{ row }">
            <div class="time-cell">
              <div class="time-line">
                <span class="time-label">首次</span>
                <span>{{ row.first_report_at }}</span>
              </div>
              <div class="time-line">
                <span class="time-label">最近</span>
                <span>{{ row.last_report_at }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag
              :type="statusTagType(row.status)"
              size="small"
              effect="light"
              round
            >
              {{ row.status_text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="340" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              @click="viewPost(row.post_id)"
            >
              查看帖子
            </el-button>
            <el-button size="small" type="info" @click="handleReject(row.post_id)">
              驳回
            </el-button>
            <el-button
              v-perms="'post:offline:apply'"
              size="small"
              type="warning"
              @click="submitOffline(row.post_id)"
            >
              提交下架
            </el-button>
            <el-button
              v-perms="'post:offline'"
              size="small"
              type="danger"
              @click="directOffline(row.post_id)"
            >
              直接下架
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
        @current-change="Loadpage"
      />
    </div>
    <out-window v-model:visible="offlinevisible" v-model:postid="offlineid" :mode="offlinemode" @confirm="handleOffline"></out-window>
    <reject-window v-model:visible="rejectedvisible" v-model:postid="rejectpostid" @confirm="confirmReject"></reject-window>
  </div>
</template>

<style lang="scss" scoped>
.appendingreport-container {
  width: 95%;
  height: 100%;

  .appendingreport-tool {
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: space-between;
    
    .number{
     display: flex;
     align-items: center;
     gap: 10px;
    }

    .filter-group {
      display: flex;
      gap: 40px;
      align-items: center;
    }

    .button-group {
      display: flex;
      flex-shrink: 0;
      gap: 8px;
    }
  }

  .appendingreport-table {
    width: 100%;
    margin-top: 15px;

    :deep(.el-table__expanded-cell) {
      padding: 0;
      background-color: var(--el-fill-color-lighter);
    }
  }

  .post-cell {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  .post-id {
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

  .time-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .time-line {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .time-label {
    flex-shrink: 0;
    width: 28px;
    color: var(--el-text-color-placeholder);
  }

  .report-detail {
    padding: 14px 20px 18px;
  }

  .detail-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .detail-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .detail-table {
    width: 100%;
    background-color: transparent;
  }

  .reason-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
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
  .appendingreport-container .appendingreport-tool {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
