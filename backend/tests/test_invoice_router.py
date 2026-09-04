import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from starlette.routing import Match

from app.db import Base
from app.models import InvoiceAmount, Patient  # noqa: F401
from app.routers.invoice_router import router


class InvoiceRouterTestCase(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def test_store_name_and_amount_update_routes_do_not_conflict(self):
        cases = {
            "/invoices/2026/9/store-name": "update_invoice",
            "/invoices/amounts/4": "update_amount",
        }
        for path, endpoint_name in cases.items():
            scope = {
                "type": "http",
                "path": path,
                "root_path": "",
                "method": "PUT",
            }
            matches = [
                route.endpoint.__name__
                for route in router.routes
                if route.matches(scope)[0] == Match.FULL
            ]
            self.assertEqual(matches, [endpoint_name])


if __name__ == "__main__":
    unittest.main()
