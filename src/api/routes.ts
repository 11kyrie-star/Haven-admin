import { http } from "@/utils/http";
interface Meta{
  title:string,
  icon:string,
  rank:number
}

interface ChildrenMeta{
  title:string,
  rank:number,
  keepAlive:boolean
}

interface ChildrenData{
  path:string,
  name:string,
  component:string,
  meta:ChildrenMeta
}
type Result = {
  status:number,
  msg:string,
  data: [
    {
      path:string,
      meta:Meta,
      children:ChildrenData[]
    }
  ]
};

export const getAsyncRoutes = () => {
  return http.request<Result>("get", "/routes");
};
