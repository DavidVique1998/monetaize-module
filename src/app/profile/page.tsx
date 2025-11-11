'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { HeaderBar } from '@/components/dashboard/HeaderBar';
import { Save, Loader2, AlertCircle, CheckCircle, LogOut } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'LOCATION';
  ghlLocationId: string | null;
  ghlCompanyId: string | null;
  ghlLocationName: string | null;
  ghlLocationAddress: string | null;
  ghlLocationCity: string | null;
  ghlLocationState: string | null;
  ghlLocationPhone: string | null;
  ghlLocationEmail: string | null;
  ghlLocationWebsite: string | null;
  ghlLocationTimezone: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const result = await response.json();
        
        if (result.success && result.user) {
          setUser(result.user);
          setFormData({
            name: result.user.name || '',
            email: result.user.email || '',
          });
        } else {
          router.push('/install_ghl');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/install_ghl');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Perfil actualizado exitosamente'
        });
        setUser(result.user);
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Error al actualizar el perfil'
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({
        type: 'error',
        text: 'Error al actualizar el perfil'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/install_ghl');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-gray-50">
        <HeaderBar title="Mi Perfil" />
        
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            {/* Mensajes */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
                  message.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <p
                  className={`text-sm flex-1 ${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            )}

            {/* Información de GoHighLevel */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Información de GoHighLevel
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Location ID</label>
                  <p className="text-sm text-gray-900 mt-1">{user.ghlLocationId || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Company ID</label>
                  <p className="text-sm text-gray-900 mt-1">{user.ghlCompanyId || 'N/A'}</p>
                </div>
                {user.ghlLocationName && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre de Location</label>
                    <p className="text-sm text-gray-900 mt-1">{user.ghlLocationName}</p>
                  </div>
                )}
                {user.ghlLocationAddress && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dirección</label>
                    <p className="text-sm text-gray-900 mt-1">{user.ghlLocationAddress}</p>
                  </div>
                )}
                {user.ghlLocationCity && user.ghlLocationState && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ciudad, Estado</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {user.ghlLocationCity}, {user.ghlLocationState}
                    </p>
                  </div>
                )}
                {user.ghlLocationPhone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Teléfono</label>
                    <p className="text-sm text-gray-900 mt-1">{user.ghlLocationPhone}</p>
                  </div>
                )}
                {user.ghlLocationEmail && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900 mt-1">{user.ghlLocationEmail}</p>
                  </div>
                )}
                {user.ghlLocationWebsite && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sitio Web</label>
                    <p className="text-sm text-gray-900 mt-1">{user.ghlLocationWebsite}</p>
                  </div>
                )}
                {user.ghlLocationTimezone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Zona Horaria</label>
                    <p className="text-sm text-gray-900 mt-1">{user.ghlLocationTimezone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Formulario de edición */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Información Personal
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

