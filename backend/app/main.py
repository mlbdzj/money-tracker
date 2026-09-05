from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import transactions, summary

# 创建数据库表（首次运行）
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Money Tracker API", version="1.0")

# 允许跨域（开发环境）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],   # Vite 默认端口
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(transactions.router)
app.include_router(summary.router)

@app.get("/")
def root():
    return {"message": "Money Tracker API is running"}