'use client';

import { useEffect, useState } from 'react';
import { Wallet, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('wallet.balanceCard');
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
        setError(data.error || t('errorLoading'));
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError(t('errorLoading'));
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
    ? `${isNegative ? '-' : ''}$${Math.abs(balance.balance).toFixed(3)}`
    : '$0.000';

  return (
    <div className={cn(
      "bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">{t('title')}</h3>
            <p className="text-xs text-gray-500">{t('availableBalance')}</p>
          </div>
        </div>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="p-1.5 hover:bg-muted/50 rounded-lg transition-colors"
          title={t('updateBalance')}
        >
          <RefreshCw className={cn(
            "w-4 h-4 text-primary",
            loading && "animate-spin"
          )} />
        </button>
      </div>

      {error ? (
        <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive mr-2" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      ) : (
        <>
          {/* Balance principal */}
          <div className="mb-4">
            <div className={cn(
              "text-3xl font-bold mb-2 transition-colors",
              isNegative ? "text-destructive" : "text-green-600"
            )}>
              {formattedBalance}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>{t('balanceUpdated')}</span>
            </div>
          </div>

          {/* Botón de recarga */}
          {onRechargeClick && (
            <button
              onClick={onRechargeClick}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {t('rechargeBalance')}
            </button>
          )}
        </>
      )}
    </div>
  );
}

