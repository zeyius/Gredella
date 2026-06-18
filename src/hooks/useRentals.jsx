import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const RentalsContext = createContext({ rentals: [], loading: true })

const QUERY = '*, item:items(name,photo_url,size,category), customer:customers(name,phone)'

export function RentalsProvider({ children }) {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('rentals')
      .select(QUERY)
      .then(({ data }) => {
        setRentals(data ?? [])
        setLoading(false)
      })

    const channel = supabase
      .channel('rentals-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rentals' }, () => {
        supabase
          .from('rentals')
          .select(QUERY)
          .then(({ data }) => setRentals(data ?? []))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <RentalsContext.Provider value={{ rentals, loading }}>
      {children}
    </RentalsContext.Provider>
  )
}

export function useRentals() {
  return useContext(RentalsContext)
}

// Returns rentals that block the calendar (active ones only)
export function activeRentals(rentals) {
  return rentals.filter(r => r.status === 'reserved' || r.status === 'picked_up')
}

// True if a rental overlaps [startDate, endDate) — both are 'YYYY-MM-DD' strings
export function overlaps(rental, startDate, endDate) {
  return rental.start_date < endDate && rental.end_date > startDate
}
