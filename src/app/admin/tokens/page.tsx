'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useState, useEffect } from 'react';
import { Key, Copy, CheckCircle2, Loader2, AlertCircle, User, Building2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  ghlLocationId: string | null;
  ghlLocationName: string | null;
  role: string;
  createdAt: string;
}

export default function AdminTokensPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<{ token: string; user: User } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/tokens');
      const data = await response.json();

      if (data.success) {
        setUsers(data.data || []);
      } else {
        setError(data.error || 'Error al cargar usuarios');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async (userId: string) => {
    try {
      setGenerating(userId);
      setError(null);
      setSuccess(null);
      setGeneratedToken(null);

      const response = await fetch('/api/admin/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedToken(data.data);
        setSuccess(`Token generado exitosamente para ${data.data.user.email}`);
      } else {
        setError(data.error || 'Error al generar token');
      }
    } catch (err) {
      console.error('Error generating token:', err);
      setError('Error al generar token');
    } finally {
      setGenerating(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Generar Tokens JWT</h1>
              <p className="text-sm text-graybg-muted/500 mt-1">
                Genera tokens de autenticación para consumir créditos de wallet
              </p>
            </div>
          </div>
        </div>

        {/* Mensajes de éxito/error */}
        {error && (
          <div className="mb-4 bg-redbg-muted/50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-greenbg-muted/50 border border-green-200 rounded-lg p-4 flex items-start">
            <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Token generado */}
        {generatedToken && (
          <div className="mb-6 bg-bluebg-muted/50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Token generado para: {generatedToken.user.email}
                </h3>
                {generatedToken.user.ghlLocationId && (
                  <p className="text-xs text-blue-700">
                    Location ID: {generatedToken.user.ghlLocationId}
                  </p>
                )}
              </div>
              <button
                onClick={() => copyToClipboard(generatedToken.token)}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-primary bg-card border border-blue-200 rounded-lg hover:bg-bluebg-muted/50 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-card rounded border border-blue-200 p-3">
              <code className="text-xs text-gray-800 break-all">{generatedToken.token}</code>
            </div>
            <div className="mt-3 p-3 bg-card rounded border border-blue-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">Ejemplo de uso:</p>
              <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto">
{`POST /api/wallet/consume-token
Authorization: Bearer ${generatedToken.token.substring(0, 50)}...
Content-Type: application/json

{
  "amount": 1.50,
  "reason": "Consumo de créditos por llamada",
  "metricType": "minutes",
  "metricValue": 5
}`}
              </pre>
            </div>
          </div>
        )}

        {/* Lista de usuarios */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Usuarios</h2>
              <p className="text-sm text-graybg-muted/500 mt-1">
                Selecciona un usuario para generar un token JWT
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <div className="p-8 text-center">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-graybg-muted/500">No hay usuarios disponibles</p>
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 hover:bg-graybg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {user.name || user.email}
                              </p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                user.role === 'ADMIN' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {user.role}
                              </span>
                            </div>
                            <p className="text-xs text-graybg-muted/500 mt-1">{user.email}</p>
                            {user.ghlLocationId && (
                              <div className="flex items-center space-x-1 mt-1">
                                <Building2 className="w-3 h-3 text-gray-400" />
                                <p className="text-xs text-graybg-muted/500">
                                  {user.ghlLocationName || user.ghlLocationId}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => generateToken(user.id)}
                        disabled={generating === user.id}
                        className="ml-4 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 disabled:bg-gray-400 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        {generating === user.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generando...</span>
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4" />
                            <span>Generar Token</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

