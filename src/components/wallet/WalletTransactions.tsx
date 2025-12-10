'use client';

import { useState, useEffect } from 'react';
import { History, ArrowDownCircle, ArrowUpCircle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface WalletTransactionsProps {
  className?: string;
  limit?: number;
}

interface Transaction {
  id: string;
  type: 'RECHARGE' | 'CONSUMPTION' | 'REFUND' | 'ADJUSTMENT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  metricType: string | null;
  metricValue: number | null;
  description: string | null;
  createdAt: string;
  paymentLink?: {
    stripeLinkId: string;
    amount: number;
  };
}

interface TransactionHistory {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export function WalletTransactions({ className, limit = 20 }: WalletTransactionsProps) {
  const t = useTranslations('wallet.transactions');
  const [history, setHistory] = useState<TransactionHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/wallet/transactions?limit=${limit}&offset=0`);
      const data = await response.json();

      if (data.success) {
        setHistory(data.data);
      } else {
        setError(data.error || t('errorLoading'));
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(t('errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [limit]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'RECHARGE':
        return <ArrowDownCircle className="w-5 h-5 text-green-600" />;
      case 'CONSUMPTION':
        return <ArrowUpCircle className="w-5 h-5 text-destructive" />;
      default:
        return <History className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'RECHARGE':
        return t('types.recharge');
      case 'CONSUMPTION':
        return t('types.consumption');
      case 'REFUND':
        return t('types.refund');
      case 'ADJUSTMENT':
        return t('types.adjustment');
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = document.documentElement.lang || 'en';
    return date.toLocaleString(locale === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn("bg-card rounded-lg border border-border p-4 flex flex-col", className)}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-2">
            <History className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">{t('title')}</h3>
            <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
          title={t('update')}
        >
          <RefreshCw className={cn(
            "w-4 h-4 text-muted-foreground",
            loading && "animate-spin"
          )} />
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2 mb-3 flex-shrink-0">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      <div 
        className="flex-1 overflow-y-auto min-h-0 pr-1" 
        style={{ maxHeight: 'calc(100vh - 250px)' }}
      >
        {loading && !history ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          </div>
        ) : history && history.transactions.length > 0 ? (
          <div className="space-y-2">
            {history.transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-start justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-0.5">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium text-foreground">
                        {getTransactionLabel(transaction.type)}
                      </p>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full font-medium",
                        transaction.status === 'COMPLETED'
                          ? "bg-green-500/10 text-green-600"
                          : transaction.status === 'PENDING'
                          ? "bg-yellow-500/10 text-yellow-600"
                          : transaction.status === 'FAILED'
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {t(`status.${transaction.status.toLowerCase()}`)}
                      </span>
                    </div>
                    {transaction.description && (
                      <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{transaction.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className={cn(
                    "text-sm font-semibold",
                    transaction.type === 'RECHARGE' || transaction.type === 'REFUND'
                      ? "text-green-600"
                      : "text-destructive"
                  )}>
                    {transaction.type === 'RECHARGE' || transaction.type === 'REFUND' ? '+' : '-'}
                    ${Math.abs(Number(transaction.amount)).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ${Number(transaction.balanceAfter).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t('noTransactions')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
