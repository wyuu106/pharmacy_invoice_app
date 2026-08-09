import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
from app.db import get_db, Base, engine
from app.utils.auth import hash_password
from app.models.user_model import User
from app.models import invoice_model, patient_model  # noqa: F401
from app.routers.auth_router import router as auth_router
from app.routers.invoice_router import router as invoice_router
from app.routers.patient_router import router as patient_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

# .envを読み込む
load_dotenv()

origins = os.getenv("ALLOW_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(patient_router)
app.include_router(invoice_router)

# 初期化（admin作成）API
@app.post("/init", response_model = dict)
def init(db: Session = Depends(get_db)) -> dict:
    admin_id = os.getenv("ADMIN_ID")
    admin_name = os.getenv("ADMIN_NAME")
    password = os.getenv("PASSWORD")

    if not admin_id or not admin_name or not password:
        raise HTTPException(status_code=500, detail="初期ユーザー情報が設定されていません")

    exist_admin = db.execute(select(User).where(User.id == admin_id)).scalar_one_or_none()

    if exist_admin:
        raise HTTPException(status_code=400, detail="登録済みです")

    admin = User(
        id = admin_id,
        name = admin_name,
        hashed_password = hash_password(password)
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {"message": "初期ユーザーを登録しました"}
