<template>
    <div class="outapply-container">
        <div class="outapply-table">
            <el-table stripe  style="width: 100%;" :data="appliesList">
              <el-table-column label="状态" min-width="200">
                <template #default="scope">
                    <el-button v-if="scope.row.status==='done'" size="small" type="success">{{ scope.row.status_text }}</el-button>
                    <el-button v-else size="small" :type="scope.row.status==='rejected'?'danger':'warning'">{{ scope.row.status_text }}</el-button>
                </template>
              </el-table-column>
              <el-table-column label="下架理由" min-width="200" prop="apply_reason"></el-table-column>
              <el-table-column label="提交时间" min-width="200" prop="created_at"></el-table-column>
              <el-table-column label="受理人" min-width="200" prop="handler_name"></el-table-column>
              <el-table-column label="操作" min-width="200">
                <template #default="scope">
                    <el-button size="small" type="primary">查看帖子</el-button>
                    <el-button size="small" type="danger" v-if="scope.row.status==='pending'">撤销</el-button>
                    <el-button size="small" type="warning" v-if="scope.row.status==='rejected'">申诉</el-button>
                </template>
              </el-table-column>
           </el-table>
        </div>
        <div class="page-tool">
            <el-pagination v-model:current-page="page"  :total="total" layout="total,prev,pager,next" background @current-change="Loadpage"></el-pagination>
        </div>    
    </div>
</template>

<style lang="scss" scoped>
.outapply-container{
    width: 95%;
    height: 100%;
    .outapply-table{
        width: 100%;
        height: 100%;
    }
}
</style>

<script setup lang="ts">
import { type outAppliesList,getOutApplies } from '@/api/applies';
import { ElMessage } from 'element-plus';
import {ref,onMounted} from 'vue'
defineOptions({
    name:"PostOutApply"
})
//分页要用到的数据
const total=ref(0)
const page=ref(1)
//分页函数
let currentid=ref(0) //用于防止异步竞态
const Loadpage=async()=>{
let id=++currentid.value    
try{
const res=await getOutApplies({page:page.value})
if(id!==currentid.value){return}
if(res.status===0){
appliesList.value=res.data.list
    total.value=res.total
}else{
    ElMessage.warning("服务器或者网络异常")
}
}catch{
    ElMessage.warning("服务器或者网络异常")
}
}
//申请列表数据
const appliesList=ref<outAppliesList[]>([])
//获取申请列表数据
const getApplies=async()=>{
    try{
     const res=await getOutApplies({page:page.value})
if(res.status===0){
    appliesList.value=res.data.list
    total.value=res.total
}else{
    ElMessage.warning("服务器或者网络异常")
}
    }catch{
    ElMessage.warning("服务器或者网络异常")
    }
}
onMounted(async()=>{
await getApplies()
})
</script>