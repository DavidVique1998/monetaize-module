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
        "bg-card rounded-lg border border-gray-200 p-2 shadow-sm hover:shadow-md transition-shadow",
        className
      )}>
        <div className="flex items-center justify-center">
          <Wallet className={cn(
            "w-5 h-5 transition-colors",
            isNegative ? "text-destructive" : "text-emerald-400"
          )} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-card rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center mr-3">
            <Wallet className="w-5 h-5 text-primary mr-2" />
            <span className="text-sm font-medium text-muted-foreground">Balance</span>
          </div>
          <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
        </div>
        <div className={cn(
          "text-lg font-bold transition-colors",
          isNegative ? "text-destructive" : "text-emerald-400"
        )}>
          {formattedBalance}
        </div>
      </div>
    </div>
  );
}
