import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import { RentalsProvider } from './hooks/useRentals.jsx'
import { ItemsProvider } from './hooks/useItems.jsx'
import { CustomersProvider } from './hooks/useCustomers.jsx'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Login from './screens/Login'
import Calendar from './screens/Calendar'
import Stock from './screens/Stock'
import Customers from './screens/Customers'
import NewBooking from './screens/NewBooking'

function BookingDetail() { return <p style={{ padding: '1rem' }}>Détail — bientôt</p> }

function AppShell() {
  const { session } = useAuth()

  if (session === undefined) {
    return <div className="splash">Chargement…</div>
  }

  if (!session) {
    return <Login />
  }

  return (
    <RentalsProvider>
      <ItemsProvider>
        <CustomersProvider>
        <div className="app-layout">
          <Header />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Calendar />} />
              <Route path="/booking/new" element={<NewBooking />} />
              <Route path="/booking/:id" element={<BookingDetail />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
        </CustomersProvider>
      </ItemsProvider>
    </RentalsProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}
