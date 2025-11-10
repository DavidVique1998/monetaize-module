import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Excluir MongoDB del bundle del servidor (el SDK lo usa internamente)
  serverExternalPackages: ['mongodb'],
  // Configuración para Turbopack (Next.js 16 usa Turbopack por defecto)
  turbopack: {},
};

export default nextConfig;
