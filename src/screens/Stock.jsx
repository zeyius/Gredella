import { useState } from 'react'
import { useItems } from '../hooks/useItems.jsx'
import { supabase } from '../lib/supabase'
import { S } from '../lib/strings'

const EMPTY_FORM = { name: '', category: '', size: '', base_price: '', photo_url: '' }

function formatPrice(p) {
  return `${p} DA`
}

function groupByCategory(items) {
  const map = {}
  for (const item of items) {
    const cat = item.category || 'Autre'
    if (!map[cat]) map[cat] = []
    map[cat].push(item)
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
}

export default function Stock() {
  const items = useItems()
  const [sheet, setSheet] = useState(null) // null | 'new' | item-object
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  function openNew() {
    setForm(EMPTY_FORM)
    setError('')
    setSheet('new')
  }

  function openEdit(item) {
    setForm({
      name: item.name ?? '',
      category: item.category ?? '',
      size: item.size ?? '',
      base_price: item.base_price != null ? String(item.base_price) : '',
      photo_url: item.photo_url ?? '',
    })
    setError('')
    setSheet(item)
  }

  function closeSheet() {
    setSheet(null)
    setError('')
  }

  function field(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError(S.required); return }
    if (!form.category.trim()) { setError(S.required); return }
    const price = parseFloat(form.base_price)
    if (isNaN(price) || price < 0) { setError('Prix invalide.'); return }

    setSaving(true)
    setError('')

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      size: form.size.trim() || null,
      base_price: price,
      photo_url: form.photo_url.trim() || null,
    }

    let err
    if (sheet === 'new') {
      ;({ error: err } = await supabase.from('items').insert(payload))
    } else {
      ;({ error: err } = await supabase.from('items').update(payload).eq('id', sheet.id))
    }

    setSaving(false)
    if (err) { setError(S.error); return }
    closeSheet()
  }

  async function handleDelete() {
    if (!confirmDelete) return
    const { error: err } = await supabase.from('items').delete().eq('id', confirmDelete.id)
    if (err) { setError(S.error) }
    setConfirmDelete(null)
    closeSheet()
  }

  const groups = groupByCategory(items)

  return (
    <div className="screen">
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h1 className="screen-title" style={{ marginBottom: 0 }}>{S.stock}</h1>
        <button className="btn btn-secondary" onClick={openNew}>+ {S.addItem}</button>
      </div>

      {items.length === 0 && (
        <p className="text-muted" style={{ marginTop: '2rem', textAlign: 'center' }}>{S.noItems}</p>
      )}

      {groups.map(([category, catItems]) => (
        <div key={category} style={{ marginBottom: '1.25rem' }}>
          <p className="stock-category-label">{category}</p>
          <div className="card" style={{ padding: '0 1rem' }}>
            {catItems.map(item => (
              <div key={item.id} className="item-row" onClick={() => openEdit(item)}>
                {item.photo_url
                  ? <img src={item.photo_url} alt="" className="item-thumb" />
                  : <div className="item-thumb item-thumb-placeholder" />
                }
                <div className="item-info">
                  <p className="item-name">{item.name}</p>
                  <p className="item-meta">
                    {item.size ? `${item.size} · ` : ''}{formatPrice(item.base_price)}
                  </p>
                </div>
                <span className="item-chevron">›</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {sheet !== null && (
        <div className="modal-overlay" onClick={closeSheet}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <p className="modal-title">{sheet === 'new' ? S.addItem : S.editItem}</p>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
              <label className="field">
                <span>{S.itemName}</span>
                <input value={form.name} onChange={e => field('name', e.target.value)} required />
              </label>
              <label className="field">
                <span>{S.itemCategory}</span>
                <input value={form.category} onChange={e => field('category', e.target.value)} required />
              </label>
              <label className="field">
                <span>{S.itemSize} <span className="form-hint">(optionnel)</span></span>
                <input value={form.size} onChange={e => field('size', e.target.value)} />
              </label>
              <label className="field">
                <span>{S.itemBasePrice}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.base_price}
                  onChange={e => field('base_price', e.target.value)}
                  required
                />
              </label>
              <label className="field">
                <span>{S.itemPhotoUrl} <span className="form-hint">(optionnel)</span></span>
                <input
                  type="url"
                  value={form.photo_url ?? ''}
                  onChange={e => field('photo_url', e.target.value)}
                  placeholder="https://…"
                />
              </label>

              {error && <p className="form-error">{error}</p>}

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? S.saving : S.save}
              </button>

              {sheet !== 'new' && (
                <button
                  type="button"
                  className="btn btn-danger btn-block"
                  onClick={() => setConfirmDelete(sheet)}
                >
                  {S.delete} cet article
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <p className="modal-title">Supprimer « {confirmDelete.name} » ?</p>
            <p className="text-muted" style={{ marginBottom: '1.25rem' }}>
              Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
                Supprimer
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>
                {S.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
