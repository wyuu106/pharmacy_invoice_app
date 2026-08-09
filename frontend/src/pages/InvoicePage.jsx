import { useCallback, useEffect, useState } from 'react'
import Message from '../components/Message'
import { api } from '../utils/api'

const today = new Date()
const formatYen = (value) => `${Number(value).toLocaleString('ja-JP')}円`

export default function InvoicePage() {
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [invoice, setInvoice] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [query, setQuery] = useState('')
  const [showCandidates, setShowCandidates] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)

  const loadInvoice = useCallback(async () => {
    setLoading(true)
    setError('')
    setNotice('')
    try { setInvoice(await api(`/invoices/${year}/${month}`)) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [year, month])

  useEffect(() => {
    let active = true
    api(`/invoices/${year}/${month}`)
      .then((data) => { if (active) setInvoice(data) })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [year, month])

  async function searchCandidates(search = '') {
    try {
      const data = await api(`/patients${search ? `?query=${encodeURIComponent(search)}` : ''}`)
      const usedIds = new Set(invoice?.patients.map((item) => item.patient.id) || [])
      setCandidates(data.filter((patient) => !usedIds.has(patient.id)))
      setShowCandidates(true)
    } catch (err) { setError(err.message) }
  }

  async function addPatient(patientId) {
    try {
      const data = await api(`/invoices/${year}/${month}/patients`, { method: 'POST', body: JSON.stringify({ patient_id: patientId }) })
      setInvoice(data)
      setShowCandidates(false)
      setQuery('')
      setNotice('患者を追加しました')
    } catch (err) { setError(err.message) }
  }

  async function removePatient(item) {
    if (!window.confirm(`${item.patient.name}さんを今月の請求書から外しますか？`)) return
    try { await api(`/invoices/patients/${item.id}`, { method: 'DELETE' }); await loadInvoice() }
    catch (err) { setError(err.message) }
  }

  async function addAmount(itemId) {
    try { await api(`/invoices/patients/${itemId}/amounts`, { method: 'POST', body: JSON.stringify({ amount: 0 }) }); await loadInvoice() }
    catch (err) { setError(err.message) }
  }

  async function saveAmount(amountId, rawValue) {
    const amount = Number(rawValue)
    if (!Number.isInteger(amount) || amount < 0) { setError('金額は0以上の整数で入力してください'); return }
    try { await api(`/invoices/amounts/${amountId}`, { method: 'PUT', body: JSON.stringify({ amount }) }); await loadInvoice() }
    catch (err) { setError(err.message) }
  }

  async function removeAmount(amountId) {
    try { await api(`/invoices/amounts/${amountId}`, { method: 'DELETE' }); await loadInvoice() }
    catch (err) { setError(err.message) }
  }

  return (
    <>
      <header className="page-header"><h1>請求書作成</h1><p>患者ごとの金額を入力してください</p></header>
      <section className="period-card">
        <label>請求する年<select value={year} onChange={(e) => { setLoading(true); setYear(Number(e.target.value)) }}>{Array.from({ length: 7 }, (_, index) => today.getFullYear() - 3 + index).map((value) => <option key={value}>{value}</option>)}</select></label><span className="period-unit">年</span>
        <label>請求する月<select value={month} onChange={(e) => { setLoading(true); setMonth(Number(e.target.value)) }}>{Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option key={value}>{value}</option>)}</select></label><span className="period-unit">月分</span>
      </section>
      <Message>{error}</Message><Message type="success">{notice}</Message>
      <div className="invoice-toolbar"><h2>請求する患者 <span className="count-badge">{invoice?.patients.length || 0}人</span></h2><button className="primary" onClick={() => searchCandidates()}>＋ 患者を追加</button></div>
      {showCandidates && <section className="candidate-panel"><div className="row-between"><h2>追加する患者を選ぶ</h2><button className="text-button" onClick={() => setShowCandidates(false)}>閉じる</button></div><form className="search-bar" onSubmit={(e) => { e.preventDefault(); searchCandidates(query) }}><input autoFocus placeholder="氏名・所属で検索" value={query} onChange={(e) => setQuery(e.target.value)} /><button className="secondary">検索</button></form>{candidates.length === 0 ? <p>追加できる患者はいません</p> : <div className="candidate-list">{candidates.map((patient) => <button key={patient.id} onClick={() => addPatient(patient.id)}><strong>{patient.name}</strong><span>{patient.affiliation || '所属なし'}</span><span className="add-label">追加</span></button>)}</div>}</section>}
      {loading ? <p className="loading">請求書を読み込み中…</p> : invoice?.patients.length === 0 ? <div className="empty-state"><strong>請求する患者がまだいません</strong><p>「患者を追加」ボタンから追加してください</p></div> : <div className="invoice-list">{invoice.patients.map((item) => <article className="invoice-card" key={item.id}><div className="invoice-patient"><div><h2>{item.patient.name}</h2><p>{item.patient.affiliation || '所属なし'}</p></div><button className="text-danger" onClick={() => removePatient(item)}>この月から外す</button></div><div className="amount-list">{item.amounts.length === 0 && <p className="no-amount">金額が未入力です</p>}{item.amounts.map((amount, index) => <div className="amount-row" key={amount.id}><label>金額 {index + 1}<span className="amount-input"><input type="number" min="0" step="1" defaultValue={amount.amount} onBlur={(e) => saveAmount(amount.id, e.target.value)} /><span>円</span></span></label><button aria-label={`金額${index + 1}を削除`} className="icon-danger" onClick={() => removeAmount(amount.id)}>×</button></div>)}<button className="add-amount" onClick={() => addAmount(item.id)}>＋ 金額欄を追加</button></div><div className="subtotal"><span>{item.patient.name}さんの合計</span><strong>{formatYen(item.subtotal)}</strong></div></article>)}</div>}
      <section className="grand-total"><span>全患者の合計金額</span><strong>{formatYen(invoice?.total || 0)}</strong></section>
    </>
  )
}
