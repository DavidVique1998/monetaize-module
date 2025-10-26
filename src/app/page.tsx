import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monetaize Agent Panel</h1>
          <p className="text-gray-600 mt-2">
            Panel de administración para crear y gestionar agentes de Retell AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Agentes</h3>
            <p className="text-gray-600 mb-4">Crea y gestiona tus agentes de llamada</p>
            <a href="/agents" className="text-purple-600 hover:text-purple-700 font-medium">
              Ver agentes →
            </a>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Voces</h3>
            <p className="text-gray-600 mb-4">Configura las voces disponibles</p>
            <a href="/voices" className="text-purple-600 hover:text-purple-700 font-medium">
              Ver voces →
            </a>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Números</h3>
            <p className="text-gray-600 mb-4">Administra números de teléfono</p>
            <a href="/phone-numbers" className="text-purple-600 hover:text-purple-700 font-medium">
              Ver números →
            </a>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Características Principales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">🤖 Agentes Inteligentes</h4>
              <p className="text-sm text-gray-600">Crea agentes con configuración avanzada y tools personalizadas</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">🎙️ Voces Naturales</h4>
              <p className="text-sm text-gray-600">Integración con ElevenLabs, OpenAI y Deepgram</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">📞 Gestión de Llamadas</h4>
              <p className="text-sm text-gray-600">Control completo sobre números y llamadas</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">🔧 Tools Dinámicas</h4>
              <p className="text-sm text-gray-600">Crea herramientas personalizadas para cada usuario</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
