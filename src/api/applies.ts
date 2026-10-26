import { http } from "@/utils/http"

type getOutAppliesRes<T>={
    status:number,
    msg:string,
    data:{
      list:T[]
    },
    page:number,
    size:number,
    total:number,
    hasMore:false
}

export type outAppliesList={
    id:number,
    post_id:number,
    apply_reason:string,
    status:string,
    status_text:string,
    handler_name:string,
    created_at:string
}

export const getOutApplies=(data:{page?:number,size?:number,status?:'all' | 'pending' | 'done' | 'rejected'})=>{
    return http.request<getOutAppliesRes<outAppliesList>>("get","/offline-applications",{params:data})
}