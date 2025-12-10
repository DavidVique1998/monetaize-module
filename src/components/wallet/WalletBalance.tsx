'use client';

import { useEffect, useState } from 'react';
import { Wallet, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

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

  if (isCollapsed) {
    return (
      <div className={cn(
        "bg-card rounded-lg border border-border p-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer",
        className
      )}
      onClick={onRechargeClick}
      >
        <div className="flex items-center justify-center">
          {loading ? (
            <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
          ) : (
            <Wallet className={cn(
              "w-5 h-5 transition-colors",
              balance && balance.balance < 0 ? "text-destructive" : "text-green-600"
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
      "bg-card rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Wallet className="w-4 h-4 text-primary mr-2" />
          <span className="text-md font-medium text-foreground">{t('title')}</span>
        </div>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <RefreshCw className={cn(
            "w-3 h-3 text-muted-foreground",
            loading && "animate-spin"
          )} />
        </button>
      </div>

      {error ? (
        <div className="flex items-center text-destructive text-xs">
          <AlertCircle className="w-3 h-3 mr-1" />
          {error}
        </div>
      ) : (
        <>
          <div className={cn(
            "text-2xl font-bold mb-3 transition-colors",
            isNegative ? "text-destructive" : "text-green-600"
          )}>
            {formattedBalance}
          </div>
          {onRechargeClick && (
            <button
              onClick={onRechargeClick}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed mt-auto"
            >
              {t('rechargeBalance')}
            </button>
          )}
        </>
      )}
    </div>
  );
}
