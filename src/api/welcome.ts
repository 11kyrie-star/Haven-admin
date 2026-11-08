import { http } from "@/utils/http";

interface dashboardRes {
  status: number;
  msg: string;
  data: {
    level: number;
    role_name: string;
    /** 统计数字：不同等级返回不同字段（覆盖式），前端按 level 配置表取数 */
    stats: Record<string, number | undefined>;
    /** 近 7 天趋势：dates 恒存在，其余为按等级返回的序列字段 */
    trend: {
      dates: string[];
      [key: string]: number[] | string[] | undefined;
    };
  };
}

//获取首页看板
export const getDashBoard = () => {
  return http.request<dashboardRes>("get", "/dashboard");
};

interface descriptionRes {
  status: number;
  msg: string;
  data: {
    level: number;
    role_name: string;
    nickname: string;
    greeting: string;
    duties: string[];
    permissions: string[];
    permission_names: string[];
  };
}

//职位描述接口
export const getDesApi = () => {
  return http.request<descriptionRes>("get", "/role-description");
};
