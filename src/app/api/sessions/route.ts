import { NextRequest, NextResponse } from 'next/server';
import { GHLApp } from '@/lib/ghlApp';

/**
 * Endpoint para consultar las sesiones almacenadas
 * 
 * GET /api/sessions - Obtener todas las sesiones
 * GET /api/sessions?companyId=xxx - Obtener sesión de company
 * GET /api/sessions?locationId=xxx - Obtener sesión de location
 * GET /api/sessions?companyId=xxx&locations=true - Obtener todas las locations de un company
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const locationId = searchParams.get('locationId');
    const locationsOnly = searchParams.get('locations') === 'true';

    const ghlApp = GHLApp.getInstance();
    await ghlApp.initialize();

    // Si se solicita una sesión específica de company
    if (companyId && !locationsOnly) {
      const session = await ghlApp.getSession(companyId);
      const hasSession = await ghlApp.hasCompanySession(companyId);
      
      return NextResponse.json({
        success: true,
        resourceId: companyId,
        type: 'company',
        hasSession,
        session: session || null
      });
    }

    // Si se solicita una sesión específica de location
    if (locationId) {
      const session = await ghlApp.getSession(locationId);
      const hasSession = await ghlApp.hasLocationSession(locationId);
      
      return NextResponse.json({
        success: true,
        resourceId: locationId,
        type: 'location',
        hasSession,
        session: session || null
      });
    }

    // Si se solicitan todas las locations de un company
    if (companyId && locationsOnly) {
      const locationSessions = await ghlApp.getLocationSessions(companyId);
      
      return NextResponse.json({
        success: true,
        companyId,
        type: 'locations',
        count: locationSessions.length,
        sessions: locationSessions
      });
    }

    // Obtener todas las sesiones
    const allSessions = await ghlApp.getAllSessions();
    
    // Separar por tipo
    const companySessions = allSessions.filter((s: any) => s.userType === 'Company');
    const locationSessions = allSessions.filter((s: any) => s.userType === 'Location');

    return NextResponse.json({
      success: true,
      total: allSessions.length,
      companies: {
        count: companySessions.length,
        sessions: companySessions
      },
      locations: {
        count: locationSessions.length,
        sessions: locationSessions
      }
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

