'use client';

import { useState, useEffect } from 'react';
import { Settings, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AutoRechargeSettingsProps {
  className?: string;
}

interface AutoRechargeData {
  id: string;
  enabled: boolean;
  threshold: number;
  rechargeAmount: number;
  paymentMethodId: string | null;
  lastRechargeAt: Date | null;
}

export function AutoRechargeSettings({ className }: AutoRechargeSettingsProps) {
  const [settings, setSettings] = useState<AutoRechargeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState(10);
  const [rechargeAmount, setRechargeAmount] = useState(50);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/wallet/auto-recharge');
      const data = await response.json();

      if (data.success) {
        const settingsData = data.data;
        setSettings(settingsData);
        setEnabled(settingsData.enabled);
        setThreshold(Number(settingsData.threshold));
        setRechargeAmount(Number(settingsData.rechargeAmount));
      } else {
        setError(data.error || 'Error al cargar configuración');
      }
    } catch (err) {
      console.error('Error fetching auto-recharge settings:', err);
      setError('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/wallet/auto-recharge', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled,
          threshold,
          rechargeAmount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Error al guardar configuración');
      }
    } catch (err) {
      console.error('Error saving auto-recharge settings:', err);
      setError('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
          <Settings className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recarga Automática</h3>
          <p className="text-sm text-gray-500">Configura recargas automáticas cuando el saldo sea bajo</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start">
          <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-600">Configuración guardada exitosamente</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Toggle habilitado */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-900">Habilitar recarga automática</label>
            <p className="text-xs text-gray-500 mt-1">
              Recarga automáticamente cuando el saldo llegue al umbral
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Umbral */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Umbral de recarga (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10 pointer-events-none">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
              disabled={!enabled}
              className="w-full !pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              style={{ paddingLeft: '2rem' }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Cuando el saldo llegue a este monto, se activará la recarga automática
          </p>
        </div>

        {/* Monto de recarga */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto de recarga (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10 pointer-events-none">$</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(parseFloat(e.target.value) || 0)}
              disabled={!enabled}
              className="w-full !pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              style={{ paddingLeft: '2rem' }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Monto que se recargará automáticamente cuando se active
          </p>
        </div>

        {/* Información adicional */}
        {settings?.lastRechargeAt && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              Última recarga automática: {new Date(settings.lastRechargeAt).toLocaleString('es-ES')}
            </p>
          </div>
        )}

        {/* Botón guardar */}
        <button
          onClick={handleSave}
          disabled={saving || threshold <= 0 || rechargeAmount <= 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar Configuración'
          )}
        </button>
      </div>
    </div>
  );
}

