# InfoHunter

## How to run

`cp .env.example .env`

```
pnpm install
pnpm dev
```

## 项目结构

```Shell
/app - Next.js 应用主目录
/components - React 组件
/lib - 核心库和服务
/processors - 数据处理器，包括工作流处理
/schema.ts - 数据库模式定义
/localStorageService.ts - 本地存储服务
/types - TypeScript 类型定义
/public - 静态资源文件
/drizzle - Drizzle ORM 迁移文件
```

## 主要功能

- 本地数据管理：账户、群组和关联关系
- 工作流处理：支持多种消息抓取策略（latest_n、past_time、mixed）
- 数据聚合与处理
- 数据库使用 PostgreSQL + Drizzle ORM
