'use client';

import { useEffect, useState } from 'react';
import { Wallet, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletBalanceProps {
  className?: string;
  isCollapsed?: boolean;
  onRechargeClick?: () => void;
}

interface BalanceData {
  walletId: string;
  balance: number;
  currency: string;
  userId: string;
}

export function WalletBalance({ className, isCollapsed = false, onRechargeClick }: WalletBalanceProps) {
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

  if (isCollapsed) {
    return (
      <div className={cn(
        "bg-white rounded-lg border border-gray-200 p-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer",
        className
      )}
      onClick={onRechargeClick}
      >
        <div className="flex items-center justify-center">
          {loading ? (
            <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <Wallet className={cn(
              "w-5 h-5 transition-colors",
              balance && balance.balance < 0 ? "text-red-600" : "text-green-600"
            )} />
          )}
        </div>
      </div>
    );
  }

  const isNegative = balance ? balance.balance < 0 : false;
  const formattedBalance = balance
    ? `${isNegative ? '-' : ''}$${Math.abs(balance.balance).toFixed(2)}`
    : '$0.00';

  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Wallet className="w-5 h-5 text-blue-500 mr-2" />
          <span className="text-sm font-medium text-gray-700">Balance</span>
        </div>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <RefreshCw className={cn(
            "w-4 h-4 text-gray-400",
            loading && "animate-spin"
          )} />
        </button>
      </div>

      {error ? (
        <div className="flex items-center text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      ) : (
        <>
          <div className={cn(
            "text-2xl font-bold mb-3 transition-colors",
            isNegative ? "text-red-600" : "text-green-600"
          )}>
            {formattedBalance}
          </div>
          {onRechargeClick && (
            <button
              onClick={onRechargeClick}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
            >
              Recargar Saldo
            </button>
          )}
        </>
      )}
    </div>
  );
}

