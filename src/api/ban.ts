import {http} from "@/utils/http"

type banRecordsRes={
    status:number,
    msg:string,
    data:{
        list:banRecordList[],
        page:number,
        size:number,
        total:number,
        hasMore:boolean
    }
}

export type banRecordList={
    record_id:number,
    user_id:number,
    nickname:string,
    ban_reason:string,
    ban_duration:string,
    ban_until:string,
    handled_at:string,
    operator_name:string,
    account_status:"normal" | "banned",
    account_status_text:string
}

export const getBanRecordsApi=(data:{page?:number,size?:number,date?:string,start_date?:string,end_start?:string})=>{
    return http.request<banRecordsRes>("get","/users/ban-records",{params:{data}})
}

type delBanRecordRes={
    status:number,
    msg:string,
    data:{record_id:number}
}

//删除单条封禁的处理记录
export const delBanRecordApi=(record_id:number)=>{
    return http.request<delBanRecordRes>("delete",`/users/ban-records/${record_id}`)
}

type cancelBanRes={
    status:number,
    msg:string,
    data:{
        user_id:number,
        nickname:string,
        status:"normal" | "banned",
        status_text:string,
        unban_reason:string,
        unban_at:string
    }
}

//撤销封禁的接口
export const cancelBanApi=(user_id:number,reason:string)=>{
    return http.request<cancelBanRes>("post",`/users/${user_id}/unban`,{data:{reason}})
}

type banAppealsRes={
    status:number,
    msg:string,
    data:{
        list:banAppealsList[],
        page:number,
        size:number,
        total:number,
        hasMore:boolean
    }
}

export type banAppealsList={
    appeal_id:number,
    user_id:number,
    nickname:string,
    appeal_reason:string,
    appeal_at:string,
    status:string,
    status_text:string,
    reject_reason:string
}

//获取封禁的申诉列表
export const getBanAppealsApi=(data:{page?:number,size?:number,status?:string,date?:string,start_date?:string,end_date?:string})=>{
    return http.request<banAppealsRes>("get","/users/ban-appeals",{params:{data}})
}

type rejectBanAppealRes={
    status:number,
    msg:string,
    data:{
        appeal_id:number,
        user_id:number,
        nickname:string,
        status:string,
        status_text:string,
        handled_reason:string,
        handled_at:string,
        account_unbanned:boolean
    }
}

//驳回封禁的申诉
export const rejectBanAppeal=(id:number,reason:string)=>{
    return http.request<rejectBanAppealRes>("post",`/users/ban-appeals/${id}/reject`,{data:{reason}})
}

type approveAppealRes={
    status:number,
    msg:string,
    data:{
        appeal_id:number,
        user_id:number,
        nickname:string,
        status:string,
        status_text:string,
        handled_at:string,
        account_status:"normal" | "banned",
        account_status_text:string,
        account_unbanned:boolean
    }
}

//同意封禁的申诉
export const approveAppealApi=(user_id:number)=>{
    return http.request<approveAppealRes>("post",`/users/${user_id}/appeal/approve`)
}