import { Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import InvoicePage from './pages/InvoicePage'
import LoginPage from './pages/LoginPage'
import OthersPage from './pages/OthersPage'
import PatientFormPage from './pages/PatientFormPage'
import PatientsPage from './pages/PatientsPage'
import { isLoggedIn } from './utils/auth'
import './App.css'

function ProtectedLayout({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  return (
    <div className="app-shell">
      <main className="page-container">{children}</main>
      <BottomNav />
    </div>
  )
}

function ProtectedRoute({ children }) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={isLoggedIn() ? <Navigate to="/invoice" replace /> : <LoginPage />} />
      <Route path="/invoice" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />
      <Route path="/patients" element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
      <Route path="/patient/register" element={<ProtectedRoute><PatientFormPage /></ProtectedRoute>} />
      <Route path="/patient/:id/edit" element={<ProtectedRoute><PatientFormPage /></ProtectedRoute>} />
      <Route path="/others" element={<ProtectedRoute><OthersPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={isLoggedIn() ? '/invoice' : '/login'} replace />} />
    </Routes>
  )
}

export default App
