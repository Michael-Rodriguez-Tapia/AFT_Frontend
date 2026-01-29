import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Pending from "./pages/Pending";
import Usuarios from "./pages/Usuarios";

type PrivateProps = {
  children: JSX.Element;
};

function Private({ children }: PrivateProps) {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  // ============================================================
  // 🔑 GUARDAR TOKEN EN LOCALSTORAGE DESPUÉS DE LOGIN
  // ============================================================
  useEffect(() => {
    const saveToken = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          localStorage.setItem("access_token", token);
          console.log("✅ Token guardado en localStorage");
        } catch (error) {
          console.error("❌ Error obteniendo token:", error);
        }
      }
    };
    saveToken();
  }, [isAuthenticated, getAccessTokenSilently]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      
      <Route
        path="/dashboard"
        element={
          <Private>
            <Dashboard />
          </Private>
        }
      />
      
      <Route
        path="/usuarios"
        element={
          <Private>
            <Usuarios />
          </Private>
        }
      />
      
      <Route path="/pendiente" element={<Pending />} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}