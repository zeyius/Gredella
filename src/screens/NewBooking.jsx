import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useItems } from '../hooks/useItems.jsx'
import { useRentals, activeRentals, overlaps } from '../hooks/useRentals.jsx'
import { useCustomers } from '../hooks/useCustomers.jsx'
import { S } from '../lib/strings'

// ── helpers ───────────────────────────────────────────────
function tomorrow(dateStr) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
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

// ── customer search (reads from live context) ─────────────
function CustomerPicker({ value, onChange }) {
  const allCustomers = useCustomers()
  const [query, setQuery] = useState(value?.existing?.name ?? value?.newName ?? '')
  const [phone, setPhone] = useState(value?.existing?.phone ?? value?.newPhone ?? '')
  const [open, setOpen] = useState(false)

  const results = query.trim()
    ? allCustomers.filter(c => c.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : []

  const exactMatch = allCustomers.find(c => c.name.toLowerCase() === query.trim().toLowerCase())

  function pick(customer) {
    setQuery(customer.name)
    setPhone(customer.phone ?? '')
    setOpen(false)
    onChange({ existing: customer })
  }

  function handleQueryChange(v) {
    setQuery(v)
    setPhone('')
    setOpen(true)
    onChange({ newName: v, newPhone: '' })
  }

  function handlePhoneChange(v) {
    setPhone(v)
    onChange({ newName: query, newPhone: v })
  }

  const isNew = query.trim() && !value?.existing
  const showDropdown = open && query.trim() && (results.length > 0 || !exactMatch)

  return (
    <div style={{ position: 'relative' }}>
      <label className="field">
        <span>{S.selectCustomer}</span>
        <input
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Nom du client…"
          autoComplete="off"
        />
      </label>

      {showDropdown && (
        <div className="customer-dropdown">
          {results.map(c => (
            <div key={c.id} className="customer-dropdown-item" onMouseDown={() => pick(c)}>
              <span className="customer-name">{c.name}</span>
              {c.phone && <span className="customer-phone">{c.phone}</span>}
            </div>
          ))}
          {!exactMatch && (
            <div
              className="customer-dropdown-item customer-dropdown-new"
              onMouseDown={() => { setOpen(false); onChange({ newName: query, newPhone: phone }) }}
            >
              + Nouveau : <strong>{query}</strong>
            </div>
          )}
        </div>
      )}

      {isNew && (
        <label className="field mt-1">
          <span>{S.customerPhone} <span className="form-hint">(optionnel)</span></span>
          <input
            type="tel"
            value={phone}
            onChange={e => handlePhoneChange(e.target.value)}
            placeholder="06…"
          />
        </label>
      )}
    </div>
  )
}

// ── main screen ───────────────────────────────────────────
export default function NewBooking() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const defaultStart = params.get('date') ?? todayStr()

  const allItems = useItems()
  const { rentals } = useRentals()
  const active = activeRentals(rentals)

  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(tomorrow(defaultStart))
  const [selectedItem, setSelectedItem] = useState(null)
  const [customer, setCustomer] = useState(null) // { existing } | { newName, newPhone }
  const [price, setPrice] = useState('')
  const [profit, setProfit] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Recompute available items whenever dates or rentals change
  const availableItems = useMemo(() => {
    if (!startDate || !endDate || endDate <= startDate) return allItems
    return allItems.filter(item =>
      !active.some(r => r.item_id === item.id && overlaps(r, startDate, endDate))
    )
  }, [allItems, active, startDate, endDate])

  const datesValid = startDate && endDate && endDate > startDate

  // Deselect item if it becomes unavailable after date change
  useEffect(() => {
    if (selectedItem && !availableItems.find(i => i.id === selectedItem.id)) {
      setSelectedItem(null)
      setPrice('')
      setProfit('')
    }
  }, [availableItems, selectedItem])

  function handleStartChange(v) {
    setStartDate(v)
    if (endDate <= v) setEndDate(tomorrow(v))
  }

  function handleSelectItem(item) {
    setSelectedItem(item)
    setPrice(item.base_price != null ? String(item.base_price) : '')
    setProfit('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!datesValid) { setError(S.endAfterStart); return }
    if (!selectedItem) { setError('Veuillez choisir un article.'); return }
    if (!customer || (!customer.existing && !customer.newName?.trim())) {
      setError('Veuillez indiquer un client.'); return
    }
    const priceVal = parseFloat(price)
    const profitVal = parseFloat(profit) || 0
    if (isNaN(priceVal) || priceVal < 0) { setError('Prix invalide.'); return }

    setSaving(true)
    try {
      // Resolve or create customer
      let customerId
      if (customer.existing) {
        customerId = customer.existing.id
      } else {
        const { data, error: cErr } = await supabase
          .from('customers')
          .insert({ name: customer.newName.trim(), phone: customer.newPhone?.trim() || null })
          .select('id')
          .single()
        if (cErr) throw new Error(S.error)
        customerId = data.id
      }

      // Insert rental
      const { error: rErr } = await supabase.from('rentals').insert({
        item_id: selectedItem.id,
        customer_id: customerId,
        start_date: startDate,
        end_date: endDate,
        price: priceVal,
        profit: profitVal,
        status: 'reserved',
        paid: false,
      })

      if (rErr) {
        // Postgres exclusion constraint violation
        if (rErr.code === '23P01' || rErr.message?.includes('overlap')) {
          setError(S.bookingConflict)
        } else {
          setError(S.bookingError)
        }
        setSaving(false)
        return
      }

      navigate('/')
    } catch {
      setError(S.bookingError)
      setSaving(false)
    }
  }

  const groups = groupByCategory(availableItems)

  return (
    <form className="screen" onSubmit={handleSubmit} noValidate>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <button type="button" className="back-btn" onClick={() => navigate(-1)}>{S.back}</button>
        <h1 className="screen-title" style={{ marginBottom: 0 }}>{S.newBooking}</h1>
      </div>

      {/* ── 1. Dates ── */}
      <section className="booking-section">
        <p className="booking-section-title">{S.selectDates}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
          <label className="field">
            <span>{S.startDate}</span>
            <input
              type="date"
              value={startDate}
              min={todayStr()}
              onChange={e => handleStartChange(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>{S.endDate}</span>
            <input
              type="date"
              value={endDate}
              min={startDate ? tomorrow(startDate) : todayStr()}
              onChange={e => setEndDate(e.target.value)}
              required
            />
          </label>
        </div>
        {datesValid && (
          <p className="form-hint mt-1">
            {dateDiff(startDate, endDate)} jour{dateDiff(startDate, endDate) > 1 ? 's' : ''}
            {' '}· du {fmtDate(startDate)} au {fmtDate(endDate)} (exclu)
          </p>
        )}
      </section>

      <div className="divider" />

      {/* ── 2. Item picker ── */}
      <section className="booking-section">
        <p className="booking-section-title">{S.selectItem}</p>

        {availableItems.length === 0 && datesValid && (
          <p className="text-muted">{S.noItemsAvailable}</p>
        )}

        {groups.map(([category, catItems]) => (
          <div key={category} style={{ marginBottom: '.75rem' }}>
            <p className="stock-category-label">{category}</p>
            {catItems.map(item => {
              const sel = selectedItem?.id === item.id
              return (
                <div
                  key={item.id}
                  className={`item-pick-row${sel ? ' selected' : ''}`}
                  onClick={() => handleSelectItem(item)}
                >
                  <div className="item-info">
                    <p className="item-name">{item.name}</p>
                    <p className="item-meta">
                      {item.size ? `${item.size} · ` : ''}{item.base_price} DA
                    </p>
                  </div>
                  <span className="item-pick-check">{sel ? '✓' : ''}</span>
                </div>
              )
            })}
          </div>
        ))}
      </section>

      <div className="divider" />

      {/* ── 3. Customer ── */}
      <section className="booking-section">
        <CustomerPicker value={customer} onChange={setCustomer} />
      </section>

      <div className="divider" />

      {/* ── 4. Price + profit ── */}
      <section className="booking-section">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
          <label className="field">
            <span>{S.price}</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0"
              required
            />
          </label>
          <label className="field">
            <span>{S.profit}</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={profit}
              onChange={e => setProfit(e.target.value)}
              placeholder="0"
            />
          </label>
        </div>
      </section>

      {error && <p className="form-error mt-2">{error}</p>}

      <button
        type="submit"
        className="btn btn-primary mt-2"
        disabled={saving || !datesValid || !selectedItem}
      >
        {saving ? 'Enregistrement…' : S.confirmBooking}
      </button>
    </form>
  )
}

function dateDiff(start, end) {
  return Math.round((new Date(end) - new Date(start)) / 86400000)
}

function fmtDate(str) {
  const [, m, d] = str.split('-')
  return `${parseInt(d)}/${parseInt(m)}`
}
