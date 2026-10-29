<template>
    <div class="outapply-container">
        <div class="outapply-tool">
            <div class="tool">
                <el-select v-model="status" placeholder="申请状态:全部" style="width: 150px;">
                  <el-option label="全部" value="all"></el-option>
                  <el-option label="待处理" value="pending"></el-option>
                  <el-option label="处理完成" value="done"></el-option>
                  <el-option label="已驳回" value="rejected"></el-option>
                  <el-option label="已撤销" value="cancelled"></el-option>
                  <el-option label="申诉中" value="appealing"></el-option>
                </el-select>
               <el-date-picker v-model="start_date" type="date" placeholder="创建时间" value-format="YYYY-MM-DD" style="width: 180px;" :editable="false" :disabled-date="(d:Date)=>d.getTime()>Date.now()"></el-date-picker>
            </div>
            <div class="button">
                <el-button type="success" size="small" @click="findApplies">查询</el-button>
                <el-button size="small" @click="clearContent">重置</el-button>
            </div>
        </div>
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
                    <el-button size="small" type="primary" @click="findDetail(scope.row.post_id)">查看帖子</el-button>
                    <el-button size="small" type="danger" v-if="scope.row.status==='pending'" @click="handleCancel(scope.row.id)">撤销</el-button>
                    <el-button size="small" type="warning" v-if="scope.row.status==='rejected'" @click="complainApply(scope.row.id)">申诉</el-button>
                </template>
              </el-table-column>
           </el-table>
        </div>
        <div class="page-tool">
            <el-pagination v-model:current-page="page"  :total="total" layout="total,prev,pager,next" background @current-change="Loadpage"></el-pagination>
        </div>
        <window v-model:visible="visible" v-model:id="id" @submit="Loadpage()"></window>
    </div>
</template>

<style lang="scss" scoped>
.outapply-container{
    width: 95%;
    height: 100%;
    .outapply-tool{
        display: flex;
        gap: 700px;
        align-items: center;
        .tool{
            display: flex;
            gap: 40px;
        }
    }
    .outapply-table{
        width: 100%;
        margin-top: 20px;
    }
    .page-tool{
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
    }
}
</style>

<script setup lang="ts">
import { type outAppliesList,getOutApplies,cancelApplies } from '@/api/applies';
import { ElMessage, ElMessageBox } from 'element-plus';
import {ref,onMounted} from 'vue'
import { useRouter } from 'vue-router';
import { useMultiTagsStoreHook } from '@/store/modules/multiTags';
import Window from './components/Window.vue';
defineOptions({
    name:"PostOutApply"
})
//分页要用到的数据
const total=ref(0)
const page=ref(1)

//申请相关信息
const Infor=ref({
    status:"",
    start_date:""
})

//分页函数
let currentid=ref(0) //用于防止异步竞态
const Loadpage=async()=>{
let id=++currentid.value    
try{
const res=await getOutApplies({page:page.value,status:Infor.value.status,date:Infor.value.start_date})
if(id!==currentid.value){return}
if(res.status===0){
appliesList.value=res.data.list
    total.value=res.data.total
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
    total.value=res.data.total
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

//跳转到帖子详情
const route=useRouter()
const findDetail=(id:number)=>{
const resolve=route.resolve({name:'detail',params:{id}})
useMultiTagsStoreHook().handleTags('push',{
    path:resolve.path,
    name:resolve.name,
    params:resolve.params,
    meta:{...resolve.meta,showLink:true}
})
route.push({name:'detail',params:{id:id}})
}

//撤销按钮
const handleCancel=async(id:number)=>{
try{
    await ElMessageBox.confirm(
        `确定要撤销这条下架申请吗？撤销后需要重新提交申请。`,
        '撤销申请',
        {
            confirmButtonText:'确定撤销',
            cancelButtonText:'再想想',
            type:'warning',
            closeOnClickModal:false,
            distinguishCancelAndClose:true
        }
    )
}catch{return}
try{
    const res=await cancelApplies(id)
    if(res.status===0){
        ElMessage.success(res.msg)
        await Loadpage()
    }else{
        ElMessage.warning(res.msg || '撤销失败')
    }
}catch{
    ElMessage.warning("服务器或者网络异常")
}
}

//申诉函数
const visible=ref(false) // 决定申诉弹窗是否显示
const id=ref(0) //传递申诉的申请id
const complainApply=(apply_id:number)=>{
    id.value=apply_id
    visible.value=true
}

//查询相关的功能
const status=ref("") //申请的状态
const start_date=ref("")
const doing=ref(false) //防止用户重复点击
const findpage=ref(1) //查询的时候用的page
//查询函数
const findApplies=async()=>{
if(status.value==="" && start_date.value===""){return ElMessage.warning("查询条件不能为空")}
if(doing.value){return}else{doing.value=true}
try{
const res=await getOutApplies({page:findpage.value,status:status.value,date:start_date.value})
if(res.status===0){
    appliesList.value=res.data.list
    total.value=res.data.total
    page.value=findpage.value
    Infor.value.status=status.value
    Infor.value.start_date=start_date.value
}else{
    ElMessage.warning(res.msg || '查询失败')
}
}catch{
    ElMessage.warning("服务器或者网络异常")
}finally{
doing.value=false
}
}
//重置函数
const clearContent=async()=>{
    status.value=""
    start_date.value=""
    Infor.value.start_date=""
    Infor.value.status=""
    page.value=1
    await Loadpage()
}
</script>