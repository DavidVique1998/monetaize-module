'use client';

import { useEffect, useState } from 'react';
import { Wallet, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletBalanceCardProps {
  className?: string;
  onRechargeClick?: () => void;
}

interface BalanceData {
  walletId: string;
  balance: number;
  currency: string;
  userId: string;
}

export function WalletBalanceCard({ className, onRechargeClick }: WalletBalanceCardProps) {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/wallet/balance');
      const data = await response.json();

      if (data.success) {
        setBalance(data.data);
      } else {
        setError(data.error || 'Error al cargar balance');
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Error al cargar balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  const isNegative = balance ? balance.balance < 0 : false;
  const formattedBalance = balance
    ? `${isNegative ? '-' : ''}$${Math.abs(balance.balance).toFixed(2)}`
    : '$0.00';

  return (
    <div className={cn(
      "bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Balance de Wallet</h3>
            <p className="text-xs text-gray-500">Saldo disponible</p>
          </div>
        </div>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
          title="Actualizar balance"
        >
          <RefreshCw className={cn(
            "w-4 h-4 text-blue-600",
            loading && "animate-spin"
          )} />
        </button>
      </div>

      {error ? (
        <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      ) : (
        <>
          {/* Balance principal */}
          <div className="mb-4">
            <div className={cn(
              "text-3xl font-bold mb-2 transition-colors",
              isNegative ? "text-red-600" : "text-green-600"
            )}>
              {formattedBalance}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Saldo actualizado</span>
            </div>
          </div>

          {/* Botón de recarga */}
          {onRechargeClick && (
            <button
              onClick={onRechargeClick}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              Recargar Saldo
            </button>
          )}
        </>
      )}
    </div>
  );
}

