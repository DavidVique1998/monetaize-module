'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HeaderBar } from "@/components/dashboard/HeaderBar";
import { LocationsList } from "@/components/installer/LocationsList";
import { OAuthLogin } from "@/components/installer/OAuthLogin";
import { Suspense } from "react";

function InstallerContent() {
    return (
        <div className="flex-1 p-6 overflow-y-auto">
            <OAuthLogin />
            <LocationsList />
        </div>
    );
}

export default function InstallerPage() {
    return (
        <DashboardLayout>
            <div className="flex flex-col h-full bg-gray-50">
                {/* Header */}
                <HeaderBar title="Installer" />
                
                {/* Main Content */}
                <Suspense fallback={<div className="flex-1 p-6">Cargando...</div>}>
                    <InstallerContent />
                </Suspense>
            </div>
        </DashboardLayout>
    )
}