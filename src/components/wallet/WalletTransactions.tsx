'use client';

import { useState, useEffect } from 'react';
import { History, ArrowDownCircle, ArrowUpCircle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
        setError(data.error || 'Error al cargar transacciones');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Error al cargar transacciones');
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
        return <ArrowUpCircle className="w-5 h-5 text-red-600" />;
      default:
        return <History className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'RECHARGE':
        return 'Recarga';
      case 'CONSUMPTION':
        return 'Consumo';
      case 'REFUND':
        return 'Reembolso';
      case 'ADJUSTMENT':
        return 'Ajuste';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <History className="w-4 h-4 text-gray-600 mr-2" />
          <h3 className="text-base font-semibold text-gray-900">Historial de Transacciones</h3>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={cn(
            "w-3.5 h-3.5 text-gray-400",
            loading && "animate-spin"
          )} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {loading && !history ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      ) : history && history.transactions.length > 0 ? (
        <div className="space-y-2">
          {history.transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <p className="text-xs font-medium text-gray-900">
                      {getTransactionLabel(transaction.type)}
                    </p>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      transaction.status === 'COMPLETED'
                        ? "bg-green-100 text-green-700"
                        : transaction.status === 'PENDING'
                        ? "bg-yellow-100 text-yellow-700"
                        : transaction.status === 'FAILED'
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    )}>
                      {transaction.status}
                    </span>
                  </div>
                  {transaction.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{transaction.description}</p>
                  )}
                  {transaction.metricType && (
                    <p className="text-xs text-gray-500">
                      {transaction.metricType}: {transaction.metricValue}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className={cn(
                  "text-sm font-semibold",
                  transaction.type === 'RECHARGE' || transaction.type === 'REFUND'
                    ? "text-green-600"
                    : "text-red-600"
                )}>
                  {transaction.type === 'RECHARGE' || transaction.type === 'REFUND' ? '+' : '-'}
                  ${Math.abs(Number(transaction.amount)).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  ${Number(transaction.balanceAfter).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500">No hay transacciones aún</p>
        </div>
      )}
    </div>
  );
}

