import { http } from "@/utils/http";

export type UserResult = {
  status: number,
  msg:string,
  data: {
    id:number,
    token:string,
    refreshToken:string,
    refreshExpires:string,
    /** 用户名 */
    username: string;
    /** 昵称 */
    nickname:string,
    /** 当前登录用户的角色 */
    /** 按钮级别权限 */
    permissions: Array<string>;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export type RefreshTokenResult = {
  success: boolean;
  data: {
    token: string;
    refreshtoken: string;
    expires: Date;
  };
};

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<UserResult>("post", "/login", { data });
};

/** 刷新`token` */
export const refreshTokenApi = (data:{refreshToken:string}) => {
  return http.request<RefreshTokenResult>("post", "/refresh-token",{data:data});
};
