import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react'; 

export default function Home() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();

  // Lógica original: Si está autenticado, vamos al dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Spinner de carga visualmente consistente
  if (isLoading) {
    return (
      <div className="page-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-center">
      <div className="auth-card">
        
        {/* Logo y Títulos */}
        <div className="text-center mb-6">
          <div className="auth-logo">ATF</div>
          <h1 className="title text-2xl mb-2">Bienvenido</h1>
          <p className="subtitle text-sm">Sistema de Gestión de Cosechas</p>
        </div>

        {/* Botón con la redirección ORIGINAL que funcionaba */}
        <button 
          onClick={() => loginWithRedirect({
            authorizationParams: {
              // Volvemos a poner "/dashboard" explícitamente como en tu código original
              redirect_uri: window.location.origin + "/dashboard",
            },
          })}
          className="button is-primary-orange"
        >
          <LogIn size={20} /> 
          Iniciar Sesión
        </button>

        {/* Separador */}
        <div className="auth-divider">
          <span>Seguridad</span>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          Acceso protegido mediante <strong>Auth0</strong>
        </div>

      </div>
    </div>
  );
}