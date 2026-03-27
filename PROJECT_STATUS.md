# Said Coach — Project Status

## ¿Qué es esta app?
Web app para que Said Coach (entrenador personal) cree y gestione programas de entrenamiento para sus alumnos. Los alumnos acceden con su propio login, ven sus programas asignados y registran sus entrenamientos.

---

## URLs importantes
| Recurso | URL |
|---------|-----|
| **App en producción** | https://crea-entrenamientos.vercel.app |
| **Repositorio GitHub** | https://github.com/nesdimuk/creaEntrenamientos.git |
| **Supabase proyecto** | https://kgckhakxvwloigzkfbyd.supabase.co |
| **Vercel dashboard** | https://vercel.com (login con GitHub) |

---

## Estado actual

### ✅ Funciona hoy
- Login con email/contraseña para el trainer (Said)
- Magic link (sin contraseña) para alumnos
- Invitación por email a alumnos nuevos y existentes
- Emails enviados via Gmail SMTP (App Password configurado en Supabase)
- Dashboard del trainer con resumen de alumnos y programas
- CRUD completo de clientes (crear, ver, editar)
- CRUD completo de programas de entrenamiento
- Constructor de sesiones (WorkoutBuilder): agregar ejercicios, series, reps, descanso
- Biblioteca de ejercicios (22 ejercicios globales incluidos + crear propios)
- Asignación de programas a alumnos
- Vista del alumno: mis programas, detalle de sesión, video de ejercicio
- Registro de entrenamiento: sets, reps, peso, notas por ejercicio
- Grabación de notas por voz (Web Speech API, funciona en Chrome)
- Branding personalizable: nombre, colores (CSS variables inyectadas en la vista del alumno)
- PWA manifest (agregar a pantalla de inicio en móvil)
- Deploy automático desde GitHub a Vercel

### ⏳ Pendiente / No probado al 100%
- Flujo completo cliente en producción (magic link → `/auth/confirm` → `/mis-programas`) — fix reciente, pendiente test final
- Subida de logo (Supabase Storage configurado pero no testeado en prod)
- Historial de entrenamientos del alumno
- Panel de progreso/estadísticas para el trainer

---

## Stack técnico

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Next.js | 16.2.1 | Framework principal (App Router + Turbopack) |
| React | 19.2.4 | UI |
| TypeScript | — | Lenguaje |
| Tailwind CSS | v4 | Estilos |
| shadcn/ui | base-ui variant | Componentes UI |
| Supabase JS | ^2.100.1 | Cliente de base de datos y auth |
| @supabase/ssr | ^0.9.0 | Soporte SSR para Supabase |
| React Hook Form | ^7.72.0 | Formularios |
| Zod | ^4.3.6 | Validación de schemas |
| Lucide React | ^1.7.0 | Íconos |
| Vercel | — | Deploy y hosting |

---

## Gotchas técnicos importantes (problemas ya resueltos)

### 1. `proxy.ts` en vez de `middleware.ts`
Next.js 16 deprecó `middleware.ts`. Usar **`proxy.ts`** en la raíz y la función exportada **debe llamarse `proxy`** (no `middleware`).
```ts
// proxy.ts
export async function proxy(request: NextRequest) { ... }
export const config = { matcher: [...] }
```

### 2. `buttonVariants` en Server Components
`buttonVariants` de shadcn está dentro de un archivo `"use client"` y **no se puede importar en Server Components**.
✅ Solución: está extraído en `lib/button-variants.ts` (archivo puro, sin directiva client).
Todos los Server Components importan desde ahí.

### 3. `asChild` no funciona en shadcn/ui (base-ui variant)
La variante `base-ui` de shadcn usa `@base-ui/react/button` que **no soporta la prop `asChild`**.
✅ Solución: usar `buttonVariants` + `<Link>` directamente:
```tsx
<Link href="/ruta" className={buttonVariants({ variant: 'default' })}>
  Texto
</Link>
```

### 4. Auth confirm — página client-side
El magic link redirige a `/auth/confirm`. Esta página es `"use client"` y maneja:
- `?code=` → `exchangeCodeForSession(code)`
- `#access_token=` → `setSession({ access_token, refresh_token })`
- Sesión ya activa → redirect directo
- Timeout de 10s con mensaje de error
Luego verifica si es trainer (`trainer_profile`) o alumno y redirige a `/dashboard` o `/mis-programas`.

### 5. Invitación de alumnos
- **Alumno nuevo**: `inviteUserByEmail()` (admin SDK) — envía email de invitación
- **Alumno existente**: `signInWithOtp()` con anon client — envía magic link
- ⚠️ `generateLink()` NO envía el email, solo genera la URL. Usar `signInWithOtp`.

### 6. Rate limit de emails Supabase
Supabase gratis tiene límite de 3 emails/hora por dirección.
✅ Solución: configurar SMTP propio en Supabase → Authentication → SMTP Settings.
**Configuración actual**: Gmail SMTP con App Password:
- Host: `smtp.gmail.com`, Port: `587`
- User: Gmail de Said Coach
- Password: Google App Password (generada en myaccount.google.com/apppasswords)
- Rate limit sube a 30 emails/hora

### 7. `window.location.href` en vez de `router.push()`
`router.push()` + `router.refresh()` causaba errores de "Failed to fetch" en login.
✅ Solución: usar `window.location.href = '/dashboard'` para redirecciones post-login.

### 8. Íconos de lucide-react
`Youtube` no existe en lucide-react. Usar `ExternalLink` como reemplazo para links de video.

---

## Estructura de archivos

```
creaEntrenamientos/
├── proxy.ts                          # Middleware de roles (trainer vs alumno)
├── app/
│   ├── layout.tsx                    # Root layout (fuentes, metadata)
│   ├── page.tsx                      # Redirect a /login
│   ├── globals.css                   # Estilos globales + Tailwind
│   ├── (auth)/
│   │   ├── layout.tsx                # Layout minimal para auth
│   │   └── login/page.tsx            # Login email/contraseña + magic link
│   ├── (admin)/                      # Solo para el trainer (Said)
│   │   ├── layout.tsx                # Sidebar + nav móvil + branding
│   │   ├── dashboard/page.tsx        # Resumen: alumnos, programas
│   │   ├── clientes/
│   │   │   ├── page.tsx              # Lista de alumnos
│   │   │   ├── new/page.tsx          # Crear alumno
│   │   │   └── [id]/page.tsx         # Detalle alumno + enviar invitación
│   │   ├── programas/
│   │   │   ├── page.tsx              # Lista de programas
│   │   │   ├── new/page.tsx          # Crear programa
│   │   │   └── [id]/edit/page.tsx    # Editor de programa + WorkoutBuilder
│   │   ├── ejercicios/page.tsx       # Biblioteca de ejercicios
│   │   └── settings/page.tsx        # Branding (nombre, colores, logo)
│   ├── (client)/                     # Solo para alumnos
│   │   ├── layout.tsx                # Layout con CSS variables de branding
│   │   ├── mis-programas/
│   │   │   ├── page.tsx              # Lista de programas asignados
│   │   │   └── [programId]/
│   │   │       ├── page.tsx          # Semanas y sesiones del programa
│   │   │       └── [workoutId]/page.tsx  # Sesión activa + registro
│   │   └── programas/[id]/[workoutId]/page.tsx  # Vista readonly
│   ├── auth/
│   │   └── confirm/page.tsx          # Maneja callback de magic link
│   └── api/
│       ├── invite-client/route.ts    # Envía invitación/magic link al alumno
│       └── auth/callback/route.ts   # Exchange code PKCE → session
├── components/
│   ├── ui/                           # shadcn/ui primitives
│   │   ├── button.tsx, input.tsx, label.tsx
│   │   ├── textarea.tsx, select.tsx, badge.tsx
│   │   ├── card.tsx, tabs.tsx, dialog.tsx
│   ├── admin/
│   │   ├── WorkoutBuilder.tsx        # Constructor de sesiones (complejo)
│   │   ├── BrandingForm.tsx          # Form de colores y nombre
│   │   ├── SendInviteButton.tsx      # Botón enviar invitación
│   │   ├── AssignProgramButton.tsx   # Asignar programa a alumno
│   │   ├── NewExerciseButton.tsx     # Crear ejercicio personalizado
│   │   └── LogoutButton.tsx          # Logout del trainer
│   └── client/
│       ├── WorkoutSession.tsx        # Registro de entrenamiento (sets, voz)
│       └── ClientLogoutButton.tsx    # Logout del alumno
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Cliente Supabase browser-side
│   │   └── server.ts                 # Cliente Supabase server-side (SSR)
│   ├── button-variants.ts            # CVA variants (importar aquí en Server Components)
│   └── utils.ts                      # cn() helper (clsx + tailwind-merge)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql    # Schema completo + RLS + seed ejercicios
└── public/
    └── manifest.json                 # PWA manifest
```

---

## Modelo de datos

```sql
trainer_profile   → user_id, brand_name, logo_url, primary_color, accent_color
clients           → trainer_id, user_id, full_name, email, notes, status
exercises         → trainer_id (null=global), name, category, muscle_group, video_url, description
programs          → trainer_id, title, description, duration_weeks, goal, difficulty
workouts          → program_id, title, week_number, day_number, notes, estimated_duration_min
workout_exercises → workout_id, exercise_id, order_index, sets, reps (text), weight (text), rest_seconds, notes
client_programs   → client_id, program_id, start_date, status
workout_logs      → client_id, workout_id, date, completed_at, notes_text, effort_rating
exercise_logs     → workout_log_id, workout_exercise_id, set_number, reps_done, weight_done, notes
```

**Notas:**
- `reps` y `weight` son `text` → soporta "8-12", "AMRAP", "RPE 8", "peso corporal"
- RLS activo: alumnos solo ven sus propios datos; trainer solo ve los suyos
- 22 ejercicios globales incluidos en el seed

---

## Variables de entorno (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=          # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Clave anónima pública
SUPABASE_SERVICE_ROLE_KEY=         # Clave de servicio (solo server-side)
NEXT_PUBLIC_APP_URL=               # URL de la app (https://crea-entrenamientos.vercel.app en prod)
```

⚠️ `SUPABASE_SERVICE_ROLE_KEY` nunca debe exponerse al cliente. Solo se usa en API routes.

---

## Cómo continuar sin romper nada

### Antes de hacer cambios
```bash
# Crear una rama nueva para cada mejora
git checkout -b feature/nombre-de-la-mejora

# Hacer los cambios...

# Probar localmente
npm run dev

# Si funciona, pushear
git add .
git commit -m "descripción del cambio"
git push origin feature/nombre-de-la-mejora
```

### Deploy a producción
Solo hacer merge a `main` cuando esté probado:
```bash
git checkout main
git merge feature/nombre-de-la-mejora
git push origin main
# Vercel deploya automáticamente desde main
```

### Probar localmente
```bash
npm run dev
# Abrir http://localhost:3000
# Login con marcelosaid.ep@gmail.com
```

---

## Próximas mejoras sugeridas

### Prioridad alta
- [ ] Historial de entrenamientos del alumno (ver sesiones pasadas completadas)
- [ ] Panel de progreso del alumno para el trainer (ver logs de sus alumnos)
- [ ] Marcar sesión como completada ✅

### Prioridad media
- [ ] Subida de logo (ya tiene la UI, falta probar Supabase Storage en prod)
- [ ] Notificaciones de recordatorio de entrenamiento (email o push)
- [ ] Comentarios del trainer en un entrenamiento completado
- [ ] Plantillas de programas (clonar un programa existente)

### Prioridad baja
- [ ] Dominio personalizado (ej: app.saidcoach.com) — comprar en Namecheap ~$12/año
- [ ] Estadísticas: peso levantado total, sesiones completadas, racha
- [ ] Modo oscuro
- [ ] Exportar programa en PDF para el alumno

---

## Supabase — configuraciones aplicadas

- **URL Configuration**: Site URL = `https://crea-entrenamientos.vercel.app`
- **Redirect URLs**: `https://crea-entrenamientos.vercel.app/auth/confirm`
- **SMTP**: Gmail (`smtp.gmail.com:587`) con App Password
- **RLS**: Activado en todas las tablas

---

*Última actualización: 2026-03-26*
