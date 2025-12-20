# Estructura de Colores - CAMIA

## 🎨 Arquitectura de Colores

```
┌─────────────────────────────────────────────────────────────┐
│                    src/app/globals.css                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  :root (Light Mode por defecto)                      │  │
│  │  ├── Brand Colors (--brand-*)                         │  │
│  │  ├── Neutral Colors (--neutral-*)                     │  │
│  │  └── Semantic Variables (--primary, --destructive...) │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  .light (Explícito para light mode)                   │  │
│  │  └── Mismas variables que :root                       │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  .dark (Dark mode)                                     │  │
│  │  └── Variables adaptadas para dark mode               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  tailwind.config.ts                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  theme.extend.colors                                   │  │
│  │  └── Mapea variables CSS → Clases Tailwind            │  │
│  │      • background: "var(--background)"                 │  │
│  │      • foreground: "var(--foreground)"                 │  │
│  │      • primary: { DEFAULT, foreground }                │  │
│  │      • destructive: { DEFAULT, foreground, light, dark }  │  │
│  │      • ...                                             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Componentes React (.tsx/.ts)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Uso de clases Tailwind:                                │  │
│  │  • bg-background, bg-card, bg-muted                    │  │
│  │  • text-foreground, text-muted-foreground               │  │
│  │  • border-border                                        │  │
│  │  • text-primary, bg-primary/10                          │  │
│  │  • text-destructive, bg-destructive-light              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📂 Archivos Clave

### 1. **`src/app/globals.css`** - Fuente de Verdad
   - Define todas las variables CSS del tema
   - Contiene paleta de marca, colores neutros y variables semánticas
   - Define estilos para light y dark mode

### 2. **`tailwind.config.ts`** - Mapeo a Tailwind
   - Conecta variables CSS con clases de Tailwind
   - Permite usar `bg-primary`, `text-destructive`, etc.

### 3. **Componentes** - Uso de Clases
   - Usan clases de Tailwind que referencian las variables CSS
   - Se adaptan automáticamente al tema activo

## 🎯 Jerarquía de Colores

```
PALETA DE MARCA (Brand Colors)
├── Navy (Azul oscuro)
│   ├── --brand-navy-100
│   ├── --brand-navy-300
│   ├── --brand-navy-500  ← Primary en Light
│   └── --brand-navy-900
│
├── Rose (Rosa)
│   ├── --brand-rose-100
│   ├── --brand-rose-400
│   └── --brand-rose-600  ← Destructive en Light
│
├── Cyan (Cian)
│   ├── --brand-cyan-100
│   ├── --brand-cyan-300
│   └── --brand-cyan-500  ← Primary en Dark
│
└── Magenta
    └── --brand-magenta-500  ← Destructive en Dark

COLORES NEUTRALES
├── --neutral-50   ← Background
├── --neutral-100  ← Muted
├── --neutral-200  ← Border
├── --neutral-400
├── --neutral-600  ← Muted Foreground
└── --neutral-800

VARIABLES SEMÁNTICAS
├── Background & Foreground
│   ├── --background
│   └── --foreground
│
├── Primary (Color principal)
│   ├── --primary
│   └── --primary-foreground
│
├── Secondary (Color secundario)
│   ├── --secondary
│   └── --secondary-foreground
│
├── Muted (Colores sutiles)
│   ├── --muted
│   └── --muted-foreground
│
├── Accent (Acentos)
│   ├── --accent
│   └── --accent-foreground
│
├── Destructive (Errores/Advertencias)
│   ├── --destructive
│   ├── --destructive-foreground
│   ├── --destructive-light
│   ├── --destructive-dark
│   └── --destructive-border
│
└── Otros
    ├── --border
    ├── --input
    ├── --ring
    ├── --card
    └── --popover
```

## 🔄 Flujo de Cambio de Tema

```
Usuario cambia tema
        │
        ▼
React detecta cambio (ThemeProvider)
        │
        ▼
Aplica clase .dark o .light al <html>
        │
        ▼
Variables CSS cambian automáticamente
        │
        ▼
Clases Tailwind usan nuevas variables
        │
        ▼
Componentes se re-renderizan con nuevos colores
```

## 📝 Ejemplo Práctico

### Antes (Hardcodeado):
```tsx
<div className="bg-gray-200 text-gray-900 border-gray-300">
  Contenido
</div>
```

### Después (Tema):
```tsx
<div className="bg-muted text-foreground border-border">
  Contenido
</div>
```

### Resultado:
- **Light Mode**: `bg-muted` = `#eef1f7`, `text-foreground` = `#0f172a`
- **Dark Mode**: `bg-muted` = `#131a30`, `text-foreground` = `#e8ebf6`
- Se adapta automáticamente sin cambios en el componente

## 🎨 Guía Rápida de Uso

| Necesitas | Usa | Ejemplo |
|-----------|-----|---------|
| Fondo principal | `bg-background` | `<body className="bg-background">` |
| Fondo de tarjeta | `bg-card` | `<div className="bg-card">` |
| Fondo sutil | `bg-muted` | `<div className="bg-muted">` |
| Texto principal | `text-foreground` | `<p className="text-foreground">` |
| Texto secundario | `text-muted-foreground` | `<span className="text-muted-foreground">` |
| Color primario | `text-primary` o `bg-primary` | `<button className="bg-primary text-primary-foreground">` |
| Color de error | `text-destructive` | `<p className="text-destructive">` |
| Fondo de error | `bg-destructive-light` | `<div className="bg-destructive-light">` |
| Borde estándar | `border-border` | `<div className="border border-border">` |
| Borde de error | `border-destructive-border` | `<div className="border-destructive-border">` |

## 🚀 Próximos Pasos

1. **Revisar** `docs/THEME_COLORS_GUIDE.md` para entender todos los colores
2. **Revisar** `docs/COLOR_REFACTORING_CHECKLIST.md` para el plan de refactorización
3. **Empezar** por los componentes base (UI)
4. **Probar** en ambos temas después de cada cambio
5. **Documentar** cualquier nuevo color que agregues
