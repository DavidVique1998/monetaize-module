'use client';

import { useState, useEffect } from 'react';
import { Settings, CheckCircle2, AlertCircle, CreditCard } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { PaymentMethodManager } from './PaymentMethodManager';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('wallet.autoRecharge');
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
        setError(data.error || t('errorLoading'));
      }
    } catch (err) {
      console.error('Error fetching auto-recharge settings:', err);
      setError(t('errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validar que si está habilitado, tenga método de pago
    if (enabled && !settings?.paymentMethodId) {
      setError(t('mustSavePaymentFirst'));
      return;
    }

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
          // Incluir paymentMethodId si existe en settings
          paymentMethodId: settings?.paymentMethodId || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        // Recargar configuración para obtener el paymentMethodId actualizado
        await fetchSettings();
      } else {
        setError(data.error || t('errorSaving'));
      }
    } catch (err) {
      console.error('Error saving auto-recharge settings:', err);
      setError(t('errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentMethodSaved = () => {
    // Recargar configuración cuando se guarda un método de pago
    fetchSettings();
  };

  const handlePaymentMethodRemoved = () => {
    // Si se elimina el método de pago y está habilitado, deshabilitar
    if (enabled) {
      setEnabled(false);
      setError(t('paymentMethodRemoved'));
    }
    fetchSettings();
  };

  if (loading) {
    return (
      <div className={`bg-card rounded-xl border border-gray-200 p-6 shadow-sm ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" className="text-foreground/70" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-xl border border-gray-200 p-4 shadow-sm ${className}`}>
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-2">
          <Settings className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">{t('title')}</h3>
          <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {/* Componente de gestión de métodos de pago integrado */}
      <div className="mb-4">
        <PaymentMethodManager
          onPaymentMethodSaved={handlePaymentMethodSaved}
          onPaymentMethodRemoved={handlePaymentMethodRemoved}
        />
      </div>

      {error && (
        <div className="mb-3 bg-destructive/10 border border-destructive/20 rounded-lg p-2 flex items-start">
          <AlertCircle className="w-4 h-4 text-destructive mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-3 bg-emerald-600/10 border border-emerald-600/20 rounded-lg p-2 flex items-start">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-400">{t('saved')}</p>
        </div>
      )}

      <div className="space-y-3">
        {/* Método de pago guardado */}
        {settings?.paymentMethodId && (
          <div className="bg-emerald-600/10 border border-emerald-600/20 rounded-lg p-3 flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-400 flex-1">
              {t('paymentMethodSaved')}
            </p>
          </div>
        )}

        {enabled && !settings?.paymentMethodId && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-600">
                {t('paymentMethodRequired')}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                {t('paymentMethodRequiredDesc')}
              </p>
            </div>
          </div>
        )}

        {/* Toggle habilitado */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex-1">
            <label className="text-md font-medium text-foreground">{t('enable')}</label>
            <p className="text-md text-gray-500 mt-0.5">
              {t('enableDescription')}
            </p>
            {enabled && settings?.paymentMethodId && (
              <p className="text-xs text-primary mt-1">
                {t('autoChargeInfo', { amount: `$${rechargeAmount}`, threshold: `$${threshold}` })}
              </p>
            )}
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => {
                if (e.target.checked && !settings?.paymentMethodId) {
                  setError(t('mustSavePaymentFirst'));
                  return;
                }
                setEnabled(e.target.checked);
              }}
              disabled={!settings?.paymentMethodId}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-input peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
          </label>
        </div>

        {/* Umbral y Monto en una fila */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-md font-medium text-foreground mb-1">
              {t('threshold')}
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 z-10 pointer-events-none text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
                disabled={!enabled}
                className="w-full !pl-6 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground disabled:bg-muted disabled:cursor-not-allowed"
                style={{ paddingLeft: '1.5rem' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-md font-medium text-foreground mb-1">
              {t('amount')}
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 z-10 pointer-events-none text-sm">$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(parseFloat(e.target.value) || 0)}
                disabled={!enabled}
                className="w-full !pl-6 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground disabled:bg-muted disabled:cursor-not-allowed"
                style={{ paddingLeft: '1.5rem' }}
              />
            </div>
          </div>
        </div>

        {/* Información adicional */}
        {settings?.lastRechargeAt && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-2">
            <p className="text-sm text-primary">
              {t('lastRecharge')}: {new Date(settings.lastRechargeAt).toLocaleDateString(document.documentElement.lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}

        {/* Botón guardar */}
        <button
          onClick={handleSave}
          disabled={saving || threshold <= 0 || rechargeAmount <= 0 || (enabled && !settings?.paymentMethodId)}
          className="inline-flex items-center justify-center w-full h-8 px-4 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm font-semibold gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Spinner size="sm" />
              {t('saving')}
            </>
          ) : (
            t('save')
          )}
        </button>
      </div>
    </div>
  );
}

