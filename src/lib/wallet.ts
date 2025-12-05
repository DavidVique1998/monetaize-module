/**
 * Servicio de Wallet - Manejo de billetera y consumo de créditos
 * Proporciona funciones para consumir créditos, obtener balance, y gestionar transacciones
 */

import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface ConsumeCreditsParams {
  walletId: string;
  amount: number; // Monto en CENTAVOS a consumir (interno y externo siempre en centavos)
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
 * Retorna balance en dólares solo para presentación en el frontend
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance> {
  const wallet = await getOrCreateWallet(userId);
  
  return {
    walletId: wallet.id,
    // Convertir centavos a dólares solo para presentación
    balance: Number(wallet.balance) / 100,
    currency: wallet.currency,
    userId: wallet.userId,
  };
}

/**
 * Consumir créditos de la wallet
 * amount debe venir en CENTAVOS (no convertir)
 * Retorna newBalance en dólares solo para presentación
 */
export async function consumeCredits(params: ConsumeCreditsParams): Promise<{
  success: boolean;
  newBalance: number; // En dólares solo para presentación
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

      // amount ya viene en centavos, no convertir
      const amountInCents = Math.round(amount);
      const currentBalance = Number(wallet.balance); // centavos
      const newBalance = currentBalance - amountInCents;

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
          amount: amountInCents,
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
        console.log(`[Wallet] Balance bajo umbral. Balance: ${newBalance} centavos ($${(newBalance / 100).toFixed(2)}), Umbral: ${autoRecharge.threshold} centavos ($${(Number(autoRecharge.threshold) / 100).toFixed(2)})`);
        // La recarga automática se manejará en el servicio de Stripe
      }

      return {
        success: true,
        // Devolver nuevo balance en dólares
        newBalance: newBalance / 100,
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
 * amount debe venir en CENTAVOS (no convertir)
 * Retorna newBalance en dólares solo para presentación
 */
export async function addCredits(
  walletId: string,
  amount: number, // En CENTAVOS
  stripePaymentId?: string,
  paymentLinkId?: string
): Promise<{
  success: boolean;
  newBalance: number; // En dólares solo para presentación
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

      // amount ya viene en centavos, no convertir
      const amountInCents = Math.round(amount);
      const currentBalance = Number(wallet.balance); // centavos
      const newBalance = currentBalance + amountInCents;

      // Crear transacción de recarga
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId,
          type: TransactionType.RECHARGE,
          status: TransactionStatus.COMPLETED,
          amount: amountInCents,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          stripePaymentId,
          paymentLinkId,
          description: `Recarga de ${amountInCents} centavos ($${(amountInCents / 100).toFixed(2)})`,
        },
      });

      // Actualizar balance
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: newBalance,
        },
      });

      console.log(`[Wallet] Balance actualizado: ${currentBalance} centavos ($${(currentBalance / 100).toFixed(2)}) → ${newBalance} centavos ($${(newBalance / 100).toFixed(2)})`);

      // Si hay un payment link, actualizar su estado
      if (paymentLinkId) {
        await tx.paymentLink.update({
          where: { id: paymentLinkId },
          data: {
            status: 'paid',
            paidAt: new Date(),
          },
        });
        console.log(`[Wallet] Payment link ${paymentLinkId} marcado como pagado`);
      }

      return {
        success: true,
        // Devolver nuevo balance en dólares
        newBalance: newBalance / 100,
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

  // Convertir Decimal a número para evitar errores en el frontend
  const formattedTransactions = transactions.map(transaction => ({
    ...transaction,
    // Internamente en centavos, exponemos dólares
    amount: Number(transaction.amount) / 100,
    balanceBefore: Number(transaction.balanceBefore) / 100,
    balanceAfter: Number(transaction.balanceAfter) / 100,
    metricValue: transaction.metricValue ? Number(transaction.metricValue) : null,
    paymentLink: transaction.paymentLink ? {
      ...transaction.paymentLink,
      amount: Number(transaction.paymentLink.amount),
    } : undefined,
  }));

  return {
    transactions: formattedTransactions,
    total,
    limit,
    offset,
  };
}

/**
 * Verificar si hay suficiente saldo
 * amount debe venir en CENTAVOS
 */
export async function hasSufficientBalance(
  userId: string,
  amount: number // En CENTAVOS
): Promise<boolean> {
  const wallet = await getOrCreateWallet(userId);
  const currentBalanceCents = Number(wallet.balance); // centavos
  const amountInCents = Math.round(amount); // amount ya viene en centavos
  return currentBalanceCents >= amountInCents;
}

/**
 * INTERFAZ PARA CONSUMOS POR LOTES (BATCH PROCESSING)
 * Sistema de acumulación para evitar sobrecarga en alta concurrencia
 */

export interface PendingConsumptionParams {
  walletId: string;
  amount: number;
  metricType?: string;
  metricValue?: number;
  description?: string;
  conversationId?: string;
}

export interface BatchProcessingConfig {
  maxAmount?: number; // Máximo de créditos acumulados (default: 10)
  maxTransactions?: number; // Máximo de transacciones pendientes (default: 100)
  maxTimeSeconds?: number; // Máximo tiempo en segundos (default: 300 = 5 min)
}

/**
 * Obtener o crear configuración de batch processing para una wallet
 */
export async function getOrCreateBatchConfig(
  walletId: string,
  defaults?: BatchProcessingConfig
) {
  let config = await prisma.batchProcessingConfig.findUnique({
    where: { walletId },
  });

  if (!config) {
    // Verificar que la wallet existe
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new Error('Wallet no encontrada');
    }

    config = await prisma.batchProcessingConfig.create({
      data: {
        walletId,
        enabled: true,
        // Guardar umbrales en centavos (si viene en dólares, convertir)
        maxAmount: defaults?.maxAmount ? (defaults.maxAmount >= 100 ? defaults.maxAmount : defaults.maxAmount * 100) : 1000, // $10 = 1000 centavos por defecto
        maxTransactions: defaults?.maxTransactions || 100,
        maxTimeSeconds: defaults?.maxTimeSeconds || 3600, // 5 minutos
      },
    });
  }

  return config;
}

/**
 * Agregar un consumo pendiente (acumulación)
 * Retorna el ID del consumo pendiente
 */
export async function addPendingConsumption(
  params: PendingConsumptionParams
): Promise<{
  success: boolean;
  pendingId?: string;
  shouldProcess?: boolean; // Si se debe procesar inmediatamente
  error?: string;
}> {
  const { walletId, amount, metricType, metricValue, description, conversationId } = params;

  if (amount <= 0) {
    return {
      success: false,
      error: 'El monto debe ser mayor a 0',
    };
  }

  try {
    // Verificar configuración primero (fuera de transacción)
    const config = await getOrCreateBatchConfig(walletId);

    if (!config.enabled) {
      // Si el batch processing está deshabilitado, procesar inmediatamente
      const consumeResult = await consumeCredits(params);
      if (!consumeResult.success) {
        return {
          success: false,
          error: consumeResult.error || 'Error al consumir créditos',
        };
      }
      return {
        success: true,
        shouldProcess: false, // Ya se procesó
        pendingId: consumeResult.transactionId,
      };
    }

    // Si está habilitado, agregar a pendientes
    const result = await prisma.$transaction(async (tx) => {
      // Verificar si existe configuración en la transacción
      let batchConfig = await tx.batchProcessingConfig.findUnique({
        where: { walletId },
      });

      if (!batchConfig) {
        batchConfig = await tx.batchProcessingConfig.create({
          data: {
            walletId,
            enabled: true,
            maxAmount: config.maxAmount,
            maxTransactions: config.maxTransactions,
            maxTimeSeconds: config.maxTimeSeconds,
          },
        });
      }

      // Crear consumo pendiente
      const pending = await tx.pendingConsumption.create({
        data: {
          walletId,
          // amount ya viene en centavos
          amount: Math.round(amount),
          metricType,
          metricValue: metricValue ? metricValue : null,
          description,
          conversationId,
        },
      });

      // Verificar si se debe procesar el lote
      const pendingConsumptions = await tx.pendingConsumption.findMany({
        where: {
          walletId,
          processed: false,
        },
      });

      const totalAmount = pendingConsumptions.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      ); // centavos
      const totalTransactions = pendingConsumptions.length;

      // Verificar umbrales
      const shouldProcess =
        totalAmount >= Number(batchConfig.maxAmount) ||
        totalTransactions >= batchConfig.maxTransactions;

      return {
        success: true,
        pendingId: pending.id,
        shouldProcess,
      };
    });

    return result;
  } catch (error: any) {
    console.error('[Wallet] Error al agregar consumo pendiente:', error);
    return {
      success: false,
      error: error.message || 'Error al agregar consumo pendiente',
    };
  }
}

/**
 * Procesar un lote de consumos pendientes para una wallet
 */
export async function processBatch(walletId: string): Promise<{
  success: boolean;
  processedCount?: number;
  totalAmount?: number;
  transactionId?: string;
  error?: string;
}> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Obtener consumos pendientes
      const pendingConsumptions = await tx.pendingConsumption.findMany({
        where: {
          walletId,
          processed: false,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (pendingConsumptions.length === 0) {
        return {
          success: true,
          processedCount: 0,
          totalAmount: 0,
        };
      }

      // Calcular total
      const totalAmountCents = pendingConsumptions.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );

      // Obtener wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error('Wallet no encontrada');
      }

      const currentBalance = Number(wallet.balance); // centavos
      const newBalance = currentBalance - totalAmountCents;

      // Verificar saldo suficiente
      if (newBalance < 0) {
        // Marcar como fallidos
        await tx.pendingConsumption.updateMany({
          where: {
            id: { in: pendingConsumptions.map((p) => p.id) },
          },
          data: {
            processed: true,
            processedAt: new Date(),
            description: `FALLIDO: ${pendingConsumptions[0].description || 'Saldo insuficiente'}`,
          },
        });

        throw new Error('Saldo insuficiente para procesar el lote');
      }

      // Generar batchId único
      const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Crear transacción consolidada
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId,
          type: TransactionType.CONSUMPTION,
          status: TransactionStatus.COMPLETED,
          amount: totalAmountCents,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          metricType: 'batch_processed',
          metricValue: pendingConsumptions.length,
          description: `Lote procesado: ${pendingConsumptions.length} consumos (${(totalAmountCents / 100).toFixed(3)} USD)`,
        },
      });

      // Marcar consumos como procesados
      await tx.pendingConsumption.updateMany({
        where: {
          id: { in: pendingConsumptions.map((p) => p.id) },
        },
        data: {
          processed: true,
          processedAt: new Date(),
          batchId,
        },
      });

      // Actualizar balance
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: newBalance,
        },
      });

      // Actualizar última vez procesada en la configuración
      await tx.batchProcessingConfig.update({
        where: { walletId },
        data: {
          lastProcessedAt: new Date(),
        },
      });

      // Verificar recarga automática
      const autoRecharge = await tx.autoRechargeSettings.findUnique({
        where: { walletId },
      });

      if (autoRecharge?.enabled && newBalance <= Number(autoRecharge.threshold)) {
        console.log(`[Wallet] Balance bajo umbral. Balance: ${newBalance} centavos ($${(newBalance / 100).toFixed(2)}), Umbral: ${autoRecharge.threshold} centavos ($${(Number(autoRecharge.threshold) / 100).toFixed(2)})`);
      }

      return {
        success: true,
        processedCount: pendingConsumptions.length,
        // Exponer total en dólares solo para presentación
        totalAmount: totalAmountCents / 100,
        transactionId: transaction.id,
      };
    });

    return result;
  } catch (error: any) {
    console.error('[Wallet] Error al procesar lote:', error);
    return {
      success: false,
      error: error.message || 'Error al procesar lote',
    };
  }
}

/**
 * Procesar lotes para todas las wallets que cumplan los criterios
 * (Para usar en cron jobs)
 */
export async function processAllBatches(): Promise<{
  processed: number;
  errors: number;
  details: Array<{ walletId: string; success: boolean; error?: string }>;
}> {
  const details: Array<{ walletId: string; success: boolean; error?: string }> = [];
  let processed = 0;
  let errors = 0;

  try {
    // Obtener todas las configuraciones habilitadas
    const configs = await prisma.batchProcessingConfig.findMany({
      where: {
        enabled: true,
      },
      include: {
        wallet: {
          include: {
            pendingConsumptions: {
              where: {
                processed: false,
              },
            },
          },
        },
      },
    });

    for (const config of configs) {
      const walletId = config.walletId;
      const pending = config.wallet.pendingConsumptions;

      if (pending.length === 0) {
        continue;
      }

      // Calcular total acumulado
      const totalAmount = pending.reduce((sum, p) => sum + Number(p.amount), 0); // centavos
      const oldestPending = pending[0];
      const ageSeconds = Math.floor(
        (Date.now() - oldestPending.createdAt.getTime()) / 1000
      );

      // Verificar si se debe procesar
      const shouldProcess =
        totalAmount >= Number(config.maxAmount) ||
        pending.length >= config.maxTransactions ||
        ageSeconds >= config.maxTimeSeconds;

      if (shouldProcess) {
        const result = await processBatch(walletId);
        if (result.success) {
          processed++;
          details.push({ walletId, success: true });
        } else {
          errors++;
          details.push({ walletId, success: false, error: result.error });
        }
      }
    }

    return { processed, errors, details };
  } catch (error: any) {
    console.error('[Wallet] Error al procesar todos los lotes:', error);
    return {
      processed,
      errors: errors + 1,
      details: [
        ...details,
        { walletId: 'unknown', success: false, error: error.message },
      ],
    };
  }
}

