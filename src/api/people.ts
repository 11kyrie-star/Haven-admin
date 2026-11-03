import { http} from "@/utils/http";

type userListRes={
    status:number,
    msg:string,
    data:{
        list:userList[],
        page:number,
        size:number,
        total:number,
        hasMore:boolean
    }
}

export type userList={
    user_id:number,
    nickname:string,
    report_count:number,
    risk_level:string,
    risk_text:string,
    post_count:number,
    status:'normal' | 'banned',
    status_text:string,
    last_reported_at:string
}

export const getUserListApi=(params?: {
  page?: number;
  size?: number;
  keyword?: string;
  risk?: "high" | "medium" | "green";
  status?: "normal" | "banned";
  report_count?: number;
  report_count_min?: number;
  report_count_max?: number;
  post_count?: number;
  post_count_min?: number;
  post_count_max?: number;
})=>{
    return http.request<userListRes>("get",'/users',{params})
}

type banUserRes={
    status:number,
    msg:string,
    data:{
        user_id:number,
        nickname:string,
        status:string,
        status_text:string,
        ban_reason:string,
        ban_at:string
    }
}

export const banUserApi=(userId:number,reason:string,duration:string)=>{
    return http.request<banUserRes>("post",`/users/${userId}/ban`,{data:{action:"ban",reason,duration}})
}

type userInfoRes={
    status:number,
    msg:string,
    data:{
        user_id:number,
        nickname:string,
        avatar:string | null,
        email:string,
        register_at:string,
        post_count:number,
        status:"normal" | "banned",
        status_text:string,
        ban_reason:string,
        ban_at:string
    }
}

//获取用户的信息
export const getUserInfoApi=(userId:number)=>{
    return http.request<userInfoRes>("get",`/users/${userId}`)
}

type userPost={
    status:number,
    msg:string,
    data:{
        list:postList[],
        page:number,
        size:number,
        total:number,
        hasMore:boolean
    }
}

export type postList={
    post_id:number,
    content:string,
    images:string[],
    category:string,
    view_count:number,
    like_count:number,
    comment_count:number,
    status:string,
    status_text:string,
    offline_reason:string,
    created_at:string
}

//获取用户的发帖
export const getUserPostApi=(userId:number,page:number)=>{
    return http.request<userPost>("get",`/users/${userId}/posts`,{params:{page}})
}
