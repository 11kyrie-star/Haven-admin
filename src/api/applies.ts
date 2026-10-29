import { http } from "@/utils/http"

type getOutAppliesRes<T>={
    status:number,
    msg:string,
    data:{
      list:T[],
      page:number,
      size:number,
      total:number,
      hasMore:false
    }
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

type cancelAppliesRes={
    status:number,
    msg:string,
    data:{
        id:number,
        post_id:number,
        status:string,
        status_text:string
    }
}

type complainAppliesRes={
    status:number,
    msg:string,
    data:{
        id:number,
        post_id:number,
        status:string,
        status_text:string
    }
}

export const getOutApplies=(data:{page?:number,size?:number,status?:string,date?:string})=>{
    return http.request<getOutAppliesRes<outAppliesList>>("get","/offline-applications",{params:data})
}

export const cancelApplies=(id:number)=>{
    return http.request<cancelAppliesRes>("post",`/offline-applications/${id}/cancel`)
}

export const complainAppliesApi=(id:number,data:{reason:string})=>{
    return http.request<complainAppliesRes>("post",`/offline-applications/${id}/appeal`,{data:data})
}