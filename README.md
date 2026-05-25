# 🖥️ Dashboard INNOVA BAMBAS — Frontend Next.js

> Panel de monitoreo en tiempo real de la flota de neumáticos — 60 camiones CAT 797F

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)

---

## 📋 Descripción

Dashboard de operaciones en tiempo real que consume los 4 modelos predictivos servidos
desde la API FastAPI (`api-bambas`) y los datos de telemetría directamente desde
**Supabase Realtime** (actualización cada 60 segundos).

---

## 🎯 Funcionalidades

| Panel | Descripción | Fuente |
|-------|-------------|--------|
| **Mapa de Flota** | Estado térmico de los 60 camiones en tiempo real | Supabase Realtime |
| **Alertas Térmicas** | Notificaciones cuando neumático > 85°C (Modelo A) | API `/api/v1/predict/thermal` |
| **RUL por Neumático** | Días restantes y fecha estimada de baja (Modelo B) | API `/api/v1/predict/rul` |
| **Mapa de Rutas** | Visualización Verde/Amarillo/Rojo por zona (Modelo C) | API `/api/v1/predict/route` |
| **Panel de Swaps** | Recomendaciones de intercambio Norte↔Sur (Modelo D) | API `/api/v1/predict/swap` |

---

## ⚙️ Variables de Entorno

Copiar `.env.local.example` a `.env.local`:

```env
# Supabase (frontend — solo anon key, nunca service_role_key)
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key_aqui>

# API Backend FastAPI
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> ⚠️ Solo usar `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el frontend.
> La `SUPABASE_SERVICE_ROLE_KEY` únicamente va en el backend (api-bambas).

---

## 🚀 Instalación y Arranque

```bash
cd web
npm install
cp .env.local.example .env.local
# Editar .env.local con las credenciales
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## 🔄 Arquitectura de Datos en Tiempo Real

```
Supabase Realtime WebSocket
  ↓ (cada 60 segundos — nueva telemetría de sensores)
  ↓
Next.js (use-effect + Supabase client)
  ↓
Render componentes (mapa, alertas, RUL)
  ↓
Si se detecta anomalía → POST a FastAPI → Predicción ML → Alerta
```

---

## 🔐 Seguridad Frontend

- **Tokens JWT**: almacenados en cookies `HttpOnly + Secure + SameSite=Lax`
  (nunca en `localStorage`)
- **CSP**: configurado en `next.config.ts`
- **XSS**: React JSX auto-escaping; no usar `dangerouslySetInnerHTML`
- **HTTPS**: toda comunicación con la API es sobre HTTPS en producción
- TODO(security): Implementar MFA para rol de operador/supervisor

---

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
