import { Fragment, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Message from "../components/Message";
import { api } from "../utils/api";

const PATIENTS_PER_PAGE = 10;
const formatYen = (value) => `${Number(value).toLocaleString("ja-JP")}円`;

function splitIntoPages(items) {
  if (items.length === 0) return [[]];
  return Array.from(
    { length: Math.ceil(items.length / PATIENTS_PER_PAGE) },
    (_, index) =>
      items.slice(index * PATIENTS_PER_PAGE, (index + 1) * PATIENTS_PER_PAGE),
  );
}

function amountExpression(item) {
  if (item.amounts.length === 0) return "未入力";
  const amounts = item.amounts.map(({ amount }) => formatYen(amount));
  if (amounts.length === 1) return amounts[0];
  return `${amounts.join(" ＋ ")} ＝ ${formatYen(item.subtotal)}`;
}

export default function PrintPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getFullYear();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api(`/invoices/${year}/${month}`)
      .then((data) => {
        if (active) setInvoice(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [year, month]);

  const pages = splitIntoPages(invoice?.patients || []);

  return (
    <main className="print-preview">
      <div className="print-actions">
        <button className="secondary" onClick={() => navigate("/invoice")}>
          請求書作成に戻る
        </button>
        <button
          className="primary"
          disabled={!invoice}
          onClick={() => window.print()}
        >
          印刷する
        </button>
      </div>
      <Message>{error}</Message>
      {!invoice && !error ? (
        <p className="loading">印刷内容を読み込み中…</p>
      ) : (
        pages.map((patients, pageIndex) => (
          <section className="print-sheet" key={pageIndex}>
            <header className="print-header">
              <h1>
                {year}年 {month}月分 調剤費請求書
              </h1>
              <div className="print-summary">
                <span className="print-pharmacy-name">
                  {invoice?.store_name || "（店名未設定）"}
                </span>
                <span>合計：{formatYen(invoice?.total || 0)}</span>
                {pages.length > 1 && (
                  <small>
                    {pageIndex + 1} / {pages.length}
                  </small>
                )}
              </div>
            </header>
            <div className="print-table">
              <h2 className="print-patient-column">患者名</h2>
              <h2>請求金額</h2>
              {patients.map((item, index) => (
                <Fragment key={item.id}>
                  <div className="print-patient-name">
                    <span className="print-patient-number">
                      {pageIndex * PATIENTS_PER_PAGE + index + 1}.
                    </span>
                    <strong>{item.patient.name}</strong>
                    <span className="print-honorific">様</span>
                  </div>
                  <div className="print-amount">
                    {amountExpression(item)}
                  </div>
                </Fragment>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
