# SERVMAC Tracker

App de gestión de portafolio de proyectos de construcción.

## Stack
- HTML + React (via Babel) sin build step
- Supabase (Postgres + Auth + Storage + Realtime)
- Hosting: Vercel

## Desarrollo local
Abrir `index.html` directamente en el navegador, o servir con:
```
npx serve .
```

## Despliegue
Conectado a Vercel — cada push a `main` redespliega automáticamente.

## Variables de entorno
Las llaves de Supabase viven en `supabase/api.js` (constantes del cliente). El `anon` key es seguro para el frontend gracias a RLS.

Para el add-on de Gmail (server-side), usa la `service_role` key en una variable de entorno protegida del Apps Script — nunca en el repositorio.

## Estructura
```
index.html              # entry point
data.js                 # datos mockeados (se reemplaza por Supabase en prod)
extras.js, extras2.js   # datos derivados
*.jsx                   # componentes React
supabase/               # schema SQL, cliente API, guía de setup
```
