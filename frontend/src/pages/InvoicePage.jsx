import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Message from "../components/Message";
import { api } from "../utils/api";

const today = new Date();

export default function InvoicePage() {
  const navigate = useNavigate();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [invoice, setInvoice] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [query, setQuery] = useState("");
  const [showCandidates, setShowCandidates] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!showCandidates) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") setShowCandidates(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [showCandidates]);

  const loadInvoice = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      setInvoice(await api(`/invoices/${year}/${month}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    let active = true;
    api(`/invoices/${year}/${month}`)
      .then((data) => {
        if (active) setInvoice(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [year, month]);

  async function searchCandidates(search = "") {
    try {
      const suffix = search ? `?query=${encodeURIComponent(search)}` : "";
      const data = await api(`/patients${suffix}`);
      const usedIds = new Set(
        invoice?.patients.map((item) => item.patient.id) || [],
      );
      setCandidates(data.filter((patient) => !usedIds.has(patient.id)));
      setShowCandidates(true);
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveStoreName(rawValue) {
    const storeName = rawValue.trim();
    if (!storeName) {
      setError("店名を入力してください");
      return;
    }

    const invoiceId = invoice?.id;
    setError("");
    try {
      const data = await api(`/invoices/${year}/${month}`, {
        method: "PUT",
        body: JSON.stringify({ store_name: storeName }),
      });
      setInvoice((current) => (current?.id === invoiceId ? data : current));
    } catch (err) {
      setError(err.message);
    }
  }

  async function addPatient(patientId) {
    try {
      const data = await api(`/invoices/${year}/${month}/patients`, {
        method: "POST",
        body: JSON.stringify({ patient_id: patientId }),
      });
      setInvoice(data);
      setShowCandidates(false);
      setQuery("");
      setNotice("患者を追加しました");
    } catch (err) {
      setError(err.message);
    }
  }

  async function removePatient(item) {
    const confirmed = window.confirm(
      `${item.patient.name}さんを今月の請求書から外しますか？`,
    );
    if (!confirmed) return;

    try {
      await api(`/invoices/patients/${item.id}`, {
        method: "DELETE",
      });
      await loadInvoice();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addAmount(itemId) {
    try {
      await api(`/invoices/patients/${itemId}/amounts`, {
        method: "POST",
        body: JSON.stringify({ amount: 0 }),
      });
      await loadInvoice();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveAmount(amountId, rawValue) {
    const amount = Number(rawValue);
    if (!Number.isInteger(amount) || amount < 0) {
      setError("金額は0以上の整数で入力してください");
      return;
    }

    try {
      const saved = await api(`/invoices/amounts/${amountId}`, {
        method: "PUT",
        body: JSON.stringify({ amount }),
      });
      setInvoice((current) => {
        if (!current) return current;

        const patients = current.patients.map((item) => {
          if (!item.amounts.some((entry) => entry.id === amountId)) return item;
          const amounts = item.amounts.map((entry) =>
            entry.id === amountId ? saved : entry,
          );
          return {
            ...item,
            amounts,
            subtotal: amounts.reduce((sum, entry) => sum + entry.amount, 0),
          };
        });

        return {
          ...current,
          patients,
          total: patients.reduce((sum, item) => sum + item.subtotal, 0),
        };
      });
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeAmount(amountId) {
    try {
      await api(`/invoices/amounts/${amountId}`, {
        method: "DELETE",
      });
      await loadInvoice();
    } catch (err) {
      setError(err.message);
    }
  }

  function changeYear(value) {
    setLoading(true);
    setYear(Number(value));
  }

  function changeMonth(value) {
    setLoading(true);
    setMonth(Number(value));
  }

  function renderInvoiceList() {
    if (loading) {
      return <p className="loading">請求書を読み込み中…</p>;
    }
    if (!invoice) {
      return (
        <div className="empty-state">
          <strong>請求書を表示できませんでした</strong>
          <p>
            バックエンドが起動しているか確認して、
            ページを再読み込みしてください
          </p>
        </div>
      );
    }
    if (invoice.patients.length === 0) {
      return (
        <div className="empty-state">
          <strong>請求する患者がまだいません</strong>
          <p>「患者を追加」ボタンから追加してください</p>
        </div>
      );
    }

    return (
      <div className="invoice-list">
        {invoice.patients.map((item) => (
          <article className="invoice-card" key={item.id}>
            <div className="invoice-patient">
              <h2>{item.patient.name}</h2>
              <button
                className="text-danger"
                onClick={() => removePatient(item)}
              >
                この月から外す
              </button>
            </div>
            <div className="amount-list">
              {item.amounts.length === 0 && (
                <p className="no-amount">金額が未入力です</p>
              )}
              {item.amounts.map((amount, index) => (
                <div className="amount-row" key={amount.id}>
                  <label>
                    金額 {index + 1}
                    <span className="amount-input">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={amount.amount}
                        onBlur={(event) =>
                          saveAmount(amount.id, event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") return;
                          event.preventDefault();
                          event.currentTarget.blur();
                        }}
                      />
                      <span>円</span>
                    </span>
                  </label>
                  <button
                    aria-label={`金額${index + 1}を削除`}
                    className="icon-danger"
                    onClick={() => removeAmount(amount.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="add-amount" onClick={() => addAmount(item.id)}>
                ＋ 金額欄を追加
              </button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <>
      <header className="page-header">
        <h1>請求書作成</h1>
      </header>
      <section className="period-card">
        <label>
          <select
            aria-label="請求する年"
            value={year}
            onChange={(event) => changeYear(event.target.value)}
          >
            {Array.from(
              { length: 7 },
              (_, index) => today.getFullYear() - 3 + index,
            ).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <span className="period-unit">年</span>
        <label>
          <select
            aria-label="請求する月"
            value={month}
            onChange={(event) => changeMonth(event.target.value)}
          >
            {Array.from({ length: 12 }, (_, index) => index + 1).map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </select>
        </label>
        <span className="period-unit">月分</span>
        <div className="store-name-field">
          <label htmlFor="store-name">店名</label>
          <input
            disabled={loading || !invoice}
            id="store-name"
            maxLength="100"
            placeholder="例：さくら薬局"
            value={invoice?.store_name || ""}
            onBlur={(event) => saveStoreName(event.target.value)}
            onChange={(event) =>
              setInvoice((current) =>
                current
                  ? { ...current, store_name: event.target.value }
                  : current,
              )
            }
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              if (event.nativeEvent.isComposing || event.keyCode === 229) {
                return;
              }
              event.preventDefault();
              event.currentTarget.blur();
            }}
          />
        </div>
      </section>
      <Message>{error}</Message>
      <Message type="success">{notice}</Message>
      <div className="invoice-toolbar">
        <h2>
          請求する患者{" "}
          <span className="count-badge">
            {invoice?.patients.length || 0}人
          </span>
        </h2>
      </div>
      {showCandidates && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCandidates(false);
          }}
        >
          <section
            aria-labelledby="candidate-dialog-title"
            aria-modal="true"
            className="candidate-panel"
            role="dialog"
          >
            <div className="row-between">
              <h2 id="candidate-dialog-title">追加する患者を選ぶ</h2>
              <button
                className="text-button"
                onClick={() => setShowCandidates(false)}
              >
                閉じる
              </button>
            </div>
            <form
              className="search-bar"
              onSubmit={(event) => {
                event.preventDefault();
                searchCandidates(query);
              }}
            >
              <input
                autoFocus
                placeholder="氏名で検索"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button className="secondary">検索</button>
            </form>
            {candidates.length === 0 ? (
              <p>追加できる患者はいません</p>
            ) : (
              <div className="candidate-list">
                {candidates.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => addPatient(patient.id)}
                  >
                    <strong>{patient.name}</strong>
                    <span className="add-label">追加</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
      {renderInvoiceList()}
      <div className="invoice-actions">
        <button className="add-patient-fab" onClick={() => searchCandidates()}>
          ＋ 患者を追加
        </button>
        <button
          className="print-fab"
          disabled={loading || !invoice}
          onClick={() => navigate(`/print?year=${year}&month=${month}`)}
        >
          印刷
        </button>
      </div>
    </>
  );
}
