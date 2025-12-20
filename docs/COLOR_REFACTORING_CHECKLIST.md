# Checklist de Refactorización de Colores

## 📊 Resumen de Archivos con Colores Hardcodeados

### Archivos con más colores hardcodeados (prioridad alta):

1. **`src/app/assistants/page.tsx`** - Múltiples `border-gray-*`, `text-gray-*`, `bg-purple-*`
2. **`src/app/call-history/page.tsx`** - Múltiples `border-gray-*`, `text-gray-*`
3. **`src/app/call-center/page.tsx`** - `border-gray-*`, `text-gray-*`
4. **`src/components/debug/AgentDebugPanel.tsx`** - `bg-red-*`, `bg-blue-*`, `bg-yellow-*`
5. **`src/components/dashboard/MetricCard.tsx`** - `border-gray-*`
6. **`src/components/dashboard/HangupReasons.tsx`** - `border-gray-*`
7. **`src/app/dashboard/page.tsx`** - `text-gray-*`, `border-gray-*`
8. **`src/app/contacts/page.tsx`** - `border-gray-*`, `text-gray-*`
9. **`src/components/phone/ImportPhoneNumberForm.tsx`** - `border-gray-*`
10. **`src/components/assistants/AgentConfigSidebar.tsx`** - Múltiples colores

## 🔄 Reemplazos Comunes

### Fondos
- `bg-white` → `bg-card`
- `bg-gray-50` → `bg-muted`
- `bg-gray-100` → `bg-muted`
- `bg-gray-200` → `bg-muted`
- `bg-gray-800` → `bg-background`
- `bg-gray-900` → `bg-background`

### Textos
- `text-gray-900` → `text-foreground`
- `text-gray-800` → `text-foreground`
- `text-gray-700` → `text-foreground`
- `text-gray-600` → `text-muted-foreground`
- `text-gray-500` → `text-muted-foreground`
- `text-gray-400` → `text-muted-foreground`

### Bordes
- `border-gray-200` → `border-border`
- `border-gray-300` → `border-border`
- `border-gray-100` → `border-border`

### Errores/Advertencias
- `bg-red-50` → `bg-destructive-light`
- `bg-red-100` → `bg-destructive-light`
- `text-red-600` → `text-destructive-dark`
- `text-red-700` → `text-destructive-dark`
- `text-red-800` → `text-destructive-dark`
- `border-red-200` → `border-destructive-border`

### Primarios/Azules
- `bg-blue-50` → `bg-primary/10`
- `text-blue-600` → `text-primary`
- `border-blue-500` → `border-primary`

### Éxito/Verde
- `bg-emerald-600/10` → `bg-emerald-500/10` (mantener, es específico)
- `text-emerald-400` → Mantener si es para estados de éxito

### Advertencia/Amarillo
- `bg-yellow-50` → Considerar crear `bg-warning-light` si se usa mucho
- `text-yellow-600` → Considerar crear `text-warning` si se usa mucho

## 📝 Plan de Acción

### Fase 1: Componentes Base (UI)
- [ ] `src/components/ui/GenericPage.tsx`
- [ ] `src/components/ui/card.tsx`
- [ ] `src/components/ui/table.tsx`
- [ ] `src/components/ui/sidebar.tsx`

### Fase 2: Páginas Principales
- [ ] `src/app/dashboard/page.tsx`
- [ ] `src/app/assistants/page.tsx`
- [ ] `src/app/call-history/page.tsx`
- [ ] `src/app/call-center/page.tsx`
- [ ] `src/app/contacts/page.tsx`
- [ ] `src/app/phone-numbers/page.tsx`

### Fase 3: Componentes de Dashboard
- [ ] `src/components/dashboard/MetricCard.tsx`
- [ ] `src/components/dashboard/HangupReasons.tsx`
- [ ] `src/components/dashboard/FiltersBar.tsx`
- [ ] `src/components/dashboard/LineChart.tsx`
- [ ] `src/components/dashboard/PieChart.tsx`
- [ ] `src/components/dashboard/FunnelChart.tsx`

### Fase 4: Componentes de Funcionalidad
- [ ] `src/components/phone/ImportPhoneNumberForm.tsx`
- [ ] `src/components/phone/EditPhoneNumberModal.tsx`
- [ ] `src/components/assistants/AgentConfigSidebar.tsx`
- [ ] `src/components/debug/AgentDebugPanel.tsx`
- [ ] `src/components/contacts/ContactsTable.tsx`

### Fase 5: Componentes de Wallet
- [ ] `src/components/wallet/WalletBalance.tsx`
- [ ] `src/components/wallet/WalletBalanceCard.tsx`
- [ ] `src/components/wallet/WalletTransactions.tsx`
- [ ] `src/components/wallet/RechargeModal.tsx`
- [ ] `src/components/wallet/AutoRechargeSettings.tsx`

### Fase 6: Otros Componentes
- [ ] `src/components/knowledge/*`
- [ ] `src/components/inbox/*`
- [ ] `src/components/voices/*`
- [ ] `src/app/help/page.tsx`
- [ ] `src/app/settings/page.tsx`
- [ ] `src/app/widgets/page.tsx`

## 🛠️ Comandos Útiles

### Buscar todos los colores gray:
```bash
grep -rn "gray-[0-9]" src/ --include="*.tsx" --include="*.ts" | wc -l
```

### Buscar colores específicos:
```bash
# Red
grep -rn "red-[0-9]" src/ --include="*.tsx"

# Blue
grep -rn "blue-[0-9]" src/ --include="*.tsx"

# Yellow
grep -rn "yellow-[0-9]" src/ --include="*.tsx"
```

### Contar ocurrencias por archivo:
```bash
grep -rn "gray-[0-9]" src/ --include="*.tsx" | cut -d: -f1 | sort | uniq -c | sort -rn
```

## ✅ Verificación Post-Refactorización

Después de refactorizar cada archivo:

1. **Verificar en Light Mode:**
   - [ ] Los colores se ven correctos
   - [ ] El contraste es adecuado
   - [ ] Los bordes son visibles

2. **Verificar en Dark Mode:**
   - [ ] Los colores se adaptan correctamente
   - [ ] El contraste es adecuado
   - [ ] Los textos son legibles

3. **Verificar Funcionalidad:**
   - [ ] No se rompió ninguna funcionalidad
   - [ ] Los estados hover/focus funcionan
   - [ ] Los componentes interactivos funcionan

## 📌 Notas Importantes

1. **No reemplazar colores específicos de estado:**
   - `text-emerald-400` para estados de éxito (puede mantenerse)
   - `bg-emerald-600/10` para fondos de éxito (puede mantenerse)
   - Colores específicos de gráficos/charts pueden mantenerse

2. **Mantener colores de marca cuando sea apropiado:**
   - Si un color específico es parte de la identidad visual, puede mantenerse

3. **Usar opacidad para fondos sutiles:**
   - `bg-primary/10` en lugar de `bg-primary` con opacidad baja
   - `bg-destructive/10` para fondos de error sutiles

4. **Considerar agregar nuevas variables si se repiten:**
   - Si `bg-yellow-50` se usa mucho, considerar agregar `--warning-light`
   - Si `text-emerald-400` se usa mucho, considerar agregar `--success`
