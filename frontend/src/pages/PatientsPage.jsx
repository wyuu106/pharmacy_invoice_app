import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Message from "../components/Message";
import { api } from "../utils/api";

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(search = "") {
    setLoading(true);
    setError("");
    try {
      setPatients(
        await api(
          `/patients${search ? `?query=${encodeURIComponent(search)}` : ""}`,
        ),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api("/patients")
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
        <div>
          <h1>患者一覧</h1>
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
        <div className="empty-state">該当する患者はいません</div>
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
