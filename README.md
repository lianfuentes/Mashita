# Mashita Barber — Sitio web + reservas + panel de administración

Sitio web (HTML/CSS/JS puro, sin frameworks ni build) para una barbería
especializada en cortes modernos para público joven: landing con servicios,
galería y barbero destacado, sistema de reserva de horas con calendario,
pago (tarjeta o transferencia), y un **panel de administración** para
gestionar horarios, reservas, fotos y comunicarse con los clientes por
WhatsApp.

El backend (reservas, horarios, fotos, login del admin) corre en
[Supabase](https://supabase.com) (gratis) — el frontend sigue siendo 100%
estático y se despliega igual que antes (GitHub Pages, Netlify, FTP, etc.).

## ⚙️ Antes de usarlo: configura Supabase

**El sitio no funcionará correctamente hasta que completes este paso.**
Sigue la guía en [`SETUP-SUPABASE.md`](SETUP-SUPABASE.md) (10-15 minutos,
gratis, sin tarjeta). En resumen: creas un proyecto de Supabase, corres
`supabase/schema.sql`, creas tu usuario admin, y pegas la URL + anon key en
`js/config.js`.

Mientras no lo hagas, el sitio público muestra datos de ejemplo (fallback) y
el panel de administración muestra un aviso pidiendo completar la configuración.

## Estructura del proyecto

```
index.html            → sitio público
admin.html            → panel de administración (login + dashboard)
css/styles.css        → estilos del sitio público (tema oscuro, paleta gris/plata)
css/admin.css         → estilos del panel de administración
js/config.js          → URL + anon key de tu proyecto Supabase (completar)
js/supabase-client.js → inicializa el cliente de Supabase
js/data.js            → testimonios (estáticos) + datos de fallback
js/app.js             → lógica del sitio público: calendario, wizard de reserva, pagos
js/admin.js           → lógica del panel: login, horarios, reservas, fotos, WhatsApp
supabase/schema.sql   → script SQL: tablas, seguridad (RLS), datos iniciales
serve.ps1             → servidor estático mínimo en PowerShell para probar localmente
SETUP-SUPABASE.md     → guía paso a paso para configurar el backend
```

## Probarlo en local

Este equipo no tiene Node ni Python instalados, así que se incluye un servidor
estático mínimo en PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Luego abre `http://localhost:8791/` (sitio público) o
`http://localhost:8791/admin.html` (panel de administración). (Si tienes Node
o Python instalados, también puedes usar `npx serve` o `python -m http.server`).

## Cómo publicarlo

Sigue siendo un sitio estático (Supabase se conecta desde el navegador, no
requiere servidor propio):

### Opción A — GitHub Pages (gratis, usando este mismo repo)
1. Ve a **Settings → Pages** en este repositorio.
2. En "Source" selecciona la rama `main` y carpeta `/ (root)`.
3. GitHub publica el sitio en `https://tuusuario.github.io/mashita-barber/`.

### Opción B — Netlify / Vercel (arrastrar y soltar)
1. Entra a [app.netlify.com/drop](https://app.netlify.com/drop) (o Vercel → "Add New Project" → "Import Git Repository").
2. Listo, obtienes una URL pública en segundos.

### Opción C — Hosting tradicional (cPanel / FTP)
1. Descarga este repositorio (`Code → Download ZIP`) o clónalo.
2. Sube todos los archivos a `public_html/` (o `www/`) por FTP/SFTP.

## El panel de administración (`admin.html`)

Accesible también desde un link discreto "Admin" al pie del sitio público.
Requiere iniciar sesión con el usuario que creaste en Supabase (ver
`SETUP-SUPABASE.md` paso 3).

- **🗓️ Horarios**: hora de apertura/cierre, días cerrados de la semana, y días
  puntuales bloqueados (feriados, vacaciones).
- **📋 Reservas**: todas las reservas de todos los clientes (no solo del mismo
  navegador), con su estado de pago y de la reserva editables, botón de
  eliminar, y botones de **WhatsApp** (confirmación, recordatorio o mensaje
  libre) que abren WhatsApp con el mensaje ya escrito, listo para enviar.
- **🖼️ Fotos**: subir/reemplazar la foto del barbero y la foto de cada
  servicio — quedan alojadas en Supabase Storage y se ven al instante en el
  sitio público.

## Qué es real y qué es demostración

### 💳 Pagos
El formulario de tarjeta valida formato (Luhn, vencimiento, CVV) pero **no
cobra dinero real** — es una simulación marcada como "Modo demostración". La
transferencia bancaria solo muestra los datos y marca la reserva como
"pendiente de confirmación".

**Para cobrar de verdad** necesitas integrar una pasarela de pago con tu
propia cuenta comerciante (Transbank Webpay Plus, Stripe o MercadoPago), lo
que requiere un pequeño backend adicional que guarde las credenciales secretas
y confirme el pago — no se puede hacer solo con HTML/JS en el navegador de
forma segura.

### 📲 Mensajes a clientes
Los botones de WhatsApp en el panel **sí son reales**: abren WhatsApp con el
número del cliente y el mensaje ya escrito — el admin solo aprieta enviar. No
son mensajes automáticos (eso requeriría una cuenta de pago con Twilio o
WhatsApp Business API); es un envío manual asistido, gratis.

## Dónde guarda los datos

Reservas, horarios, servicios, fotos y galería viven en la base de datos de
Supabase (ver tabla de permisos en `SETUP-SUPABASE.md`). El navegador de cada
cliente además guarda un recibo local de "Mis reservas" (solo las que él
mismo hizo) en `localStorage`, únicamente como comodidad — no es la fuente de
verdad, que es la base de datos.

## Personalizar el contenido

- **Servicios, horario, fotos, datos bancarios**: desde `admin.html` (fotos y
  horario) o directamente en las tablas de Supabase (Table Editor) para
  precios/descripciones.
- **Testimonios, textos de la landing, colores**: en `js/data.js`,
  `index.html` y las variables al inicio de `css/styles.css`
  (`:root { --bg, --accent, ... }`).

Las fotos de ejemplo son de bancos de imágenes libres (Unsplash) con licencia
de uso comercial — reemplázalas desde el panel de administración por fotos
reales del local y del barbero cuando el negocio esté operativo.
