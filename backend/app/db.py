import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

load_dotenv()

DATABASE_PATH = Path(__file__).resolve().parents[1] / "test.db"
DEFAULT_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

# セッション作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# モデルのベース
Base = declarative_base()


# FastAPIの依存注入用。
# yieldで返し、リクエスト終了時に必ずcloseする。
# 使い方：def endpoint(db: Session = Depends(get_db)):
def get_db():
    db: Session = SessionLocal()  # 新しいセッション
    try:
        yield db
    finally:
        db.close()


def migrate_existing_database() -> None:
    """create_allでは更新されない既存SQLite DBへ不足カラムを追加する。"""
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    invoice_columns = (
        {column["name"] for column in inspector.get_columns("invoices")}
        if "invoices" in table_names
        else set()
    )
    patient_columns = (
        {column["name"] for column in inspector.get_columns("patients")}
        if "patients" in table_names
        else set()
    )
    if "store_name" not in invoice_columns and "invoices" in table_names:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE invoices ADD COLUMN store_name "
                    "VARCHAR(100) NOT NULL DEFAULT ''"
                )
            )
    if "is_active" not in patient_columns and "patients" in table_names:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE patients ADD COLUMN is_active "
                    "BOOLEAN NOT NULL DEFAULT 1"
                )
            )
