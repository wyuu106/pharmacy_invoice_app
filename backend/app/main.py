import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import Base, engine, migrate_existing_database
from app.models import invoice_model, patient_model  # noqa: F401
from app.routers.invoice_router import router as invoice_router
from app.routers.patient_router import router as patient_router

Base.metadata.create_all(bind=engine)
migrate_existing_database()

app = FastAPI()

# .envを読み込む
load_dotenv()

origins = os.getenv("ALLOW_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patient_router)
app.include_router(invoice_router)
