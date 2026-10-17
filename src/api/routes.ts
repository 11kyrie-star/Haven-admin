import { http } from "@/utils/http";
interface Meta{
  title:string,
  icon:string,
  rank:number
}

interface ChildrenMeta{
  title:string,
  rank:number
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
      component:string,
      children:ChildrenData[]
    }
  ]
};

export const getAsyncRoutes = () => {
  return http.request<Result>("get", "/routes");
};
