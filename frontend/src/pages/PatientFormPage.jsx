import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Message from "../components/Message";
import { api } from "../utils/api";

const emptyForm = { name: "", affiliation: "", memo: "" };

export default function PatientFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!editing) return;
    api(`/patients/${id}`)
      .then((data) => {
        setForm({
          name: data.name,
          affiliation: data.affiliation || "",
          memo: data.memo || "",
        });
        setIsActive(data.is_active);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [editing, id]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("氏名を入力してください");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api(editing ? `/patients/${id}` : "/patients", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      navigate("/patients", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility() {
    if (isActive && !window.confirm("本当に非表示にしますか？")) return;

    setSaving(true);
    setError("");
    try {
      await api(`/patients/${id}/visibility`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !isActive }),
      });
      navigate("/patients", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="loading">読み込み中…</p>;
  return (
    <>
      <header className="page-header">
        <h1>
          {editing ? "患者情報の編集" : "新しい患者を登録"}
        </h1>
        <p>
          <span className="required-mark">必須</span>{" "}
          の項目は必ず入力してください
        </p>
      </header>
      <Message>{error}</Message>
      <form className="form-card" onSubmit={submit}>
        <label>
          氏名 <span className="required-mark">必須</span>
          <input
            autoFocus
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            maxLength="100"
            required
          />
        </label>
        <label>
          所属
          <input
            value={form.affiliation}
            onChange={(e) => update("affiliation", e.target.value)}
            maxLength="200"
          />
        </label>
        <label>
          備考
          <textarea
            value={form.memo}
            onChange={(e) => update("memo", e.target.value)}
            maxLength="2000"
            rows="5"
          />
        </label>
        <div className="form-actions">
          {editing && (
            <button
              className={isActive ? "danger" : "primary"}
              disabled={saving}
              onClick={toggleVisibility}
              type="button"
            >
              {isActive ? "非表示にする" : "表示に戻す"}
            </button>
          )}
          <Link className="button secondary" to="/patients">
            戻る
          </Link>
          <button className="primary" disabled={saving}>
            {saving
              ? "保存しています…"
              : editing
                ? "変更を保存"
                : "登録する"}
          </button>
        </div>
      </form>
    </>
  );
}
