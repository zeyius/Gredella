import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const CustomersContext = createContext([])

export function CustomersProvider({ children }) {
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    supabase
      .from('customers')
      .select('*')
      .order('name')
      .then(({ data }) => setCustomers(data ?? []))

    const channel = supabase
      .channel('customers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        supabase
          .from('customers')
          .select('*')
          .order('name')
          .then(({ data }) => setCustomers(data ?? []))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <CustomersContext.Provider value={customers}>
      {children}
    </CustomersContext.Provider>
  )
}

export function useCustomers() {
  return useContext(CustomersContext)
}
