<template>
    <div class="findpost-container">
        <div class="findpost-tool">
            <div class="input">
               <el-input placeholder="作者" style="width: 240px;" v-model="Forminfo.author"></el-input>
               <el-select v-model="status" placeholder="帖子状态:全部" style="width: 150px;">
                  <el-option label="全部" value="all"></el-option>
                  <el-option label="正常" value="normal"></el-option>
                  <el-option label="待受理" value="pending"></el-option>
                  <el-option label="被多人举报" value="multi_reported"></el-option>
               </el-select>
               <el-date-picker v-model="Forminfo.start_date" type="date" placeholder="创建时间" value-format="YYYY-MM-DD" style="width: 240px;" :editable="false" :disabled-date="(d:Date)=>d.getTime()>Date.now()"></el-date-picker>
            </div>
            <div class="button">
                <el-button type="success" size="small" @click="findPost" :disabled="doing">查询</el-button>
                <el-button size="small" @click="clearCondition">重置</el-button>
            </div>
        </div>
        <div class="findpost-table">
           <el-table stripe :data="tableData" style="width: 100%;">
              <el-table-column label="帖子类型" min-width="200" prop="type"></el-table-column>
              <el-table-column label="作者" min-width="200" prop="author"></el-table-column>
              <el-table-column label="帖子状态" min-width="200">
                <template #default="scope">
                    <el-button v-if="scope.row.status==='normal'" style="cursor: default;" size="small" type='success'>{{ scope.row.status_text }}</el-button>
                    <el-button v-else style="cursor: default;" size="small" :type="scope.row.status==='multi_reported'? 'danger':'warning'">{{ scope.row.status_text }}</el-button>
                </template>
              </el-table-column>
              <el-table-column label="创建时间" min-width="200" prop="date"></el-table-column>
              <el-table-column label="操作" min-width="200">
                <template #default="scope">
                    <el-button size="small" type="primary" @click="findDetail(scope.row.id)">查看</el-button>
                    <el-button size="small" :disabled="scope.row.status==='accepted'" type="danger" @click="pullPost(scope.row.id)">下架</el-button>
                </template>
              </el-table-column>
           </el-table>
        </div>
        <div class="page-tool">
            <el-pagination v-model:current-page="page"  :total="total" layout="total,prev,pager,next" background @current-change="Loadpage"></el-pagination>
        </div>
        <window v-model:visible="decWindow" v-model:postid="postid"></window>
    </div>
</template>

<style lang="scss" scoped>
.findpost-container{
    width: 95%;
    height: 100%;
    .findpost-tool{
        display: flex;
        gap: 20px;
        .input{
            display: flex;
            gap: 20px;
        }
    }
    .findpost-table{
        margin-top: 15px;
        width: 100%;
    }
    .page-tool{
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
    }
}
</style>

<script setup lang="ts">
import {ref,onMounted, reactive} from 'vue'
import { useRouter } from 'vue-router'
import  {type PostList,type getPostRes,getPostApi} from '@/api/post'
import { ElMessage } from 'element-plus'
import { useMultiTagsStoreHook } from '@/store/modules/multiTags'
import Window from './components/Window.vue'
defineOptions({
    name:"PostFind"
})
const route=useRouter()
let status=ref<"" | 'pending' | 'normal' | 'accepted' | 'multi_reported' | 'all'>("") //帖子状态
onMounted(async()=>{
const res=await getPostApi({})
if(res.status===0){
    tableData.value=res.data.list
    total.value=res.data.total
}
})

//表格数据
const tableData=ref<PostList[]>([])

//查看帖子的函数
const findDetail=(id:number)=>{
const  resolved=route.resolve({name:'detail',params:{id}})
useMultiTagsStoreHook().handleTags('push',{
    path:resolved.path,
    name:resolved.name,
    params:resolved.params,
    meta:{...resolved.meta,showLink:true}
})
route.push({name:'detail',params:{id:id}})
}

const decWindow=ref(false) //决定下架的弹窗是否显示
//提交下架帖子的函数
const postid=ref(0) //用于记录要下架的帖子的id，然后传给子组件
const pullPost=(id:number)=>{
decWindow.value=true
postid.value=id
}

//分页部分
const page=ref(1)
const total=ref(0)

//下一页或者上一页
let tag=0 //用于防止异步竞态
let currentstatus=false //用于判断当前是否是查询状态下的分页
const Loadpage=async()=>{
const currentid=++tag
const res=ref<getPostRes<PostList>>()
if(!currentstatus){
     res.value=await getPostApi({page:page.value})
}else{
    res.value=await getPostApi({page:page.value,author:Forminfo.author,date:Forminfo.start_date,status:status.value})
}
if(currentid!==tag){return}
if(res.value.status===0){
    tableData.value=res.value.data.list
    total.value=res.value.data.total
}else{
    ElMessage.warning("服务器或者网络异常")
}
}

//查询功能的相关信息
const Forminfo=reactive({
    author:"",
    start_date:""
})

//根据条件查询帖子
let doing=ref(false) // 防止用户在一个请求还没有发送完毕的时候再次点击查询
const  findPost=async()=>{
if(Forminfo.author===""&&Forminfo.start_date===""&&status.value===""){
    return ElMessage.warning("查询条件不能为空")
}
if(!doing.value){
    doing.value=true
    currentstatus=true
    page.value=1 //重置page，不同条件下的page是不一样的，防止数据错乱
}else{return}
try{
const res=await getPostApi({page:page.value,author:Forminfo.author,date:Forminfo.start_date,status:status.value})
if(res.status===0){
    total.value=res.data.total
    tableData.value=res.data.list
}
}finally{
    doing.value=false
}
}

//重置条件
const clearCondition=async()=>{
if(Forminfo.author==="" && Forminfo.start_date==="" && status.value==="" && !currentstatus){return}    
Forminfo.author=""
Forminfo.start_date=""
status.value=""
currentstatus=false
page.value=1
const res=await getPostApi({page:page.value})
if(res.status===0){
    tableData.value=res.data.list
    total.value=res.data.total
}else{
    return ElMessage.warning("服务器或者网络异常")
}
}
</script>