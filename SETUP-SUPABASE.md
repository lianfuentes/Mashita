# Configurar el backend (Supabase)

El sitio necesita un proyecto de [Supabase](https://supabase.com) (gratis, sin
tarjeta) para que las reservas, horarios y fotos se guarden de verdad y el
panel de administración pueda verlas desde cualquier dispositivo.

## 1. Crear el proyecto

1. Entra a [supabase.com](https://supabase.com) y crea una cuenta gratis.
2. Click **New project**. Elige cualquier nombre y contraseña de base de datos
   (guárdala, no la necesitarás para esto pero es buena práctica).
3. Espera ~1 minuto mientras se aprovisiona el proyecto.

## 2. Correr el script de base de datos

1. En el menú lateral, ve a **SQL Editor → New query**.
2. Abre el archivo [`supabase/schema.sql`](supabase/schema.sql) de este repo,
   copia **todo** el contenido y pégalo en el editor.
3. Click **Run**. Esto crea las tablas, la seguridad (RLS), el bucket de fotos
   y carga los servicios/galería de ejemplo.

## 3. Crear tu usuario de administrador

1. Ve a **Authentication → Users → Add user**.
2. Ingresa tu email y una contraseña.
3. Marca **Auto Confirm User** (para no tener que verificar el email).
4. Con ese email/contraseña vas a entrar a `admin.html`.

## 4. Obtener las credenciales

1. Ve a **Settings → API**.
2. Copia el **Project URL**.
3. Copia la clave **anon public** (⚠️ NO la `service_role`, esa es secreta y
   nunca debe usarse en el navegador).

## 5. Conectar el sitio

Abre [`js/config.js`](js/config.js) y reemplaza:

```js
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU-ANON-KEY-PUBLICA';
```

por tus valores reales. La clave "anon" está diseñada para exponerse
públicamente en el frontend — la seguridad real la dan las políticas RLS que
ya quedaron configuradas por el script SQL (los clientes solo pueden crear
reservas, no leer las de otros; solo el admin autenticado puede ver/editar
todo).

## 6. Probar

1. Abre el sitio (`serve.ps1` en local, o donde lo tengas publicado).
2. Haz una reserva de prueba.
3. Entra a `admin.html`, inicia sesión con el usuario que creaste en el paso 3.
4. Deberías ver la reserva en la pestaña **Reservas**.

## ¿Qué hace cada tabla?

| Tabla | Para qué sirve | Quién puede leer | Quién puede escribir |
|---|---|---|---|
| `settings` | Horario, datos del barbero, datos bancarios | Cualquiera | Solo admin |
| `blocked_dates` | Feriados/días puntuales cerrados | Cualquiera | Solo admin |
| `services` | Servicios, precios, fotos | Cualquiera | Solo admin |
| `gallery` | Fotos de la galería | Cualquiera | Solo admin |
| `bookings` | Reservas con datos del cliente | Solo admin | Clientes pueden crear, solo admin lee/edita/borra |
| `bookings_public` (vista) | Solo fecha/hora/duración, sin datos personales | Cualquiera (para calcular horas disponibles) | — |

## Costos

El plan gratuito de Supabase incluye 500MB de base de datos y 1GB de
almacenamiento de archivos — más que suficiente para una barbería. No se
requiere tarjeta de crédito para el plan gratuito.
