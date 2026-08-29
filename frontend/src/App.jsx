import { Navigate, Route, Routes } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import InvoicePage from "./pages/InvoicePage";
import OthersPage from "./pages/OthersPage";
import PatientFormPage from "./pages/PatientFormPage";
import PatientsPage from "./pages/PatientsPage";
import PrintPage from "./pages/PrintPage";
import "./App.css";

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <main className="page-container">{children}</main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route
        path="/invoice"
        element={
          <AppLayout>
            <InvoicePage />
          </AppLayout>
        }
      />
      <Route path="/print" element={<PrintPage />} />
      <Route
        path="/patients"
        element={
          <AppLayout>
            <PatientsPage />
          </AppLayout>
        }
      />
      <Route
        path="/patient/register"
        element={
          <AppLayout>
            <PatientFormPage />
          </AppLayout>
        }
      />
      <Route
        path="/patient/:id/edit"
        element={
          <AppLayout>
            <PatientFormPage />
          </AppLayout>
        }
      />
      <Route
        path="/others"
        element={
          <AppLayout>
            <OthersPage />
          </AppLayout>
        }
      />
      <Route path="*" element={<Navigate to="/invoice" replace />} />
    </Routes>
  );
}

export default App;
