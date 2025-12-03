'use client';

import { useState } from 'react';
import { X, CreditCard, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PREDEFINED_AMOUNTS = [10, 25, 50, 100, 250, 500];

export function RechargeModal({ isOpen, onClose, onSuccess }: RechargeModalProps) {
  const t = useTranslations('wallet.rechargeModal');
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const handleAmountSelect = (value: number) => {
    setAmount(value);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
    }
    setError(null);
  };

  const handleRecharge = async () => {
    if (amount <= 0) {
      setError(t('error'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/wallet/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'USD',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentUrl(data.data.url);
        // Abrir el link de pago en una nueva ventana
        window.open(data.data.url, '_blank');
        if (onSuccess) {
          onSuccess();
        }
        // Cerrar el modal después de un breve delay
        setTimeout(() => {
          onClose();
          setPaymentUrl(null);
          setAmount(50);
          setCustomAmount('');
        }, 2000);
      } else {
        setError(data.error || t('errorCreating'));
      }
    } catch (err) {
      console.error('Error creating payment link:', err);
      setError(t('errorCreating'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount(50);
      setCustomAmount('');
      setError(null);
      setPaymentUrl(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Sidebar Modal */}
      <div 
        className={cn(
          "absolute right-0 top-0 h-full w-[500px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('title')}</h2>
              <p className="text-xs text-gray-500">{t('subtitle')}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Montos predefinidos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('selectAmount')}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PREDEFINED_AMOUNTS.map((value) => (
                <button
                  key={value}
                  onClick={() => handleAmountSelect(value)}
                  disabled={loading}
                  className={cn(
                    "px-4 py-3 rounded-lg border-2 transition-all",
                    amount === value && customAmount === ''
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  )}
                >
                  ${value}
                </button>
              ))}
            </div>
          </div>

          {/* Monto personalizado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('customAmount')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10 pointer-events-none">$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                disabled={loading}
                placeholder="0.00"
                className="w-full !pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ paddingLeft: '2rem' }}
              />
            </div>
          </div>

          {/* Monto total */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{t('amountToRecharge')}</span>
              <span className="text-xl font-bold text-gray-900">
                ${amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success message */}
          {paymentUrl && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-600 mb-2">
                {t('paymentLinkGenerated')}
              </p>
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-700 hover:underline flex items-center"
              >
                {t('openPaymentLink')} <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-semibold px-4 py-2 rounded-lg border-2 border-gray-300 transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleRecharge}
              disabled={loading || amount <= 0}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('processing')}
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t('continue')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

