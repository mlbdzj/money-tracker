# money-tracker
记账

前后端分离：`backend/`（FastAPI + PostgreSQL）提供 API，`frontend/`（React + Vite）提供页面。

## 环境要求

- Python 3.10+（已在 `.venv` 虚拟环境中安装依赖）
- Node.js（已在 `frontend/node_modules` 中安装依赖）
- PostgreSQL，并创建数据库 `money_db`

## 第一步：准备数据库与配置

在 PostgreSQL 中创建数据库（默认账号见下），然后配置后端连接串：

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
```

编辑 `backend/.env`，将 `DATABASE_URL` 改成你自己的连接串，默认值为：

```
DATABASE_URL=postgresql://admin:123456@localhost:5432/money_db
```

> 首次启动后端会自动创建 `transactions` 数据表，无需手动建表。

## 第二步：启动后端

```bash
# 激活虚拟环境（Windows PowerShell）
.venv\Scripts\Activate.ps1
```

> macOS / Linux：`source .venv/bin/activate`

```bash
# 启动后端，监听 http://localhost:8000
uvicorn app.main:app --reload
```

- API 文档（Swagger）：http://localhost:8000/docs
- 健康检查：http://localhost:8000/

## 第三步：启动前端

```bash
cd frontend
npm run dev
```

浏览器打开 http://localhost:5173 即可使用。

开发时 Vite 已将 `/api` 请求代理到 `http://localhost:8000`，无需额外处理跨域。

## 常用命令

| 目录 | 命令 | 说明 |
| --- | --- | --- |
| 后端 | `uvicorn app.main:app --reload` | 开发模式启动后端（热重载） |
| 前端 | `npm run dev` | 开发模式启动前端（热重载） |
| 前端 | `npm run lint` | ESLint 检查 |
| 前端 | `npm run build` | 生产构建 |

## 目录结构

```
backend/               FastAPI 后端
  app/main.py          应用入口
  app/models.py        数据模型
  app/schemas.py       接口参数模型
  app/routers/         路由（transactions、summary）
frontend/              React 前端
  src/App.jsx          主页面
  src/api/index.js     后端接口封装
```
