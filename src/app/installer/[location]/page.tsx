'use client';

import { useParams } from 'next/navigation';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HeaderBar } from "@/components/dashboard/HeaderBar";

export default function LocationPage() {
  const params = useParams();
  const locationId = params.location as string;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <HeaderBar title={`Location: ${locationId}`} />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Esta página está vacía por ahora */}
        </div>
      </div>
    </DashboardLayout>
  );
}

