import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRentals, activeRentals } from '../hooks/useRentals.jsx'
import { S } from '../lib/strings'
import StatusBadge from '../components/StatusBadge.jsx'

// ── Date helpers ──────────────────────────────────────────
function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

// ISO weekday offset so Monday = column 0
function firstWeekdayOffset(year, month) {
  const dow = new Date(year, month, 1).getDay() // 0=Sun
  return (dow + 6) % 7
}

// Rentals active on a given 'YYYY-MM-DD' date (end_date exclusive)
function rentalsOnDay(active, dateStr) {
  return active.filter(r => r.start_date <= dateStr && r.end_date > dateStr)
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatDayLabel(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${parseInt(d)} ${S.months[parseInt(m) - 1]} ${y}`
}

// ── Sub-components ────────────────────────────────────────
function DaySheet({ dateStr, dayRentals, onClose }) {
  const navigate = useNavigate()
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <p className="day-sheet-date">{formatDayLabel(dateStr)}</p>

        {dayRentals.length === 0
          ? <p className="text-muted">{S.noBookingsToday}</p>
          : dayRentals.map(r => (
            <div
              key={r.id}
              className="booking-row"
              onClick={() => { onClose(); navigate(`/booking/${r.id}`) }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="booking-item-name">{r.item?.name ?? '—'}</p>
                <p className="booking-customer">{r.customer?.name ?? '—'}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))
        }

        <button
          className="btn btn-primary mt-2"
          onClick={() => { onClose(); navigate(`/booking/new?date=${dateStr}`) }}
        >
          + {S.addBooking}
        </button>
      </div>
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────
export default function Calendar() {
  const { rentals, loading } = useRentals()
  const today = todayStr()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)

  const active = activeRentals(rentals)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const totalDays = daysInMonth(year, month)
  const offset = firstWeekdayOffset(year, month)

  const dayRentals = selectedDay ? rentalsOnDay(active, selectedDay) : []

  if (loading) {
    return <p className="splash">{S.loading}</p>
  }

  return (
    <div>
      {/* Month navigation */}
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
        <span className="cal-month-label">
          {S.months[month]} {year}
        </span>
        <button className="cal-nav-btn" onClick={nextMonth}>›</button>
      </div>

      {/* Grid */}
      <div className="cal-grid">
        {S.weekdays.map(d => (
          <div key={d} className="cal-weekday">{d}</div>
        ))}

        {/* Empty cells before the 1st */}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`e${i}`} className="cal-day empty" />
        ))}

        {/* Day cells */}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1
          const dateStr = toDateStr(year, month, day)
          const onDay = rentalsOnDay(active, dateStr)
          const isToday = dateStr === today

          return (
            <div
              key={day}
              className={`cal-day${isToday ? ' today' : ''}${onDay.length ? ' has-bookings' : ''}`}
              onClick={() => setSelectedDay(dateStr)}
            >
              <span className="cal-day-num">{day}</span>
              {onDay.length > 0 && (
                <div className="cal-dots">
                  {onDay.slice(0, 4).map(r => (
                    <span key={r.id} className={`cal-dot ${r.status}`} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Day sheet */}
      {selectedDay && (
        <DaySheet
          dateStr={selectedDay}
          dayRentals={dayRentals}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  )
}
