# Online Course Admin

## 项目简介

在线课程系统管理后台，基于 RuoYi-Vue3 改造，用于课程内容维护、学习数据查看、系统权限管理和运营配置。该项目与后端服务配合，为平台管理人员提供 Web 管理界面。

## 技术栈

- Vue 3
- Vite 6
- Element Plus
- Pinia
- Vue Router
- Axios
- ECharts
- Sass

## 关联仓库

| 子项目 | GitHub 仓库 | 说明 |
| --- | --- | --- |
| 后端服务 | [online-course-backend](https://github.com/jiangyi3265/online-course-backend) | Spring Boot 后端，提供管理接口与课程业务能力 |
| 管理后台 | [online-course-admin](https://github.com/jiangyi3265/online-course-admin) | 当前仓库，提供课程系统后台管理界面 |
| 用户端 | [online-course-app](https://github.com/jiangyi3265/online-course-app) | uni-app 用户端，面向学员使用 |

## 快速启动

```powershell
# 先启动 online-course-backend，默认监听 8080
npm install
npm run dev
```

开发环境接口前缀为 `/dev-api`，可在 `.env.development` 中调整。生产构建：

```powershell
npm run build:prod
```

## 简历描述示例

基于 Vue3、Vite 和 Element Plus 构建在线课程管理后台，实现课程运营、学习数据管理和系统权限配置等后台能力，并与 Spring Boot 后端完成前后端分离集成。
