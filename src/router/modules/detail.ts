export default{
    path:"/detail/:id",
    name:"detail",
    meta:{
        title:"帖子详情",
        rank:3,
        showLink:false
    },
    component:()=>import("@/views/Detail/index.vue")
}