// src/hooks/useUserRole.ts — FINAL CON API
import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
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

export const useUserRole = () => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [userRole, setUserRole] = useState<'campo' | 'gerencia' | 'admin' | 'pending' | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isAuthenticated || !user?.email) {
        setLoading(false);
        return;
      }

      try {
        // ⬇️ Asegurar que el token esté en localStorage
        const token = await getAccessTokenSilently();
        localStorage.setItem("access_token", token);
        
        // ⬇️ Usar api (el interceptor agrega el token automáticamente)
        const response = await api.get('/users');
        
        // 🔧 Manejar diferentes formatos de respuesta del backend
        let users: User[];
        
        if (Array.isArray(response.data)) {
          users = response.data;
        } else if (response.data.users && Array.isArray(response.data.users)) {
          users = response.data.users;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          users = response.data.data;
        } else {
          console.error('❌ Formato de respuesta inesperado:', response.data);
          throw new Error('Formato de respuesta inválido del servidor');
        }
        
        console.log('📋 Usuarios obtenidos:', users.length);
        
        // Buscar mi usuario en la lista por email
        const myUser = users.find(u => u.email === user.email);
        
        if (myUser) {
          console.log('✅ Usuario encontrado:', {
            email: myUser.email,
            role: myUser.role,
            name: myUser.name
          });
          setUserData(myUser);
          setUserRole(myUser.role);
        } else {
          console.warn('⚠️ Usuario no encontrado en la lista. Email buscado:', user.email);
          console.warn('Emails disponibles:', users.map(u => u.email));
          setUserRole('pending');
        }
      } catch (err: any) {
        console.error('❌ Error al obtener rol del usuario:', err);
        setError(err.message || 'Error al cargar rol');
        setUserRole('pending');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  return {
    userRole,
    userData,
    loading,
    error,
    isAdmin: userRole === 'admin',
    isGerencia: userRole === 'gerencia',
    isCampo: userRole === 'campo',
    isPending: userRole === 'pending',
  };
};