# Haven Admin

> 基于 [pure-admin-thin](https://github.com/pure-admin/pure-admin-thin) 二次开发的社区论坛（Haven）后台管理系统

[![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.11-409EFF)](https://element-plus.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## 项目简介

Haven Admin 是一个面向社区论坛的内容治理后台，围绕「举报处理 → 下架审批 → 用户封禁」的业务链路，为不同等级的管理员提供差异化的功能入口与首页数据看板。

项目采用**后端驱动动态路由 + 按钮级权限**的权限模型：前端不硬编码业务路由，登录后根据后端返回的路由表与权限码自动完成路由注册、菜单生成和多标签初始化。

> 本项目为纯前端工程，需要配合 Haven 后端服务运行。
> 后端仓库地址:

## 功能特性

### 分级管理

| 管理员等级 | 业务域 | 主要功能 |
| --- | --- | --- |
| 一级管理员 | 内容举报处理 | 待处理举报、举报记录、帖子查询、提交下架申请 |
| 二级管理员 | 下架申请审批 | 待审批下架申请、审批记录（批准 / 驳回）、举报处理 |
| 三级及以上 | 用户与封禁治理 | 用户列表、封禁 / 撤销封禁、封禁申诉、角色与账号管理 |

### 核心模块

- **登录与鉴权**：JWT 登录、`refreshToken` 自动续期、登出清理
- **首页看板**：按管理员等级渲染 KPI 卡片与近七天趋势图，支持从卡片跳转到对应业务页
- **举报管理**：待处理举报聚合展示、下架 / 驳回处理、举报记录查询与批量清理
- **帖子管理**：多条件帖子查询、帖子详情、下架申请提交、下架直接执行、审批与审批记录
- **用户管理**：用户列表（风险等级、举报次数、发帖数等筛选）、封禁 / 撤销封禁、封禁记录、封禁申诉处理
- **系统管理**：角色管理、账号管理
- **个人中心**：当前管理员信息与权限展示
- **交互体验**：多标签页、菜单搜索（拼音 / 首字母）、动态路由缓存、明暗主题、响应式布局

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 框架 | Vue 3.5（`<script setup>`）+ TypeScript |
| 构建 | Vite 7 |
| UI | Element Plus 2.11、Tailwind CSS 4 |
| 状态管理 | Pinia 3 |
| 路由 | Vue Router 4（Hash 模式） |
| 请求 | Axios（统一封装、Token 注入、刷新重连） |
| 图表 | ECharts 6 |
| 富文本安全 | DOMPurify |
| 代码规范 | ESLint 9、Prettier、Stylelint、vue-tsc |

## 目录结构

```text
├── build/                  # 构建相关插件与配置
├── public/                 # 静态资源及 platform-config.json 运行时配置
├── src
│   ├── api/                # 后端接口定义（按业务域拆分）
│   ├── components/         # 通用组件（RePerms、ReIcon 等）
│   ├── config/             # 平台运行时配置读取
│   ├── directives/         # 自定义指令（v-auth 等）
│   ├── layout/             # 布局、侧边栏、标签页、搜索
│   ├── plugins/            # Element Plus 等插件注册
│   ├── router/             # 路由入口、动态路由处理、静态路由模块
│   ├── store/              # Pinia 模块（user、permission、multiTags 等）
│   ├── style/              # 全局样式
│   ├── utils/              # HTTP 封装、权限判断、工具函数
│   └── views/              # 业务页面
│       ├── welcome/        # 首页看板
│       ├── PostManagement/ # 帖子管理
│       ├── ReportManagement/ # 举报管理
│       ├── UserManagement/ # 用户与封禁管理
│       ├── SystemManagement/ # 系统管理
│       └── login/          # 登录页
├── types/                  # 全局类型声明
├── .env.development        # 开发环境变量
├── .env.production         # 生产环境变量
└── vite.config.ts
```

## 快速开始

### 环境要求

- Node.js `^20.19.0` 或 `>= 22.13.0`
- pnpm `>= 9`

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/11kyrie-star/Haven-admin.git

# 2. 进入项目目录
cd Haven-admin

# 3. 安装依赖
pnpm install

# 4. 启动开发服务器
pnpm dev
```

启动后访问 `http://localhost:8848`。

> 登录账号由后端数据库初始化，请使用已创建的管理员账号登录。

### 构建与预览

```bash
pnpm build         # 生产环境构建
pnpm build:staging # 预发布环境构建
pnpm preview       # 本地预览构建产物
pnpm typecheck     # TypeScript 类型检查
pnpm lint          # ESLint + Prettier + Stylelint
```

## 环境变量

开发环境配置位于 `.env.development`：

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `VITE_PORT` | 开发服务器端口 | `8848` |
| `VITE_PUBLIC_PATH` | 部署公共路径 | `/` |
| `VITE_ROUTER_HISTORY` | 路由模式 | `hash` |
| `VITE_API_BASE` | 后端接口基础地址 | `http://127.0.0.1:3007/haven/admin` |

> 切换后端地址只需修改 `VITE_API_BASE`，无需改动请求封装代码。

## 接口约定

所有接口统一返回如下结构，`status === 0` 表示成功：

```json
{
  "status": 0,
  "msg": "success",
  "data": {}
}
```

列表接口的 `data` 统一为分页结构：

```json
{
  "list": [],
  "page": 1,
  "size": 10,
  "total": 100,
  "hasMore": true
}
```

主要接口分组：

| 模块 | 接口示例 |
| --- | --- |
| 认证 | `POST /login`、`POST /refresh-token` |
| 动态路由 | `GET /routes` |
| 首页看板 | `GET /dashboard`、`GET /role-description` |
| 帖子 | `GET /posts`、`GET /posts/:id`、`POST /posts/:id/offline-apply`、`POST /posts/:id/offline` |
| 下架审批 | `GET /offline-applications`、`GET /offline-approvals`、`POST /offline-applications/approve`、`POST /offline-applications/reject`、`GET /offline-approvals/records` |
| 举报 | `GET /reports`、`POST /reports/offline-apply`、`POST /reports/reject`、`GET /reports/records` |
| 用户与封禁 | `GET /users`、`GET /users/:id`、`POST /users/:id/ban`、`POST /users/:id/unban`、`GET /users/ban-records`、`GET /users/ban-appeals` |

## 权限与动态路由

### 鉴权流程

1. 登录成功后保存 `token` / `refreshToken` / `permissions`
2. 调用 `initRouter()` 请求 `GET /routes` 获取当前用户可见的路由树
3. 前端通过 `import.meta.glob` 匹配 `src/views` 下的组件并注册路由
4. 基于路由树生成菜单、初始化多标签页
5. 最后追加 404 兜底路由

### 路由返回结构

```json
[
  {
    "path": "/report",
    "meta": { "title": "举报管理", "icon": "report", "rank": 2 },
    "children": [
      {
        "path": "/report/appending",
        "name": "ReportAppending",
        "component": "ReportManagement/AppendingReport/index",
        "meta": { "title": "待处理举报", "rank": 1, "keepAlive": true }
      }
    ]
  }
]
```

> 注意：叶子路由的 `component` 必须能唯一匹配 `src/views` 下的文件，`name` 需全局唯一，否则会导致路由注册失败或页面空白。

### 按钮级权限

- 函数式：`hasPerms("post:offline")`
- 组件式：`<RePerms value="post:offline">...</RePerms>`
- 指令式：`v-auth="'post:offline'"`

`permissions` 中包含 `*:*:*` 时视为超级管理员，全部放行。

### 新增一个业务页面

1. 在 `src/views` 下创建页面组件
2. 由后端在 `/routes` 中返回对应的路由节点（含唯一 `component` 与 `name`）
3. 前端无需修改路由文件，登录后自动注册并生成菜单

## 项目亮点

- **配置驱动首页**：按 `level` 查表决定 KPI 卡片与图表，新增管理员等级只需增加配置，渲染逻辑不变
- **请求竞态处理**：分页请求携带递增序号，避免快速翻页时旧响应覆盖新数据
- **查询条件分离**：列表页将「表单草稿条件」与「已生效条件」分离，查询时才重置页码并发起请求
- **ECharts 生命周期管理**：`shallowRef` 持有实例、`setOption(notMerge)`、`ResizeObserver` 自适应、卸载时 `dispose`
- **XSS 防护**：富文本统一经 DOMPurify 过滤后再渲染
- **运行时配置**：`public/platform-config.json` 支持打包后修改标题、主题、布局等，无需重新编译

## 常见问题

**Q：登录成功但首页空白 / 侧边栏没有菜单？**
检查后端 `/routes` 返回值：叶子节点的 `component` 是否能匹配 `src/views` 下的文件，`name` 是否唯一，`status` 是否为 `0`。

**Q：接口请求 404 或跨域？**
确认后端服务已启动，且 `.env.development` 中的 `VITE_API_BASE` 地址与端口正确。

**Q：Windows 下 `pnpm dev` 报 `NODE_OPTIONS` 不是内部或外部命令？**
脚本中的 `NODE_OPTIONS=xxx vite` 是类 Unix 写法，请在 Git Bash / WSL 中执行，或自行改用 `cross-env`。

## 致谢

本项目基于 [pure-admin-thin](https://github.com/pure-admin/pure-admin-thin) 二次开发，感谢 [pure-admin](https://github.com/pure-admin) 团队提供的优秀开源模板。使用前请同时遵守原项目的 MIT 协议。

## 许可证

[MIT](./LICENSE)
