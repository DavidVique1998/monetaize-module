/**
 * Servicio de Wallet - Manejo de billetera y consumo de créditos
 * Proporciona funciones para consumir créditos, obtener balance, y gestionar transacciones
 */

import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface ConsumeCreditsParams {
  walletId: string;
  amount: number; // Monto en dólares a consumir
  metricType?: string; // Tipo de métrica: messages, tokens, conversations, minutes, etc.
  metricValue?: number; // Valor de la métrica consumida
  description?: string;
  conversationId?: string;
}

export interface WalletBalance {
  walletId: string;
  balance: number;
  currency: string;
  userId: string;
}

/**
 * Obtener o crear wallet para un usuario
 */
export async function getOrCreateWallet(userId: string) {
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      autoRecharge: true,
    },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 0,
        currency: 'USD',
        autoRecharge: {
          create: {
            enabled: false,
            threshold: 10, // Por defecto $10
            rechargeAmount: 50, // Por defecto recargar $50
          },
        },
      },
      include: {
        autoRecharge: true,
      },
    });
  }

  return wallet;
}

/**
 * Obtener balance de la wallet
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance> {
  const wallet = await getOrCreateWallet(userId);
  
  return {
    walletId: wallet.id,
    balance: Number(wallet.balance),
    currency: wallet.currency,
    userId: wallet.userId,
  };
}

/**
 * Consumir créditos de la wallet
 * Retorna true si el consumo fue exitoso, false si no hay suficiente saldo
 */
export async function consumeCredits(params: ConsumeCreditsParams): Promise<{
  success: boolean;
  newBalance: number;
  transactionId?: string;
  error?: string;
}> {
  const { walletId, amount, metricType, metricValue, description, conversationId } = params;

  if (amount <= 0) {
    return {
      success: false,
      newBalance: 0,
      error: 'El monto debe ser mayor a 0',
    };
  }

  // Usar transacción para asegurar consistencia
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Obtener wallet con lock para evitar condiciones de carrera
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error('Wallet no encontrada');
      }

      const currentBalance = Number(wallet.balance);
      const newBalance = currentBalance - amount;

      // Verificar si hay suficiente saldo
      if (newBalance < 0) {
        throw new Error('Saldo insuficiente');
      }

      // Crear transacción de consumo
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId,
          type: TransactionType.CONSUMPTION,
          status: TransactionStatus.COMPLETED,
          amount: amount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          metricType,
          metricValue: metricValue ? metricValue : null,
          description,
          conversationId,
        },
      });

      // Actualizar balance de la wallet
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: newBalance,
        },
      });

      // Verificar si se debe activar recarga automática
      const autoRecharge = await tx.autoRechargeSettings.findUnique({
        where: { walletId },
      });

      if (autoRecharge?.enabled && newBalance <= Number(autoRecharge.threshold)) {
        // Disparar recarga automática (se manejará en otro servicio)
        console.log(`[Wallet] Balance bajo umbral. Balance: $${newBalance}, Umbral: $${autoRecharge.threshold}`);
        // La recarga automática se manejará en el servicio de Stripe
      }

      return {
        success: true,
        newBalance,
        transactionId: transaction.id,
      };
    });

    return result;
  } catch (error: any) {
    console.error('[Wallet] Error al consumir créditos:', error);
    return {
      success: false,
      newBalance: 0,
      error: error.message || 'Error al consumir créditos',
    };
  }
}

/**
 * Agregar créditos a la wallet (recarga)
 */
export async function addCredits(
  walletId: string,
  amount: number,
  stripePaymentId?: string,
  paymentLinkId?: string
): Promise<{
  success: boolean;
  newBalance: number;
  transactionId?: string;
  error?: string;
}> {
  if (amount <= 0) {
    return {
      success: false,
      newBalance: 0,
      error: 'El monto debe ser mayor a 0',
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error('Wallet no encontrada');
      }

      const currentBalance = Number(wallet.balance);
      const newBalance = currentBalance + amount;

      // Crear transacción de recarga
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId,
          type: TransactionType.RECHARGE,
          status: TransactionStatus.COMPLETED,
          amount: amount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          stripePaymentId,
          paymentLinkId,
          description: `Recarga de $${amount.toFixed(2)}`,
        },
      });

      // Actualizar balance
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: newBalance,
        },
      });

      // Si hay un payment link, actualizar su estado
      if (paymentLinkId) {
        await tx.paymentLink.update({
          where: { id: paymentLinkId },
          data: {
            status: 'paid',
            paidAt: new Date(),
          },
        });
      }

      return {
        success: true,
        newBalance,
        transactionId: transaction.id,
      };
    });

    return result;
  } catch (error: any) {
    console.error('[Wallet] Error al agregar créditos:', error);
    return {
      success: false,
      newBalance: 0,
      error: error.message || 'Error al agregar créditos',
    };
  }
}

/**
 * Obtener historial de transacciones
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  const wallet = await getOrCreateWallet(userId);

  const transactions = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      paymentLink: {
        select: {
          stripeLinkId: true,
          amount: true,
        },
      },
    },
  });

  const total = await prisma.walletTransaction.count({
    where: { walletId: wallet.id },
  });

  return {
    transactions,
    total,
    limit,
    offset,
  };
}

/**
 * Verificar si hay suficiente saldo
 */
export async function hasSufficientBalance(
  userId: string,
  amount: number
): Promise<boolean> {
  const wallet = await getOrCreateWallet(userId);
  return Number(wallet.balance) >= amount;
}

