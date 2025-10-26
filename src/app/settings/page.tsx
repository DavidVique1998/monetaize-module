import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Settings</h1>
          <p className="text-gray-600 text-lg">
            Configuración del sistema y preferencias
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
