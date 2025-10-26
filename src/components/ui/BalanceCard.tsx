import React from 'react';
import { cn } from '@/lib/utils';
import { Wallet, Info } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  currency?: string;
  className?: string;
  isCollapsed?: boolean;
}

export function BalanceCard({ balance, currency = '$', className, isCollapsed = false }: BalanceCardProps) {
  const isNegative = balance < 0;
  const formattedBalance = `${isNegative ? '-' : ''}${currency}${Math.abs(balance).toFixed(2)}`;

  if (isCollapsed) {
    return (
      <div className={cn(
        "bg-white rounded-lg border border-gray-200 p-2 shadow-sm hover:shadow-md transition-shadow",
        className
      )}>
        <div className="flex items-center justify-center">
          <Wallet className={cn(
            "w-5 h-5 transition-colors",
            isNegative ? "text-red-600" : "text-green-600"
          )} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center mr-3">
            <Wallet className="w-5 h-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Balance</span>
          </div>
          <Info className="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors cursor-help" />
        </div>
        <div className={cn(
          "text-lg font-bold transition-colors",
          isNegative ? "text-red-600" : "text-green-600"
        )}>
          {formattedBalance}
        </div>
      </div>
    </div>
  );
}
