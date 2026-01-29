import { useAuth0 } from "@auth0/auth0-react";
import { Loader2, Leaf } from "lucide-react";
import { useState } from "react";

export default function Login() {
  const { loginWithRedirect } = useAuth0();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await loginWithRedirect();
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div 
      className="h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div 
        className="box"
        style={{
          maxWidth: '420px',
          width: '90%',
          padding: '3rem 2.5rem',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          border: 'none',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Logo/Icono */}
        <div 
          style={{
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
            }}
          >
            <Leaf size={40} color="#ffffff" />
          </div>
        </div>

        {/* Título */}
        <h1 
          className="title is-3"
          style={{
            color: '#1a202c',
            marginBottom: '0.5rem',
            fontWeight: '700',
          }}
        >
          AFT Gestión
        </h1>
        
        <p 
          className="subtitle is-6"
          style={{
            color: '#64748b',
            marginBottom: '2.5rem',
          }}
        >
          Sistema de Gestión Agrícola
        </p>

        {/* Botón de Login */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="button is-large is-fullwidth"
          style={{
            background: loading 
              ? '#94a3b8' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            fontWeight: '600',
            borderRadius: '12px',
            border: 'none',
            height: '56px',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Loader2 className="animate-spin" size={20} />
              Iniciando sesión...
            </span>
          ) : (
            'Iniciar Sesión'
          )}
        </button>

        {/* Footer */}
        <p 
          style={{
            marginTop: '2rem',
            fontSize: '0.875rem',
            color: '#94a3b8',
          }}
        >
          Acceso seguro mediante Auth0
        </p>
      </div>

      {/* Decoración de fondo */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}