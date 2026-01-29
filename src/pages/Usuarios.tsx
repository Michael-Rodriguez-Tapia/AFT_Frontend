// src/pages/Usuarios.tsx — FINAL CON API
import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';
import { Users, LogOut } from 'lucide-react';
import api from '../services/api';

interface User {
  id: number;
  auth0Id: string;
  email: string;
  name: string;
  role: 'campo' | 'gerencia' | 'admin' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export default function Usuarios() {
  const { getAccessTokenSilently, logout, user } = useAuth0();
  const { isAdmin, loading: roleLoading, userRole } = useUserRole();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  // Redirigir si no es admin
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      alert('⛔ No tienes permisos para acceder a esta página');
      navigate('/');
    }
  }, [isAdmin, roleLoading, navigate]);

  // Cargar usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;

      try {
        // ⬇️ Asegurar que el token esté en localStorage
        const token = await getAccessTokenSilently();
        localStorage.setItem("access_token", token);
        
        // ⬇️ Usar api (el interceptor agrega el token automáticamente)
        const response = await api.get('/users');
        
        // 🔧 FIX: Manejar diferentes formatos de respuesta
        let usersList: User[];
        
        if (Array.isArray(response.data)) {
          usersList = response.data;
        } else if (response.data.users && Array.isArray(response.data.users)) {
          usersList = response.data.users;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          usersList = response.data.data;
        } else {
          console.error('❌ Formato inesperado:', response.data);
          usersList = [];
        }
        
        console.log('👥 Usuarios cargados:', usersList);
        setUsers(usersList);
        
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message || 'Error al cargar usuarios');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, getAccessTokenSilently]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!window.confirm(`¿Cambiar rol a ${newRole}?`)) return;

    try {
      setUpdatingUserId(userId);
      
      // ⬇️ Asegurar token en localStorage
      const token = await getAccessTokenSilently();
      localStorage.setItem("access_token", token);
      
      // ⬇️ Usar api
      await api.patch(`/users/${userId}/role`, { role: newRole });

      // Actualizar estado local
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole as any } : u
      ));

      alert('✅ Rol actualizado exitosamente');
    } catch (err: any) {
      console.error('Error:', err);
      alert('❌ ' + (err.message || 'Error al actualizar rol'));
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`⚠️ ¿Eliminar a ${userName}?\n\nEsta acción no se puede deshacer.`)) return;

    try {
      // ⬇️ Asegurar token en localStorage
      const token = await getAccessTokenSilently();
      localStorage.setItem("access_token", token);
      
      // ⬇️ Usar api
      await api.delete(`/users/${userId}`);

      setUsers(users.filter(u => u.id !== userId));
      alert('✅ Usuario eliminado exitosamente');
    } catch (err: any) {
      console.error('Error:', err);
      alert('❌ ' + (err.message || 'Error al eliminar usuario'));
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'is-purple',
      gerencia: 'is-info',
      campo: 'is-success',
      pending: 'is-warning',
    };
    return colors[role] || 'is-light';
  };

  if (roleLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f7fa' }}>
        <div style={{ textAlign: 'center' }}>
          <progress className="progress is-primary" max="100" style={{ width: '200px' }}></progress>
          <p className="mt-4" style={{ color: '#64748b' }}>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <section style={{ backgroundColor: '#f5f7fa', minHeight: '100vh', padding: '2rem 0' }}>
      <div className="container">
        {/* HEADER GRIS SIMPLE */}
        <div
          className="box"
          style={{
            backgroundColor: '#64748b',
            border: 'none',
            marginBottom: '2rem',
            padding: '1.5rem 2rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h1 className="title is-3" style={{ color: '#ffffff', marginBottom: '0.5rem', fontWeight: 700 }}>
                🌱 AFT Gestión Agrícola
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {user?.email} • <span className="tag is-light is-small">{userRole}</span>
              </p>
            </div>
            <button
              className="button"
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <span className="icon">
                <LogOut size={18} />
              </span>
              <span>Cerrar sesión</span>
            </button>
          </div>

          {/* NAVEGACIÓN */}
          <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1rem' }}>
            <Link
              to="/dashboard"
              style={{
                color: '#ffffff',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            >
              Dashboard
            </Link>

            <Link
              to="/usuarios"
              style={{
                color: '#ffffff',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(139, 92, 246, 0.3)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Users size={16} /> Usuarios
            </Link>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="box" style={{ backgroundColor: '#ffffff' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 className="title is-4" style={{ color: '#1e293b', marginBottom: '0.5rem' }}>
              Gestión de Usuarios
            </h2>
            <p style={{ color: '#64748b' }}>
              Administra los roles y permisos de los usuarios del sistema
            </p>
          </div>

          {error && (
            <div className="notification is-danger is-light">
              {error}
            </div>
          )}

          {/* Tabla de usuarios */}
          <div className="table-container">
            <table className="table is-fullwidth is-hoverable" style={{ backgroundColor: '#ffffff' }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={{ color: '#1e293b' }}>Usuario</th>
                  <th style={{ color: '#1e293b' }}>Email</th>
                  <th style={{ color: '#1e293b' }}>Rol Actual</th>
                  <th style={{ color: '#1e293b' }}>Cambiar Rol</th>
                  <th style={{ color: '#1e293b' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ color: '#1e293b', fontWeight: 600 }}>{u.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.85rem' }}>ID: {u.id}</div>
                    </td>
                    <td style={{ color: '#1e293b' }}>{u.email}</td>
                    <td>
                      <span className={`tag ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div className="select">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={updatingUserId === u.id}
                          style={{ 
                            backgroundColor: '#ffffff', 
                            color: '#1e293b',
                            cursor: updatingUserId === u.id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="campo">Campo</option>
                          <option value="gerencia">Gerencia</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="button is-small is-danger is-light"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="notification is-light" style={{ textAlign: 'center' }}>
                <p style={{ color: '#64748b' }}>No hay usuarios registrados</p>
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="columns is-multiline mt-4">
          <div className="column is-3">
            <div className="box" style={{ backgroundColor: '#ffffff', textAlign: 'center' }}>
              <p className="heading" style={{ color: '#64748b' }}>Total Usuarios</p>
              <p className="title" style={{ color: '#1e293b' }}>{users.length}</p>
            </div>
          </div>
          <div className="column is-3">
            <div className="box" style={{ backgroundColor: '#ffffff', textAlign: 'center' }}>
              <p className="heading" style={{ color: '#64748b' }}>Admins</p>
              <p className="title" style={{ color: '#9333ea' }}>
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
          <div className="column is-3">
            <div className="box" style={{ backgroundColor: '#ffffff', textAlign: 'center' }}>
              <p className="heading" style={{ color: '#64748b' }}>Gerencia</p>
              <p className="title" style={{ color: '#3b82f6' }}>
                {users.filter(u => u.role === 'gerencia').length}
              </p>
            </div>
          </div>
          <div className="column is-3">
            <div className="box" style={{ backgroundColor: '#ffffff', textAlign: 'center' }}>
              <p className="heading" style={{ color: '#64748b' }}>Pendientes</p>
              <p className="title" style={{ color: '#eab308' }}>
                {users.filter(u => u.role === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}