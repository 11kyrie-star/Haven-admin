import { http } from "@/utils/http"
export type getPostRes<T>={
    status:number,
    msg:string,
    data:{
       list:T[],
       page:number,
       size:number,
       total:number,
       hasMore:boolean
    }
}

export type PostList={
    id:number,
    type:string,
    author:string,
    date:string,
    status:string,
    status_text:string,
    report_count:number,
    pending_count:number
}

export type DetailRes={
    status:number,
    msg:string,
    data:DetailPost
}

export type DetailPost={
    id:number,
    type:string,
    author:string,
    avatar:string,
    is_anonymous:number,
    content:string,
    images:string[],
    is_public:number,
    date:string,
    status:string,
    status_text:string
}
//获取帖子的api
export const getPostApi=(data:{page?:number,size?:number,keyword?:string,status?:'pending' | 'normal' | 'accepted' | 'multi_reported' | 'all' | '',author?:string,date?:string})=>{
   return http.request<getPostRes<PostList>>("get","/posts",{params:data})
}

export const getDetailPost=(id:number)=>{
    return http.request<DetailRes>("get",`/posts/${id}`)
}

type outApplyRes={
    status:number,
    msg:string,
    data:{
        id:number,
        post_id:number,
        apply_reason:string,
        status:number,
        status_text:string
    }
}

type directOutRes={
    status:number,
    msg:string,
    data:{
        id:number,
        status:string,
        status_text:string,
        offline_reason:string,
        already_offline:false
    }
}
//下架帖子的api
export const outApplyApi=(reason:string,id:number)=>{
    return http.request<outApplyRes>("post",`/posts/${id}/offline-apply`,{data:{reason}})
}

export const directOutApi=(reason:string,id:number)=>{
    return http.request<directOutRes>("post",`/posts/${id}/offline`,{data:reason})
}

