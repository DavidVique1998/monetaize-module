/**
 * Script de prueba para los endpoints de consumo de créditos
 * 
 * Uso:
 *   pnpm tsx scripts/test-consume-credits.ts
 * 
 * O con Node.js:
 *   node --loader ts-node/esm scripts/test-consume-credits.ts
 */

import axios from 'axios';

// Configuración
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✓ ${message}`, 'green');
}

function logError(message: string) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message: string) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message: string) {
  log(`⚠ ${message}`, 'yellow');
}

/**
 * Probar endpoint /api/wallet/consume (requiere sesión autenticada)
 * 
 * NOTA: Este endpoint requiere cookies de sesión. Para probarlo completamente,
 * necesitas estar autenticado en el navegador o usar un cliente HTTP que maneje cookies.
 */
async function testConsumeWithSession() {
  logInfo('\n=== Probando /api/wallet/consume (con sesión) ===');
  
  try {
    const response = await axios.post(
      `${API_BASE}/wallet/consume`,
      {
        amount: 0.1,
        description: 'Prueba de consumo de créditos desde script',
        metricType: 'ai_call',
        metricValue: 1,
        conversationId: 'test-conversation-' + Date.now(),
      },
      {
        // Nota: En un entorno real, necesitarías incluir las cookies de sesión
        // Esto solo funcionará si tienes una sesión activa
        withCredentials: true,
        validateStatus: () => true, // No lanzar error en cualquier status
      }
    );

    if (response.status === 200 && response.data.success) {
      logSuccess('Consumo exitoso');
      log(`  Nuevo balance: ${response.data.data.newBalance}`);
      log(`  Transaction ID: ${response.data.data.transactionId}`);
      return true;
    } else if (response.status === 401) {
      logWarning('No autenticado (esperado si no hay sesión activa)');
      log('  Este endpoint requiere autenticación de sesión');
      return false;
    } else {
      logError(`Error: ${response.data.error || 'Error desconocido'}`);
      return false;
    }
  } catch (error: any) {
    if (error.response) {
      logError(`Error HTTP ${error.response.status}: ${error.response.data.error || error.message}`);
    } else {
      logError(`Error: ${error.message}`);
    }
    return false;
  }
}

/**
 * Probar endpoint /api/wallet/consume-token (requiere JWT token)
 */
async function testConsumeWithToken(jwtToken: string) {
  logInfo('\n=== Probando /api/wallet/consume-token (con JWT) ===');
  
  if (!jwtToken) {
    logWarning('No se proporcionó token JWT. Saltando prueba...');
    log('  Para obtener un token, usa: POST /api/admin/tokens con { userId: "..." }');
    return false;
  }

  try {
    const response = await axios.post(
      `${API_BASE}/wallet/consume-token`,
      {
        amount: 0.1,
        reason: 'Prueba de consumo de créditos desde script con JWT',
        metricType: 'ai_call',
        metricValue: 1,
        conversationId: 'test-conversation-jwt-' + Date.now(),
      },
      {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data.success) {
      logSuccess('Consumo exitoso con JWT');
      log(`  Nuevo balance: ${response.data.data.newBalance}`);
      log(`  Transaction ID: ${response.data.data.transactionId}`);
      log(`  User ID: ${response.data.data.userId}`);
      if (response.data.data.ghlLocationId) {
        log(`  GHL Location ID: ${response.data.data.ghlLocationId}`);
      }
      return true;
    } else if (response.status === 401) {
      logError('Token inválido o expirado');
      return false;
    } else {
      logError(`Error: ${response.data.error || 'Error desconocido'}`);
      if (response.data.details) {
        log(`  Detalles: ${JSON.stringify(response.data.details, null, 2)}`);
      }
      return false;
    }
  } catch (error: any) {
    if (error.response) {
      logError(`Error HTTP ${error.response.status}: ${error.response.data.error || error.message}`);
    } else {
      logError(`Error: ${error.message}`);
    }
    return false;
  }
}

/**
 * Probar validaciones del endpoint consume-token
 */
async function testConsumeTokenValidations(jwtToken: string) {
  logInfo('\n=== Probando validaciones de /api/wallet/consume-token ===');
  
  if (!jwtToken) {
    logWarning('No se proporcionó token JWT. Saltando pruebas de validación...');
    return;
  }

  const tests = [
    {
      name: 'Sin token (debe fallar)',
      data: {
        amount: 0.1,
        reason: 'Prueba sin token',
      },
      headers: {},
      expectedStatus: 401,
    },
    {
      name: 'Sin amount (debe fallar)',
      data: {
        reason: 'Prueba sin amount',
      },
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
      },
      expectedStatus: 400,
    },
    {
      name: 'Sin reason (debe fallar)',
      data: {
        amount: 0.1,
      },
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
      },
      expectedStatus: 400,
    },
    {
      name: 'Amount negativo (debe fallar)',
      data: {
        amount: -0.1,
        reason: 'Prueba con amount negativo',
      },
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
      },
      expectedStatus: 400,
    },
    {
      name: 'Amount cero (debe fallar)',
      data: {
        amount: 0,
        reason: 'Prueba con amount cero',
      },
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
      },
      expectedStatus: 400,
    },
  ];

  for (const test of tests) {
    try {
      const response = await axios.post(
        `${API_BASE}/wallet/consume-token`,
        test.data,
        {
          headers: {
            'Content-Type': 'application/json',
            ...test.headers,
          },
          validateStatus: () => true,
        }
      );

      if (response.status === test.expectedStatus) {
        logSuccess(`✓ ${test.name} - Status esperado: ${test.expectedStatus}`);
      } else {
        logError(`✗ ${test.name} - Esperado ${test.expectedStatus}, recibido ${response.status}`);
      }
    } catch (error: any) {
      logError(`✗ ${test.name} - Error: ${error.message}`);
    }
  }
}

/**
 * Función principal
 */
async function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('  Script de Prueba - Endpoints de Consumo de Créditos', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  // Obtener token JWT de los argumentos de línea de comandos o variable de entorno
  const jwtToken = process.argv[2] || process.env.JWT_TOKEN || '';

  logInfo(`Base URL: ${BASE_URL}`);
  logInfo(`API Base: ${API_BASE}`);
  if (jwtToken) {
    logInfo(`Token JWT: ${jwtToken.substring(0, 20)}...`);
  }

  // Probar endpoint con sesión (probablemente fallará sin sesión activa)
  await testConsumeWithSession();

  // Probar endpoint con token JWT
  if (jwtToken) {
    await testConsumeWithToken(jwtToken);
    await testConsumeTokenValidations(jwtToken);
  } else {
    logWarning('\nPara probar el endpoint con JWT, proporciona un token:');
    log('  pnpm tsx scripts/test-consume-credits.ts <JWT_TOKEN>');
    log('  o');
    log('  JWT_TOKEN=tu_token pnpm tsx scripts/test-consume-credits.ts');
  }

  log('\n' + '='.repeat(60), 'cyan');
  log('  Pruebas completadas', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
}

// Ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}` || require.main === module) {
  main().catch((error) => {
    logError(`Error fatal: ${error.message}`);
    process.exit(1);
  });
}



