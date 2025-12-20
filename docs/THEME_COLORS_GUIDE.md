# Guía de Colores del Tema - CAMIA

## 📍 Ubicación de Configuración

Los colores del tema se configuran en **dos archivos principales**:

### 1. `src/app/globals.css` - Variables CSS del Tema

Este es el archivo principal donde se definen todos los colores del tema usando variables CSS.

#### Estructura de Colores:

```css
:root {
  /* 1. PALETA DE MARCA (Brand Colors) */
  --brand-navy-100: #dbe2ff;
  --brand-navy-300: #5c6fc4;
  --brand-navy-500: #0d1f6e;      /* Azul oscuro principal */
  --brand-navy-900: #0c143a;

  --brand-rose-100: #ffd7ea;
  --brand-rose-400: #e8509f;
  --brand-rose-600: #ad0e56;      /* Rosa oscuro (destructive en light) */

  --brand-cyan-100: #d7f1ff;
  --brand-cyan-300: #5ad0ff;
  --brand-cyan-500: #0aaffd;      /* Cyan principal (primary en dark) */

  --brand-magenta-500: #e71680;    /* Magenta (destructive en dark) */

  /* 2. COLORES NEUTRALES */
  --neutral-50: #f7f8fb;           /* Fondo más claro */
  --neutral-100: #eef1f7;
  --neutral-200: #e1e5ed;         /* Bordes */
  --neutral-400: #b5bdce;
  --neutral-600: #5b6478;          /* Texto secundario */
  --neutral-800: #121728;

  /* 3. VARIABLES SEMÁNTICAS (Light Mode - :root y .light) */
  --background: var(--neutral-50);
  --foreground: #0f172a;           /* Texto principal */
  
  --card: #ffffff;                  /* Fondo de tarjetas */
  --card-foreground: #0f172a;
  
  --primary: var(--brand-navy-500);        /* Color principal */
  --primary-foreground: #f8fbff;
  
  --secondary: var(--brand-cyan-100);       /* Color secundario */
  --secondary-foreground: var(--brand-navy-900);
  
  --muted: var(--neutral-100);              /* Fondos sutiles */
  --muted-foreground: var(--neutral-600);   /* Texto secundario */
  
  --accent: var(--brand-magenta-500);       /* Acentos */
  --accent-foreground: #ffffff;
  
  --destructive: var(--brand-rose-600);     /* Errores/Advertencias */
  --destructive-foreground: #ffffff;
  --destructive-light: #fee2e2;             /* Fondo de errores */
  --destructive-dark: #991b1b;              /* Texto de errores */
  --destructive-border: #fca5a5;             /* Bordes de errores */
  
  --border: var(--neutral-200);              /* Bordes generales */
  --input: var(--neutral-200);              /* Bordes de inputs */
  --ring: var(--brand-cyan-500);            /* Anillos de focus */
}

/* 4. DARK MODE (.dark) */
.dark {
  --background: #0b0f1f;
  --foreground: #e8ebf6;
  
  --card: #111733;
  --card-foreground: #f4f6ff;
  
  --primary: var(--brand-cyan-500);         /* Cambia a cyan en dark */
  --primary-foreground: #041226;
  
  --secondary: #182040;
  --secondary-foreground: #e4e8ff;
  
  --muted: #131a30;
  --muted-foreground: #a7b2d4;
  
  --accent: var(--brand-rose-600);
  --accent-foreground: #fff0f7;
  
  --destructive: var(--brand-magenta-500);  /* Cambia a magenta en dark */
  --destructive-foreground: #fff2fb;
  --destructive-light: rgba(231, 22, 128, 0.2);
  --destructive-dark: #e71680;
  --destructive-border: rgba(231, 22, 128, 0.4);
  
  --border: #1f2948;
  --input: #1f2948;
  --ring: #5ad0ff;
}
```

### 2. `tailwind.config.ts` - Configuración de Tailwind

Este archivo mapea las variables CSS a clases de Tailwind:

```typescript
colors: {
  // Colores base
  background: "var(--background)",
  foreground: "var(--foreground)",
  border: "var(--border)",
  input: "var(--input)",
  ring: "var(--ring)",
  
  // Colores semánticos
  primary: {
    DEFAULT: "var(--primary)",
    foreground: "var(--primary-foreground)",
  },
  secondary: {
    DEFAULT: "var(--secondary)",
    foreground: "var(--secondary-foreground)",
  },
  destructive: {
    DEFAULT: "var(--destructive)",
    foreground: "var(--destructive-foreground)",
    light: "var(--destructive-light)",
    dark: "var(--destructive-dark)",
    border: "var(--destructive-border)",
  },
  muted: {
    DEFAULT: "var(--muted)",
    foreground: "var(--muted-foreground)",
  },
  accent: {
    DEFAULT: "var(--accent)",
    foreground: "var(--accent-foreground)",
  },
  card: {
    DEFAULT: "var(--card)",
    foreground: "var(--card-foreground)",
  },
  popover: {
    DEFAULT: "var(--popover)",
    foreground: "var(--popover-foreground)",
  },
}
```

## 🎨 Cómo Usar los Colores

### ✅ CORRECTO - Usar colores del tema:

```tsx
// Fondos
<div className="bg-background">        {/* Fondo principal */}
<div className="bg-card">              {/* Fondo de tarjetas */}
<div className="bg-muted">             {/* Fondo sutil */}
<div className="bg-primary">           {/* Fondo primario */}
<div className="bg-destructive/10">   {/* Fondo de error con opacidad */}

// Textos
<p className="text-foreground">       {/* Texto principal */}
<p className="text-muted-foreground">  {/* Texto secundario */}
<p className="text-primary">          {/* Texto primario */}
<p className="text-destructive">      {/* Texto de error */}

// Bordes
<div className="border border-border"> {/* Borde estándar */}
<div className="border-primary">       {/* Borde primario */}
<div className="border-destructive-border"> {/* Borde de error */}
```

### ❌ INCORRECTO - Colores hardcodeados:

```tsx
// ❌ NO HACER ESTO
<div className="bg-gray-200">
<div className="text-gray-600">
<div className="border-gray-300">
<div className="bg-red-50">
<div className="text-blue-600">
```

## 🔄 Mapeo de Colores Hardcodeados → Tema

| Hardcodeado | Reemplazar con | Uso |
|------------|----------------|-----|
| `bg-white` | `bg-card` | Fondos de tarjetas |
| `bg-gray-50/100/200` | `bg-muted` | Fondos sutiles |
| `bg-gray-800/900` | `bg-background` | Fondos oscuros |
| `text-gray-600/700` | `text-muted-foreground` | Texto secundario |
| `text-gray-900` | `text-foreground` | Texto principal |
| `border-gray-200/300` | `border-border` | Bordes estándar |
| `bg-red-50` | `bg-destructive-light` | Fondos de error |
| `text-red-600/700/800` | `text-destructive-dark` | Texto de error |
| `border-red-200` | `border-destructive-border` | Bordes de error |
| `bg-blue-50` | `bg-primary/10` | Fondos primarios sutiles |
| `text-blue-600` | `text-primary` | Texto primario |

## 📋 Plan de Refactorización

### Fase 1: Identificar todos los colores hardcodeados
- [ ] Buscar `bg-gray-*`, `text-gray-*`, `border-gray-*`
- [ ] Buscar `bg-red-*`, `text-red-*`, `border-red-*`
- [ ] Buscar `bg-blue-*`, `text-blue-*`, `border-blue-*`
- [ ] Buscar `bg-white`, `bg-black`
- [ ] Buscar otros colores hardcodeados (green, yellow, etc.)

### Fase 2: Reemplazar sistemáticamente
1. **Fondos**: `bg-gray-*` → `bg-muted` o `bg-card`
2. **Textos**: `text-gray-*` → `text-foreground` o `text-muted-foreground`
3. **Bordes**: `border-gray-*` → `border-border`
4. **Errores**: `bg-red-*` → `bg-destructive-light`, `text-red-*` → `text-destructive-dark`
5. **Primarios**: `bg-blue-*` → `bg-primary/10`, `text-blue-*` → `text-primary`

### Fase 3: Verificar en ambos temas
- [ ] Probar en light mode
- [ ] Probar en dark mode
- [ ] Ajustar contraste si es necesario

## 🛠️ Herramientas Útiles

### Buscar colores hardcodeados:
```bash
# Buscar todos los colores gray
grep -r "bg-gray-\|text-gray-\|border-gray-" src/

# Buscar colores red
grep -r "bg-red-\|text-red-\|border-red-" src/

# Buscar colores blue
grep -r "bg-blue-\|text-blue-\|border-blue-" src/
```

## 📝 Notas Importantes

1. **Opacidad**: Usar `/10`, `/20`, `/30` para fondos sutiles:
   - `bg-destructive/10` (fondo de error sutil)
   - `bg-primary/20` (fondo primario sutil)

2. **Dark Mode**: Los colores se adaptan automáticamente si usas las variables del tema.

3. **Especificidad**: Si necesitas forzar un estilo, usar `!important` en CSS personalizado (ver `.error-message-container` en `globals.css`).

4. **Nuevos colores**: Si necesitas agregar un nuevo color semántico:
   - Agregarlo en `globals.css` en `:root`, `.light` y `.dark`
   - Agregarlo en `tailwind.config.ts` en la sección `colors`
