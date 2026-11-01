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

type approveOutsRes={
    status:number,
    msg:string,
    data:{
        list:approveList[],
        page:number,
        size:number,
        total:number,
        hasMore:boolean
    }
}

export type approveList={
    post_id:number,
    post_type:string,
    author_id:number,
    author:string,
    apply_count:number,
    first_apply_at:string,
    last_apply_at:string,
    applications:approveApplications[]
}

export type approveApplications={
    id:number,
    applicant_id:number,
    applicant_name:string,
    status:string,
    status_text:string,
    created_at:string
}
//二级管理员审批下架申请
export const getApproveOutsApi=(data:{page?:number,size?:number,apply_count?:number | null,apply_count_min?:number | null,apply_count_max?:number | null,date?:string,start_date?:string,end_date?:string})=>{
    return http.request<approveOutsRes>("get",'/offline-approvals',{params:data})
}

type rejectApproveApplications={
    status:number,
    msg:string,
    data:{
        post_id:number,
        rejected_count:number,
        status:string,
        status_text:string,
        handle_reason:string
    }
}

//二级及以上管理员驳回下架申请
export const rejectApproveApi=(data:{post_id:number,reason:string})=>{
    return http.request<rejectApproveApplications>("post",'/offline-applications/reject',{data:data})
}

type approveApplyRes={
    status:number,
    msg:string,
    data:{
        post_id:number,
        approved_count:number,
        status:string,
        status_text:string,
        offline_reason:string,
        handled_report_count:number
    }
}

//二级及以上管理员批准下架申请
export const approveApplyApi=(data:{post_id:number,reason:string})=>{
    return http.request<approveApplyRes>("post",'/offline-applications/approve',{data:data})
}

type approveRecordRes={
    status:number,
    msg:string,
    data:{
        list:approveRecordList[],
        page:number,
        size:number,
        total:number,
        hasMore:boolean
    }
}

export type approveRecordList={
    record_id:string,
    post_id:number,
    post_type:string,
    author_id:number,
    author:string,
    status:string,
    status_text:string,
    handle_by:number,
    handle_name:string,
    handle_reason:string,
    handled_at:string,
    application_count:number,
    applications:approveApplicationsRecord[]
}

export type approveApplicationsRecord={
    id:number,
    applicant_id:number,
    applicant_name:string,
    apply_reason:string,
    status:string,
    status_text:string,
    created_at:string
}



//获取二级及以上管理员的审批记录
export const getApproveRecord=(data?: {
  page?: number;
  size?: number;
  status?: "all" | "approved" | "rejected";
  date?: string;
  start_date?: string;
  end_date?: string;
  apply_count?: number;
  apply_count_min?: number;
  apply_count_max?: number;})=>{
    return http.request<approveRecordRes>("get",'/offline-approvals/records',{params:data})
}

type delApproveRecordRes={
    status:number,
    msg:string,
    data:{deleted_count:number}
}

type clearApproveRecordsRes={
    status:number,
    msg:string,
    data:{deleted_count:number}
}

//删除单条审批记录
export const delApproveRecord=(recordId:string)=>{
    return http.request<delApproveRecordRes>("delete",'/offline-approvals/records',{data:{record_id:recordId}})
}

//删除所有审批记录
export const clearApproveRecords=()=>{
    return http.request<clearApproveRecordsRes>("delete", "/offline-approvals/records/all")
}
