# Scripts de Prueba

## test-consume-credits.js / test-consume-credits.ts

Script para probar los endpoints de consumo de créditos de la IA.

### Uso Rápido

```bash
# Probar sin token (solo validaciones básicas)
node scripts/test-consume-credits.js

# Probar con token JWT
node scripts/test-consume-credits.js YOUR_JWT_TOKEN

# O con variable de entorno
JWT_TOKEN=your_token node scripts/test-consume-credits.js
```

### Requisitos

- Node.js instalado
- Servidor Next.js corriendo en `http://localhost:3000` (o configurar `NEXT_PUBLIC_APP_URL`)
- Para probar con JWT: un token válido (obtener desde `/api/admin/tokens`)

### Qué Prueba

1. ✅ Endpoint `/api/wallet/consume` (requiere sesión)
2. ✅ Endpoint `/api/wallet/consume-token` (requiere JWT)
3. ✅ Validaciones de campos requeridos
4. ✅ Validaciones de tipos de datos
5. ✅ Manejo de errores

### Ver Documentación Completa

Ver [docs/TEST_CONSUME_CREDITS.md](../docs/TEST_CONSUME_CREDITS.md) para más detalles.



