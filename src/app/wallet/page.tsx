'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WalletBalance } from '@/components/wallet/WalletBalance';
import { WalletTransactions } from '@/components/wallet/WalletTransactions';
import { AutoRechargeSettings } from '@/components/wallet/AutoRechargeSettings';
import { RechargeModal } from '@/components/wallet/RechargeModal';
import { useState } from 'react';

export default function WalletPage() {
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gestiona tu saldo y configura recargas automáticas
            </p>
          </div>
        </div>

        {/* Balance y recarga */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WalletBalance 
            isCollapsed={false}
            onRechargeClick={() => setIsRechargeModalOpen(true)}
          />
          <AutoRechargeSettings />
        </div>

        {/* Historial de transacciones */}
        <WalletTransactions limit={50} />

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

