# Said Coach — Setup Guide

## Stack
- Next.js 14 (App Router)
- Supabase (Postgres + Auth + Storage)
- Tailwind CSS + shadcn/ui
- Deploy: Vercel

---

## 1. Crear proyecto en Supabase

1. Ir a https://supabase.com → New project
2. Copiar las credenciales desde Project Settings → API:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Variables de entorno

Editar `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

En producción usar la URL de Vercel:
```
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

## 3. Ejecutar migración SQL

1. Ir a Supabase → SQL Editor
2. Copiar el contenido de `supabase/migrations/001_initial_schema.sql`
3. Pegar y ejecutar → crea todas las tablas, RLS y seed de ejercicios

## 4. Crear tu cuenta de entrenador

1. Ir a Supabase → Authentication → Users → Add user
2. Crear usuario con tu email y contraseña
3. Ir a la app → `/login` → iniciar sesión
4. La primera vez que accedas a `/dashboard` se crea tu `trainer_profile` automáticamente

## 5. Desarrollo local

```bash
npm install
npm run dev
# App en http://localhost:3000
```

## 6. Deploy en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en vercel.com → Project → Settings → Environment Variables
```

O conectar el repo de GitHub en vercel.com para auto-deploy.

## 7. Configurar email templates en Supabase (opcional)

Para que los emails de invitación a alumnos se vean con tu marca:
- Supabase → Authentication → Email Templates
- Editar "Invite user" template

---

## Flujo de uso

### Como entrenador (Said):
1. Login en `/login`
2. Crear alumnos en `/clientes/new` (se envía email de invitación automáticamente)
3. Crear ejercicios propios en `/ejercicios` (hay 22 ejercicios globales de base)
4. Crear programas en `/programas/new` → agregar sesiones y ejercicios en el editor
5. Asignar programas a alumnos desde `/clientes/[id]`
6. Personalizar tu marca en `/settings`

### Como alumno:
1. Recibe email de invitación → hace clic en el link → configura su contraseña
2. Entra en `/mis-programas` y ve sus programas activos
3. Navega semanas → sesiones → registra series/reps/peso
4. Puede dictar notas por voz (Chrome) o escribirlas
5. Marca la sesión como completada

---

## Estructura del proyecto

```
app/
  (auth)/login/          → Página de login
  (admin)/               → Panel del entrenador
    dashboard/           → Resumen
    clientes/            → CRUD alumnos
    programas/           → CRUD programas + workout builder
    ejercicios/          → Biblioteca de ejercicios
    settings/            → Branding (colores, nombre, logo)
  (client)/              → App del alumno (branded)
    mis-programas/       → Programas asignados → sesión → registro
components/
  admin/                 → Componentes del panel admin
  client/                → Componentes de la app del alumno
  ui/                    → shadcn/ui components
lib/supabase/            → Clientes Supabase (server/browser)
supabase/migrations/     → SQL: schema + RLS + seed
```
