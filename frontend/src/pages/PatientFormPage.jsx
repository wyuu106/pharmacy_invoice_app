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

  useEffect(() => {
    if (!editing) return;
    api(`/patients/${id}`)
      .then((data) =>
        setForm({
          name: data.name,
          affiliation: data.affiliation || "",
          memo: data.memo || "",
        }),
      )
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
      const saved = await api(editing ? `/patients/${id}` : "/patients", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      navigate(editing ? "/patients" : `/patient/${saved.id}/edit`, {
        replace: true,
      });
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
            placeholder="例：○○薬局"
          />
        </label>
        <label>
          メモ
          <textarea
            value={form.memo}
            onChange={(e) => update("memo", e.target.value)}
            maxLength="2000"
            rows="5"
          />
        </label>
        <div className="form-actions">
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
