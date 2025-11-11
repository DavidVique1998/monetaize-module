'use client';

import { useState, useEffect, useCallback } from 'react';

interface WalletBalance {
  walletId: string;
  balance: number;
  currency: string;
  userId: string;
}

interface ConsumeCreditsParams {
  amount: number;
  metricType?: string;
  metricValue?: number;
  description?: string;
  conversationId?: string;
}

export function useWallet() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
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
  }, []);

  const consumeCredits = useCallback(async (params: ConsumeCreditsParams) => {
    try {
      const response = await fetch('/api/wallet/consume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar balance después del consumo
        await fetchBalance();
        return {
          success: true,
          newBalance: data.data.newBalance,
          transactionId: data.data.transactionId,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Error al consumir créditos',
        };
      }
    } catch (err) {
      console.error('Error consuming credits:', err);
      return {
        success: false,
        error: 'Error al consumir créditos',
      };
    }
  }, [fetchBalance]);

  const hasSufficientBalance = useCallback((amount: number): boolean => {
    return balance ? balance.balance >= amount : false;
  }, [balance]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    fetchBalance,
    consumeCredits,
    hasSufficientBalance,
  };
}

