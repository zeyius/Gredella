import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ItemsContext = createContext([])

export function ItemsProvider({ children }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    supabase.from('items').select('*').order('name').then(({ data }) => setItems(data ?? []))

    const channel = supabase
      .channel('items-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        supabase.from('items').select('*').order('name').then(({ data }) => setItems(data ?? []))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <ItemsContext.Provider value={items}>
      {children}
    </ItemsContext.Provider>
  )
}

export function useItems() {
  return useContext(ItemsContext)
}
