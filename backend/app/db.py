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
    if "invoices" not in inspect(engine).get_table_names():
        return
    columns = {column["name"] for column in inspect(engine).get_columns("invoices")}
    if "store_name" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE invoices ADD COLUMN store_name "
                    "VARCHAR(100) NOT NULL DEFAULT ''"
                )
            )
