# Guía de Despliegue en Producción — AURE Bot
**Meta: Bot activo en WhatsApp hoy | Costo: $0/mes**

---

## STACK DE DESPLIEGUE (todo gratis, sin expiración)

| Componente | Servicio | Por qué |
|---|---|---|
| Backend Node.js | **Render** (free) + **cron-job.org** | Gratis, el ping cada 10 min lo mantiene siempre activo |
| Base de datos PostgreSQL | **Neon** | 500 MB gratis, sin fecha de expiración |
| Redis (colas) | **Upstash** | 10.000 comandos/día gratis, sin expiración |
| Frontend dashboard | **Vercel** | Gratis permanente |

---

## ESTADO ACTUAL

| Fase | Estado |
|---|---|
| ✅ Código en GitHub | Listo |
| ✅ PostgreSQL en Neon | Listo |
| ✅ Redis en Upstash | Listo |
| ⬜ Backend en Render | Pendiente |
| ⬜ Ping en cron-job.org | Pendiente |
| ⬜ WhatsApp API en Meta | Pendiente |
| ⬜ OpenAI API Key | Pendiente |
| ⬜ Frontend en Vercel | Pendiente |
| ⬜ Prueba final | Pendiente |

---

## FASE 2 — Backend en Render (20 min)

### Paso 2.1 — Crear cuenta en Render

1. Ve a **https://render.com**
2. Click en **"Get Started for Free"**
3. Click en **"Sign up with GitHub"** → autoriza el acceso
4. No requiere tarjeta de crédito

### Paso 2.2 — Crear el Web Service

1. En el dashboard de Render, click en **"New +"** → **"Web Service"**
2. Selecciona **"Build and deploy from a Git repository"**
3. Click en **"Connect"** junto al repositorio **`aure-bot`**
   - Si no aparece, click en **"Configure account"** y autoriza el repo
4. Rellena la configuración:
   - **Name:** `aure-backend`
   - **Region:** `Oregon (US West)`
   - **Branch:** `main`
   - **Root Directory:** `backend` ← **escríbelo exactamente así**
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free` ← asegúrate que esté seleccionado

### Paso 2.3 — Agregar variables de entorno

Baja hasta **"Environment Variables"** y agrega cada una con **"Add Environment Variable"**:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `DATABASE_URL` | *(pega la connection string de Neon)* |
| `META_VERIFY_TOKEN` | `aure_webhook_secreto_2024` |
| `META_ACCESS_TOKEN` | `pendiente` *(actualizas en Fase 3)* |
| `WHATSAPP_PHONE_NUMBER_ID` | `pendiente` *(actualizas en Fase 3)* |
| `OPENAI_API_KEY` | `pendiente` *(actualizas en Fase 4)* |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `REDIS_HOST` | `brave-worm-196694.upstash.io` |
| `REDIS_PORT` | `6379` |
| `REDIS_PASSWORD` | *(password de Upstash)* |

5. Click en **"Create Web Service"**
6. Render empieza el deploy — tarda 3-5 minutos
7. Espera hasta ver en los logs:
   ```
   [DB] Conexión exitosa a PostgreSQL
   [Server] Corriendo en http://localhost:3001
   ```

### Paso 2.4 — Obtener tu URL pública

Una vez deployado, en la parte superior verás tu URL:
```
https://aure-backend.onrender.com
```
Guarda esta URL — la usarás en Meta, cron-job.org y Vercel.

### Paso 2.5 — Verificar que el backend funciona

Abre en el navegador: `https://aure-backend.onrender.com/health`

Respuesta esperada:
```json
{"status":"ok","timestamp":"2026-11-10T..."}
```

Si ves esto, el backend está vivo. ✅

### Paso 2.6 — cron-job.org para mantenerlo activo

Render gratis duerme tras 15 minutos sin actividad. Este paso lo mantiene siempre despierto.

1. Ve a **https://cron-job.org**
2. Click en **"Sign up"** → crea cuenta gratuita con tu correo
3. Una vez dentro, click en **"CREATE CRONJOB"**
4. Rellena:
   - **Title:** `AURE Bot Keep Alive`
   - **URL:** `https://aure-backend.onrender.com/health`
   - **Schedule:** selecciona **"Every 10 minutes"**
5. Click en **"CREATE"**

Listo — el backend nunca se duerme. ✅

---

## FASE 3 — WhatsApp Business API en Meta (30 min)

### Paso 3.1 — Acceder a Meta Business Suite

1. Ve a **https://business.facebook.com**
2. Inicia sesión con tu cuenta de Facebook personal
3. Si no tienes cuenta de negocio, click en **"Crear cuenta"**:
   - Nombre: `Aure Joyería`
   - Correo: `infinityescorcia@gmail.com`

### Paso 3.2 — Crear App en Meta for Developers

1. Ve a **https://developers.facebook.com**
2. Arriba a la derecha: **"Mis Apps"** → **"Crear app"**
3. Tipo de app: selecciona **"Business"** → **"Siguiente"**
4. Rellena:
   - **Nombre:** `AURE Bot`
   - **Correo:** `infinityescorcia@gmail.com`
   - **Cuenta Business:** selecciona `Aure Joyería`
5. Click en **"Crear app"**

### Paso 3.3 — Agregar WhatsApp

1. En el dashboard de tu app, busca **"WhatsApp"** en el panel de productos
2. Click en **"Configurar"**
3. Click en **"Empezar"** → acepta los términos
4. En **"Seleccionar o crear cuenta de WhatsApp Business"**:
   - Click en **"Crear nueva cuenta de WhatsApp Business"**
   - Nombre: `Aure Joyería`
   - Zona horaria: `America/Bogota`
5. Click en **"Continuar"**

### Paso 3.4 — Elegir número para el bot

**CAMINO A — Número de prueba de Meta (recomendado para testear hoy)**

Meta te da un número sandbox gratis.

1. En **WhatsApp** → **"Configuración de la API"**
2. Verás el número de prueba ya listo (ej. `+1 555-XXX-XXXX`)
3. En la sección **"Para"**, agrega tu número personal:
   - Click en **"Agregar número de teléfono"**
   - Escribe tu número: `+57XXXXXXXXXX`
   - Verifica con el código que te llega por WhatsApp
4. Con esto el bot puede responderte directamente a ti para pruebas

---

**CAMINO B — Tu número real de Aure**

Solo si el número **no tiene WhatsApp Business App instalada actualmente**.

1. En **WhatsApp** → **"Configuración de la API"** → **"Agregar número de teléfono"**
2. **Nombre de perfil:** `Aure Joyería`
3. **Zona horaria:** `America/Bogota`
4. **Categoría:** `Shopping and retail`
5. Click en **"Siguiente"** → ingresa `+57XXXXXXXXXX` → verifica por SMS
6. Click en **"Finalizar"**

---

### Paso 3.5 — Obtener Phone Number ID

1. En **WhatsApp** → **"Configuración de la API"**
2. Selecciona tu número en el desplegable
3. Copia el **Phone Number ID** (número de ~15 dígitos)
4. Ve a Render → `aure-backend` → pestaña **"Environment"**
5. Actualiza: `WHATSAPP_PHONE_NUMBER_ID` = *(el número copiado)*

### Paso 3.6 — Generar Token Permanente (nunca expira)

**Crear Usuario del Sistema:**

1. Ve a **https://business.facebook.com/settings**
2. Menú izquierdo → **"Usuarios"** → **"Usuarios del sistema"**
3. Click en **"Agregar"** → Nombre: `aure-bot` → Rol: **Administrador**
4. Click en **"Crear usuario del sistema"**

**Dar acceso al App:**

1. Con `aure-bot` seleccionado → click en **"Asignar activos"**
2. Panel izquierdo → **"Apps"** → selecciona **"AURE Bot"**
3. Activa **"Control total"** → **"Guardar cambios"**

**Generar el Token:**

1. Con `aure-bot` seleccionado → click en **"Generar token nuevo"**
2. Selecciona **"AURE Bot"** → **Expiración:** `Nunca`
3. Activa estos permisos:
   - `whatsapp_business_messaging` ✅
   - `whatsapp_business_management` ✅
   - `pages_messaging` ✅
   - `instagram_basic` ✅
   - `instagram_manage_messages` ✅
4. Click en **"Generar token"** → **copia el token ahora** (empieza con `EAA...`)

5. Ve a Render → `aure-backend` → **"Environment"**
6. Actualiza: `META_ACCESS_TOKEN` = *(el token copiado)*

### Paso 3.7 — Configurar Webhook

1. En tu app Meta → **"Configuración"** → **"Básica"**
2. Verifica que el modo diga **"Live"** — si dice "Development", cámbialo a **Live**
3. Ve a **WhatsApp** → **"Configuración"** → sección **"Webhooks"** → **"Editar"**
4. Rellena:
   - **URL de devolución de llamada:** `https://aure-backend.onrender.com/webhook`
   - **Token de verificación:** `aure_webhook_secreto_2024`
5. Click en **"Verificar y guardar"**

> Si da error: verifica que el servicio en Render esté corriendo y que `META_VERIFY_TOKEN` sea exactamente `aure_webhook_secreto_2024`.

### Paso 3.8 — Suscribirse al campo messages

1. En la sección **"Webhooks"**, busca el campo **`messages`**
2. Click en **"Suscribirse"** ✅ → **"Listo"**

**Redeploy en Render** para aplicar los nuevos tokens:
- Render → `aure-backend` → **"Manual Deploy"** → **"Deploy latest commit"**

---

## FASE 4 — OpenAI API Key (5 min)

### Paso 4.1 — Crear la API Key

1. Ve a **https://platform.openai.com**
2. Crea una cuenta o inicia sesión
3. Menú izquierdo → **"API keys"** → **"+ Create new secret key"**
4. Nombre: `aure-production` → **"Create secret key"**
5. **Copia la clave ahora** — empieza con `sk-...` — no se vuelve a mostrar

### Paso 4.2 — Agregar créditos (obligatorio)

1. Menú izquierdo → **"Billing"** → **"Add payment method"**
2. **"Add to credit balance"** → agrega mínimo **$5 USD**

### Paso 4.3 — Agregar a Render

1. Render → `aure-backend` → pestaña **"Environment"**
2. Actualiza: `OPENAI_API_KEY` = *(tu clave)*
3. Render hace redeploy automático al guardar

---

## FASE 5 — Frontend en Vercel (10 min)

### Paso 5.1 — Crear cuenta

1. Ve a **https://vercel.com**
2. Click en **"Sign Up"** → **"Continue with GitHub"**

### Paso 5.2 — Importar el proyecto

1. Dashboard → **"Add New..."** → **"Project"**
2. Selecciona el repositorio `aure-bot` → **"Import"**
3. **Root Directory** → click en **"Edit"** → escribe `frontend` → **"Continue"**
4. Vercel detecta Vite automáticamente (no cambies nada más)

### Paso 5.3 — Variable de entorno

En **"Environment Variables"** antes de hacer deploy:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://aure-backend.onrender.com` |

### Paso 5.4 — Deploy

Click en **"Deploy"** → tarda ~2 minutos → obtienes tu URL:
```
https://aure-bot-tuusuario.vercel.app
```

### Paso 5.5 — Actualizar FRONTEND_URL en Render

1. Render → `aure-backend` → **"Environment"**
2. Agrega: `FRONTEND_URL` = `https://aure-bot-tuusuario.vercel.app`

---

## FASE 6 — Prueba Final (10 min)

### Paso 6.1 — Verificar variables en Render

Ve a Render → `aure-backend` → **"Environment"** y confirma que ninguna diga "pendiente":

| Variable | Debe contener |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `FRONTEND_URL` | `https://aure-bot-tuusuario.vercel.app` |
| `DATABASE_URL` | `postgresql://...neon.tech/...` |
| `META_VERIFY_TOKEN` | `aure_webhook_secreto_2024` |
| `META_ACCESS_TOKEN` | `EAAxxxxx...` |
| `WHATSAPP_PHONE_NUMBER_ID` | número de ~15 dígitos |
| `OPENAI_API_KEY` | `sk-...` |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `REDIS_HOST` | `brave-worm-196694.upstash.io` |
| `REDIS_PORT` | `6379` |
| `REDIS_PASSWORD` | cadena larga |

### Paso 6.2 — Health check

Abre: `https://aure-backend.onrender.com/health`

Respuesta esperada: `{"status":"ok","timestamp":"..."}`

### Paso 6.3 — Prueba real

1. Abre WhatsApp en tu teléfono
2. Escribe al número de Aure (o al número de prueba si usaste Camino A)
3. Envía: `Hola`
4. Espera 5-10 segundos → el bot responde ✅

### Paso 6.4 — Dashboard en vivo

Abre `https://aure-bot-tuusuario.vercel.app` — la conversación aparece en tiempo real.

---

## SOLUCIÓN DE PROBLEMAS

| Problema | Causa probable | Solución |
|---|---|---|
| `/health` no carga | Deploy fallido o error en código | Render → tu servicio → pestaña **"Logs"** → busca línea roja |
| Webhook retorna 403 | `META_VERIFY_TOKEN` no coincide | Verifica que sea exactamente `aure_webhook_secreto_2024` sin espacios |
| Bot no responde mensajes | `META_ACCESS_TOKEN` incorrecto | Regenera token en Meta Business → Usuarios del sistema |
| Error de base de datos | `DATABASE_URL` mal copiada | Copia de nuevo desde Neon → tu proyecto → "Connection string" |
| Error de Redis al arrancar | Credenciales Upstash incorrectas | Verifica host, port y password en Upstash → tu base → "Details" |
| "insufficient_quota" en logs | Sin saldo en OpenAI | Agrega créditos en platform.openai.com → Billing |
| App Meta en modo Development | No activaste modo Live | Meta Developer → tu app → toggle **Live** arriba a la derecha |
| Webhook verificado pero no llegan mensajes | No suscrito a `messages` | Meta → WhatsApp → Configuración → Webhooks → Suscribirse a `messages` |
| Bot demora en responder la primera vez | Render se durmió (si cron-job.org no está) | Configura cron-job.org (Paso 2.6) |

### Ver logs en Render

Render → tu servicio `aure-backend` → pestaña **"Logs"**

Logs normales de arranque exitoso:
```
[DB] Conexión exitosa a PostgreSQL
[Server] Corriendo en http://localhost:3001
```

---

## DESPUÉS DE QUE FUNCIONE — Cargar productos

Edita `backend/src/seeders/products.js` con los productos reales de Aure, luego ejecuta desde tu computadora:

```powershell
cd "C:\Users\Asus\Desktop\Anderson\Joyeria Aure\agente inteligente aure\backend"
npm install
$env:DATABASE_URL="postgresql://...neon.tech/..."
node src/seeders/products.js
```

---

## COSTOS MENSUALES

| Servicio | Costo |
|---|---|
| Render + cron-job.org (backend) | **$0** |
| Neon (PostgreSQL, 500 MB) | **$0** |
| Upstash (Redis, 10K cmd/día) | **$0** |
| Vercel (frontend) | **$0** |
| OpenAI GPT-4o-mini | ~$1-5/mes según volumen |
| Meta WhatsApp API | $0 hasta 1.000 conv/mes |
| **TOTAL** | **~$1-5/mes** |
