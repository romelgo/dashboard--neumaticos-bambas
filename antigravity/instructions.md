## 0. Stack Tecnológico y Arquitectura Frontend
 
### Framework y Estilos
 
- **Next.js (App Router):** Todo el frontend se construye sobre Next.js con el nuevo paradigma del App Router (`app/`). Esto nos permite aprovechar React Server Components (RSC), layouts anidados, streaming con Suspense y rutas paralelas para una experiencia de navegación fluida y carga ultrarrápida.
 
- **Tailwind CSS:** Sistema de estilos utility-first. Todas las clases de estilos se escriben directamente en el JSX, sin archivos CSS separados, garantizando consistencia y mantenibilidad.
 
### Sistema de Diseño — "Antigravity"
 
> **Regla de oro:** Todos los componentes, pantallas y flujos visuales deben seguir **exactamente** los diseños de referencia ubicados en la carpeta `Antigravity/` dentro del repositorio del proyecto. Ningún componente nuevo debe inventar patrones visuales propios; si no existe un diseño en Antigravity para el caso, se escala para su diseño antes de implementar.
 
La carpeta `Antigravity/` actúa como la **única fuente de verdad visual** del proyecto:

- **Pantallas completas:** Vistas de referencia por módulo (admin, padre, ) en `Antigravity/screens/`.
 
### Convenciones de Arquitectura
 
| Aspecto | Decisión |
|---|---|
| Routing | App Router (`app/[modulo]/page.tsx`) |
| Componentes de servidor | Por defecto en RSC; `"use client"` solo cuando se necesite interactividad |
| Estado global | Zustand o React Context según complejidad del módulo |
| Fetching de datos | `fetch` nativo con caché de Next.js + SWR/React Query en el cliente |
| Estilos | Tailwind CSS con `cn()` (clsx + tailwind-merge) para clases condicionales |
| Tipado | TypeScript estricto en todo el proyecto |
| Autenticación | Supabase Auth + middleware de Next.js para protección de rutas |

## 📦 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS v4 |
| Realtime | @supabase/supabase-js |
| Mapas | Leaflet.js + react-leaflet |
| Gráficos | Recharts |
| Estado | React Context + hooks |