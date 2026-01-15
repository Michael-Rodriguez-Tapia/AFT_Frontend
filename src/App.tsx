import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Pending from "./pages/Pending";
import { useAuth0 } from "@auth0/auth0-react";

// ⛔ No usar `any` → mejora estabilidad
type PrivateProps = {
  children: JSX.Element;
};

function Private({ children }: PrivateProps) {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div>Cargando…</div>;
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Página pública */}
      <Route path="/" element={<Home />} />

      {/* Ruta protegida */}
      <Route
        path="/dashboard"
        element={
          <Private>
            <Dashboard />
          </Private>
        }
      />

      {/* Página si el usuario existe en Auth0 pero no en la BDD */}
      <Route path="/pendiente" element={<Pending />} />

      {/* Fallback opcional */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
