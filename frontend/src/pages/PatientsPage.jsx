import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Message from "../components/Message";
import { api } from "../utils/api";

function patientsPath(search, isActive) {
  const params = new URLSearchParams({ is_active: String(isActive) });
  if (search) params.set("query", search);
  return `/patients?${params.toString()}`;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showActive, setShowActive] = useState(true);

  async function load(search = "", isActive = showActive) {
    setLoading(true);
    setError("");
    try {
      setPatients(await api(patientsPath(search, isActive)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api(patientsPath("", true))
      .then((data) => {
        if (active) setPatients(data);
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
  }, []);

  return (
    <>
      <header className="page-header row-between">
        <div className="patient-heading">
          <h1>患者一覧</h1>
          <div className="visibility-toggle" aria-label="患者の表示切り替え">
            <button
              aria-pressed={showActive}
              className={showActive ? "active" : ""}
              onClick={() => {
                setShowActive(true);
                load(query, true);
              }}
              type="button"
            >
              表示
            </button>
            <button
              aria-pressed={!showActive}
              className={!showActive ? "active" : ""}
              onClick={() => {
                setShowActive(false);
                load(query, false);
              }}
              type="button"
            >
              非表示
            </button>
          </div>
        </div>
        <Link className="button primary" to="/patient/register">
          ＋ 新しい患者を登録
        </Link>
      </header>
      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          load(query);
        }}
      >
        <input
          aria-label="患者を検索"
          placeholder="氏名・所属で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="secondary">検索</button>
        {query && (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setQuery("");
              load("");
            }}
          >
            クリア
          </button>
        )}
      </form>
      <Message>{error}</Message>
      {loading ? (
        <p className="loading">読み込み中…</p>
      ) : patients.length === 0 ? (
        <div className="empty-state">
          {showActive ? "該当する患者はいません" : "非表示の患者はいません"}
        </div>
      ) : (
        <div className="patient-list">
          {patients.map((patient) => (
            <article className="patient-card" key={patient.id}>
              <div>
                <h2>{patient.name}</h2>
                <p>
                  <strong>所属：</strong>
                  {patient.affiliation || "未設定"}
                </p>
                <p className="memo">
                  <strong>備考：</strong>
                  {patient.memo || "なし"}
                </p>
              </div>
              <Link
                className="button secondary"
                to={`/patient/${patient.id}/edit`}
              >
                編集
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
