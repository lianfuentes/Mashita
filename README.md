# Mashita Barber — Sitio web + reservas online

Sitio web estático (HTML/CSS/JS puro, sin frameworks ni build) para una barbería
especializada en cortes modernos para público joven: landing con servicios,
galería y barbero destacado, más un sistema de reserva de horas con calendario,
recordatorios y pago (tarjeta o transferencia).

## Estructura del proyecto

```
index.html      → toda la estructura del sitio
css/styles.css  → estilos (tema oscuro, paleta gris/plata, tipografías Anton/Space Grotesk)
js/data.js      → servicios, testimonios, galería, horario y datos bancarios (edítalo para personalizar)
js/app.js       → lógica: calendario de disponibilidad, wizard de reserva, pagos, recordatorios
serve.ps1       → servidor estático mínimo en PowerShell para probar el sitio localmente
```

Es un sitio 100% estático: no requiere Node, Python ni ningún build previo.

## Probarlo en local

Este equipo no tiene Node ni Python instalados, así que se incluye un servidor
estático mínimo en PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Luego abre `http://localhost:8791/` en el navegador. (Si tienes Node o Python
instalados, también puedes usar `npx serve` o `python -m http.server` normalmente).

## Cómo publicarlo

### Opción A — GitHub Pages (gratis, usando este mismo repo)
1. Ve a **Settings → Pages** en este repositorio.
2. En "Source" selecciona la rama `main` y carpeta `/ (root)`.
3. GitHub publica el sitio en `https://tuusuario.github.io/mashita-barber/`.

### Opción B — Netlify / Vercel (arrastrar y soltar)
1. Entra a [app.netlify.com/drop](https://app.netlify.com/drop) (o Vercel → "Add New Project" → "Import Git Repository" apuntando a este repo).
2. Listo, obtienes una URL pública en segundos. Puedes conectar tu propio dominio después.

### Opción C — Hosting tradicional (cPanel / FTP)
1. Descarga este repositorio (`Code → Download ZIP`) o clónalo.
2. Sube `index.html`, `css/` y `js/` a `public_html/` (o `www/`) por FTP/SFTP.
3. Asegúrate que `index.html` quede en la raíz de ese directorio.

No hay variables de entorno ni configuración de servidor que ajustar: el sitio
funciona apenas los archivos quedan servidos por HTTP(S). `serve.ps1` es solo
para desarrollo local, no lo necesitas en el hosting final.

## Qué es real y qué es demostración

Este sitio es completamente funcional en el navegador (calendario, disponibilidad
de horas, formulario de contacto, generación de evento `.ics` para agendar, guardado
de reservas), pero dos partes están **simuladas** porque requieren credenciales e
infraestructura propias del negocio:

### 💳 Pagos
El formulario de tarjeta valida formato (Luhn, vencimiento, CVV) pero **no cobra
dinero real** — es una simulación claramente marcada como "Modo demostración".
La transferencia bancaria solo muestra los datos y marca la reserva como
"pendiente de confirmación".

**Para cobrar de verdad** necesitas integrar una pasarela de pago con tu propia
cuenta comerciante, por ejemplo:
- **Transbank Webpay Plus** (la más usada en Chile para tarjeta/débito) — requiere backend.
- **Stripe** o **MercadoPago** — alternativas con buen soporte para Latinoamérica.

Cualquiera de estas opciones requiere un pequeño backend (Node, PHP, etc.) que
guarde las credenciales secretas y confirme el pago — no se puede hacer solo
con HTML/JS en el navegador de forma segura.

### 📲 Recordatorios
Al confirmar una reserva, la app "simula" el envío de un recordatorio por
WhatsApp/SMS. En producción, para enviarlos de verdad necesitas:
- Un backend con un programador de tareas (cron) que revise las reservas próximas.
- Una API de mensajería: **WhatsApp Business Cloud API**, **Twilio** (SMS/WhatsApp)
  o **SendGrid** (email).

## Dónde guarda los datos hoy

Las reservas se guardan en el `localStorage` del navegador de cada visitante
(clave `mashita_bookings_v1`), sin backend ni base de datos. Esto significa que:
- Cada visitante solo ve **sus propias** reservas en "Mis reservas".
- El barbero/dueño del local no tiene panel para ver todas las reservas de todos los clientes.

**Para producción real** (que el negocio pueda ver y administrar todas las horas)
se necesita agregar un backend con base de datos (por ejemplo, un pequeño servidor
Node/Express + una base de datos como PostgreSQL o Supabase/Firebase), que además
sería el que dispare pagos y recordatorios reales.

## Personalizar el contenido

Edita `js/data.js` para cambiar servicios, precios, horario de atención, datos
bancarios y las fotos de la galería/testimonios. Edita las secciones de `index.html`
para cambiar textos, nombre del barbero, dirección y redes sociales. Los colores y
tipografía se controlan desde las variables al inicio de `css/styles.css`
(`:root { --bg, --accent, ... }`).

Las fotos actuales son de bancos de imágenes libres (Unsplash) con licencia de uso
comercial, usadas como ilustración de ejemplo — reemplázalas por fotos reales del
local y del barbero cuando el negocio esté operativo.
