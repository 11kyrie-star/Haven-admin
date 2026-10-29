import {http} from '@/utils/http'

type getReportsRes={
    status:number,
    msg:string,
    data:{
      list:reportData[],
      page:number,
      size:number,
      total:number,
      hasMore:boolean
    }
}

export type reportData={
    post_id:number,
    post_type:string,
    status:string,
    status_text:string,
    report_count:number,
    first_report_at:string,
    last_report_at:string,
    reports:reportList[]
}

export type reportList={
    id:number,
    reporter:string,
    reasons:string[],
    description:string,
    created_at:string,
    status?:string,
    status_text?:string
}

export const getRportApi=(page?:number,szie?:number,report_count?:number,date?:string)=>{
    return http.request<getReportsRes>('get','/reports',{params:{page,szie,date,report_count}})
}

type handleReportRes={
    status:number,
    msg:string,
    data:{
        id:number,
        post_id:number,
        apply_reason:string,
        status:string,
        status_text:string,
        handled_report_count:number
    }
}

export const handleReportApi=(data:{post_id:number,reason:string})=>{
    return http.request<handleReportRes>('post','/reports/offline-apply',{data:data})
}

type rejectRes={
    status:number,
    msg:string,
    data:{
        post_id:number,
        handled_report_count:number,
        handle_result:string
    }
}

export const rejectApi=(data:{post_id:number,reason:string})=>{
    return http.request<rejectRes>('post','/reports/reject',{data:data})
}

export type reportRecordRes={
    status:number,
    msg:string,
    data:{
        list:recordList[],
        page:number,
        size:number,
        total:number,
        hasMore:boolean
    }
}

type recordList={
    post_id:number,
    post_type:string,
    report_count:number,
    handle_result:string,
    handled_at:string,
    reports:reportsList[]
}

type reportsList={
    id:number,
    reporter:string,
    reasons:string[],
    description:string,
    created_at:string
}

//获取举报记录的接口
export const getReportRecordApi=(data:{page?:number,size?:number,date?:string})=>{
    return http.request<reportRecordRes>('get','/reports/records',{params:data})
}

type delRecordRes={
    status:number,
    msg:string,
    data:{
        deleted_count:number,
        deleted_report_count:number
    }
}

//批量删除
export const delReportRecordApi=(data:{post_ids:number[]})=>{
    return http.request<delRecordRes>('delete','/reports/records',{data:data})
}

//删除所有记录
export const delAllRecordApi=()=>{
    return http.request<delRecordRes>('delete','/reports/records/all')
}