import { NextRequest, NextResponse } from 'next/server';
import { twiml } from 'twilio';
import { RetellService } from '@/lib/retell';
import { config } from '@/lib/config';

// Almacenamiento de datos de llamadas en memoria
// En producción, considera usar Redis o base de datos
const callDataStore = new Map<string, {
  call_sid: string;
  retell_call_id: string;
  timestamp: number;
}>();

// Configuración SIP
const SIP_DOMAIN = process.env.SIP_DOMAIN || "5t4n6j0wnrl.sip.livekit.cloud";

export async function POST(request: NextRequest) {
  try {
    // Parsear form data de Twilio
    const formData = await request.formData();
    
    const callSid = formData.get('CallSid') as string;
    const fromNumber = formData.get('From') as string;
    const toNumber = formData.get('To') as string;
    
    console.log(`new-call: Call SID: ${callSid}, From: ${fromNumber}, To: ${toNumber}`);
    
    // Validar datos requeridos
    if (!callSid || !fromNumber || !toNumber) {
      console.error('new-call: Missing required parameters');
      const voiceResponse = new twiml.VoiceResponse();
      voiceResponse.say('Sorry, there was an error processing your call.');
      
      return new NextResponse(
        voiceResponse.toString(),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml',
          },
        }
      );
    }
    
    // Registrar llamada con Retell (sin userId ya que es una llamada entrante de Twilio)
    const retellCallResponse = await RetellService.createCall({
      from_number: fromNumber,
      to_number: toNumber,
      override_agent_id: config.retell.agentId
    }, undefined);
    
    const retellCallId = retellCallResponse.call_id;
    
    // Almacenar datos de la llamada
    callDataStore.set(fromNumber, {
      call_sid: callSid,
      retell_call_id: retellCallId,
      timestamp: Date.now()
    });
    
    console.log(`new-call: Registered incoming call with Retell: ${retellCallId}`);
    
    // Crear endpoint SIP
    const sipEndpoint = `sip:${retellCallId}@${SIP_DOMAIN}`;
    console.log(`new-call: Dialing SIP endpoint: ${sipEndpoint}`);
    
    // Generar TwiML para redirigir a Retell
    const voiceResponse = new twiml.VoiceResponse();
    voiceResponse.dial().sip(sipEndpoint);
    
    return new NextResponse(
      voiceResponse.toString(),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    );
    
  } catch (error) {
    console.error('new-call: Error:', error);
    
    // Respuesta de error en TwiML
    const voiceResponse = new twiml.VoiceResponse();
    voiceResponse.say('Sorry, there was an error connecting.');
    
    return new NextResponse(
      voiceResponse.toString(),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    );
  }
}

// Endpoint para obtener datos de llamadas (opcional, para debugging)
export async function GET(request: NextRequest) {
  try {
    const calls = Array.from(callDataStore.entries()).map(([fromNumber, data]) => ({
      from_number: fromNumber,
      call_sid: data.call_sid,
      retell_call_id: data.retell_call_id,
      timestamp: new Date(data.timestamp).toISOString()
    }));
    
    return NextResponse.json({
      success: true,
      data: calls,
      total: calls.length
    });
  } catch (error) {
    console.error('Error fetching call data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch call data' },
      { status: 500 }
    );
  }
}

// Función para limpiar datos antiguos (opcional)
function cleanupOldCalls() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  for (const [fromNumber, data] of callDataStore.entries()) {
    if (data.timestamp < oneHourAgo) {
      callDataStore.delete(fromNumber);
    }
  }
}

// Limpiar datos cada hora
setInterval(cleanupOldCalls, 60 * 60 * 1000);
