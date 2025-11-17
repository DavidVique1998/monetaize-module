'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WalletBalanceCard } from '@/components/wallet/WalletBalanceCard';
import { WalletTransactions } from '@/components/wallet/WalletTransactions';
import { AutoRechargeSettings } from '@/components/wallet/AutoRechargeSettings';
import { PaymentMethodManager } from '@/components/wallet/PaymentMethodManager';
import { RechargeModal } from '@/components/wallet/RechargeModal';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, X } from 'lucide-react';

export default function WalletPage() {
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // Verificar si hay parámetro de éxito en la URL
    const recharge = searchParams.get('recharge');
    const amount = searchParams.get('amount');
    
    // Solo procesar una vez
    if (recharge === 'success' && amount && !hasProcessedRef.current) {
      hasProcessedRef.current = true;
      setShowSuccessMessage(true);
      setRechargeAmount(amount);
      
      // Limpiar la URL inmediatamente para evitar loops
      router.replace('/wallet');
      
      // Forzar actualización del balance después de 3 segundos
      // (dar tiempo al webhook para procesar)
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 3000);
      
      // Ocultar el mensaje después de 5 segundos
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona tu saldo y configura recargas automáticas
          </p>
        </div>

        {/* Mensaje de éxito después del pago */}
        {showSuccessMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-900">
                  ¡Recarga exitosa!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Tu wallet ha sido recargada con ${rechargeAmount}. El saldo se actualizará automáticamente en breve.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowSuccessMessage(false);
                router.replace('/wallet');
              }}
              className="ml-4 p-1 hover:bg-green-100 rounded transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-green-600" />
            </button>
          </div>
        )}

        {/* Layout de 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Columna izquierda: Balance y Recarga Automática */}
          <div className="space-y-6">
            {/* Balance */}
            <WalletBalanceCard 
              key={refreshKey}
              onRechargeClick={() => setIsRechargeModalOpen(true)}
            />

            {/* Recarga Automática */}
            <AutoRechargeSettings />
          </div>

          {/* Columna derecha: Historial de Transacciones */}
          <div className="flex flex-col">
            <WalletTransactions limit={50} />
          </div>
        </div>

        {/* Modal de recarga */}
        <RechargeModal
          isOpen={isRechargeModalOpen}
          onClose={() => setIsRechargeModalOpen(false)}
          onSuccess={() => {
            // Recargar la página para actualizar el balance
            window.location.reload();
          }}
        />
      </div>
    </DashboardLayout>
  );
}

