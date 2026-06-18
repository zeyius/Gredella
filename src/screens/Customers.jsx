import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers } from '../hooks/useCustomers.jsx'
import { useRentals } from '../hooks/useRentals.jsx'
import { supabase } from '../lib/supabase'
import { S } from '../lib/strings'
import StatusBadge from '../components/StatusBadge.jsx'

const EMPTY_FORM = { name: '', phone: '', notes: '' }

function fmtDate(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  return `${parseInt(d)}/${parseInt(m)}/${y}`
}

export default function Customers() {
  const customers = useCustomers()
  const { rentals } = useRentals()
  const navigate = useNavigate()

  const [sheet, setSheet] = useState(null) // null | customer-object
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : customers

  function openEdit(customer) {
    setForm({ name: customer.name ?? '', phone: customer.phone ?? '', notes: customer.notes ?? '' })
    setError('')
    setSheet(customer)
  }

  function closeSheet() { setSheet(null); setError('') }
  function field(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError(S.required); return }
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('customers')
      .update({ name: form.name.trim(), phone: form.phone.trim() || null, notes: form.notes.trim() || null })
      .eq('id', sheet.id)
    setSaving(false)
    if (err) { setError(S.error); return }
    closeSheet()
  }

  async function handleDelete() {
    const { error: err } = await supabase.from('customers').delete().eq('id', confirmDelete.id)
    if (err) { setError(S.error) }
    setConfirmDelete(null)
    closeSheet()
  }

  // Rentals for the open customer, newest first
  const customerRentals = sheet
    ? rentals
        .filter(r => r.customer_id === sheet.id)
        .sort((a, b) => b.start_date.localeCompare(a.start_date))
    : []

  return (
    <div className="screen">
      <h1 className="screen-title">{S.customers}</h1>

      <input
        className="search-input"
        placeholder="Rechercher…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: '1rem' }}
      />

      {customers.length === 0 && (
        <p className="text-muted" style={{ textAlign: 'center', marginTop: '2rem' }}>{S.noCustomers}</p>
      )}

      {filtered.length === 0 && customers.length > 0 && (
        <p className="text-muted">Aucun résultat pour « {search} ».</p>
      )}

      <div className="card" style={{ padding: '0 1rem' }}>
        {filtered.map(c => (
          <div key={c.id} className="customer-row" onClick={() => openEdit(c)} style={{ cursor: 'pointer' }}>
            <div className="flex-between">
              <span className="customer-name">{c.name}</span>
              <span className="item-chevron">›</span>
            </div>
            {c.phone && <p className="customer-phone">{c.phone}</p>}
          </div>
        ))}
      </div>

      {/* Edit sheet */}
      {sheet && (
        <div className="modal-overlay" onClick={closeSheet}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <p className="modal-title">{sheet.name}</p>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
              <label className="field">
                <span>{S.customerName}</span>
                <input value={form.name} onChange={e => field('name', e.target.value)} required />
              </label>
              <label className="field">
                <span>{S.phone} <span className="form-hint">(optionnel)</span></span>
                <input type="tel" value={form.phone} onChange={e => field('phone', e.target.value)} />
              </label>
              <label className="field">
                <span>{S.notes} <span className="form-hint">(optionnel)</span></span>
                <textarea rows={2} value={form.notes} onChange={e => field('notes', e.target.value)} />
              </label>

              {error && <p className="form-error">{error}</p>}

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? S.saving : S.save}
              </button>
              <button type="button" className="btn btn-danger btn-block" onClick={() => setConfirmDelete(sheet)}>
                {S.delete} ce client
              </button>
            </form>

            {/* Rental history */}
            {customerRentals.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <p className="booking-section-title">Historique réservations</p>
                {customerRentals.map(r => (
                  <div
                    key={r.id}
                    className="booking-row"
                    onClick={() => { closeSheet(); navigate(`/booking/${r.id}`) }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="booking-item-name">{r.item?.name ?? '—'}</p>
                      <p className="booking-customer">
                        {fmtDate(r.start_date)} → {fmtDate(r.end_date)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <p className="modal-title">Supprimer « {confirmDelete.name} » ?</p>
            <p className="text-muted" style={{ marginBottom: '1.25rem' }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>Supprimer</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>{S.close}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
