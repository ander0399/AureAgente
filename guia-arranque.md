# Guía de Despliegue en Producción — AURE Bot
**Meta: Bot activo en WhatsApp hoy | Costo: $0/mes**

---

## STACK DE DESPLIEGUE (todo gratis, sin expiración)

| Componente | Servicio | Por qué |
|---|---|---|
| Backend Node.js | **Koyeb** | Siempre activo, nunca duerme, capa gratis permanente |
| Base de datos PostgreSQL | **Neon** | 500 MB gratis, sin fecha de expiración |
| Redis (colas) | **Upstash** | 10.000 comandos/día gratis, sin expiración |
| Frontend dashboard | **Vercel** | Gratis permanente |

---

## ESTADO ACTUAL

| Fase | Estado |
|---|---|
| ✅ Código en GitHub | Listo |
| ⬜ PostgreSQL en Neon | Pendiente |
| ⬜ Redis en Upstash | Pendiente |
| ⬜ Backend en Koyeb | Pendiente |
| ⬜ WhatsApp API en Meta | Pendiente |
| ⬜ OpenAI API Key | Pendiente |
| ⬜ Frontend en Vercel | Pendiente |
| ⬜ Prueba final | Pendiente |

---

## FASE 2 — Infraestructura gratuita (20 min)

### Paso 2.1 — PostgreSQL en Neon

1. Ve a **https://neon.tech**
2. Click en **"Sign up"** → **"Continue with GitHub"**
3. En el dashboard, click en **"Create a project"**
4. Rellena:
   - **Project name:** `aure`
   - **Postgres version:** `16`
   - **Region:** `AWS US East (N. Virginia)`
5. Click en **"Create project"**
6. Neon crea la base de datos en segundos y te muestra la pantalla de conexión
7. En esa pantalla, en la sección **"Connection string"**, asegúrate de que el desplegable diga **"Node.js"**
8. Copia la cadena de conexión — se ve así:
   ```
   postgresql://neondb_owner:AbCxxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
9. Guárdala — la necesitas en el Paso 2.3

### Paso 2.2 — Redis en Upstash

1. Ve a **https://upstash.com**
2. Click en **"Sign Up"** → **"Continue with GitHub"**
3. En el dashboard, click en **"Create Database"**
4. Rellena:
   - **Name:** `aure-redis`
   - **Type:** `Regional`
   - **Region:** `US-East-1`
   - **Plan:** `Free`
5. Click en **"Create"**
6. Una vez creado, click en `aure-redis` para abrirlo
7. En la sección **"Database Details"**, anota estos tres valores:

   | Dato en Upstash | Variable que necesitas |
   |---|---|
   | **Endpoint** | `REDIS_HOST` (ej. `loyal-ocelot-12345.upstash.io`) |
   | **Port** | `REDIS_PORT` (normalmente `6379`) |
   | **Password** | `REDIS_PASSWORD` (cadena larga de letras y números) |

### Paso 2.3 — Backend en Koyeb

#### Crear cuenta

1. Ve a **https://www.koyeb.com**
2. Click en **"Sign up"** → **"Continue with GitHub"**
3. Completa el registro (pide nombre y país — no requiere tarjeta)

#### Crear la App

1. En el dashboard de Koyeb, click en **"Create App"**
2. Selecciona **"GitHub"** como fuente
3. Click en **"Install the Koyeb GitHub app"** si es la primera vez → autoriza el repositorio `aure-bot`
4. Selecciona el repositorio **`aure-bot`**
5. **Branch:** `main`

#### Configurar el servicio

Rellena la sección **"Builder"**:
- **Build and run from source code:** activado
- **Root directory:** `backend` ← escríbelo exactamente así
- **Build command:** `npm install`
- **Run command:** `npm start`

Rellena la sección **"Exposing your service"**:
- **Port:** `3001`
- **Protocol:** `HTTP`

#### Agregar variables de entorno

Baja hasta la sección **"Environment variables"** y agrega cada una con **"Add variable"**:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `DATABASE_URL` | *(pega la cadena de conexión de Neon del Paso 2.1)* |
| `META_VERIFY_TOKEN` | `aure_webhook_secreto_2024` |
| `META_ACCESS_TOKEN` | `pendiente` *(actualizas en Fase 3)* |
| `WHATSAPP_PHONE_NUMBER_ID` | `pendiente` *(actualizas en Fase 3)* |
| `OPENAI_API_KEY` | `pendiente` *(actualizas en Fase 4)* |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `REDIS_HOST` | *(Endpoint de Upstash del Paso 2.2)* |
| `REDIS_PORT` | `6379` |
| `REDIS_PASSWORD` | *(Password de Upstash del Paso 2.2)* |

#### Nombre y plan

- **App name:** `aure-backend`
- **Region:** `Washington, D.C. (AWS us-east-1)`
- **Instance type:** `Free` ← asegúrate que esté seleccionado

Click en **"Deploy"**

#### Esperar el primer deploy

Koyeb muestra los logs en tiempo real. El primer deploy tarda 3-5 minutos (instala dependencias). Espera hasta ver:

```
[DB] Conexión exitosa a PostgreSQL
[Server] Corriendo en http://localhost:3001
```

Si los logs se detienen en un error, ve a la sección de [Solución de problemas](#solución-de-problemas).

### Paso 2.4 — Obtener tu URL pública de Koyeb

1. Una vez deployado con éxito, en el dashboard de tu app `aure-backend`
2. Verás la URL pública en la parte superior, se ve así:
   ```
   https://aure-backend-tuusuario.koyeb.app
   ```
3. Guarda esta URL — la usarás en Meta (Fase 3) y Vercel (Fase 5)

### Paso 2.5 — Verificar que el backend funciona

Abre en el navegador:
```
https://aure-backend-tuusuario.koyeb.app/health
```

Respuesta esperada:
```json
{"status":"ok","timestamp":"2026-11-10T..."}
```

Si ves esto, el backend está vivo. ✅ Continúa con la Fase 3.

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

1. En el dashboard de tu app, en el panel de productos disponibles busca **"WhatsApp"**
2. Click en **"Configurar"** en esa tarjeta
3. Click en **"Empezar"** → acepta los términos de servicio
4. En **"Seleccionar o crear cuenta de WhatsApp Business"**:
   - Click en **"Crear nueva cuenta de WhatsApp Business"**
   - Nombre: `Aure Joyería`
   - Zona horaria: `America/Bogota`
5. Click en **"Continuar"**

### Paso 3.4 — Elegir número para el bot

Tienes dos caminos. Escoge el que aplique a tu situación:

---

**CAMINO A — Usar el número de prueba de Meta (para testear hoy sin riesgos)**

Meta te da un número de sandbox gratis para probar.

1. En **WhatsApp** → **"Configuración de la API"**
2. Verás el número de prueba ya configurado (ej. `+1 555-XXX-XXXX`)
3. En la sección **"Enviar y recibir mensajes"** → **"Para"**, agrega tu número personal:
   - Click en **"Agregar número de teléfono"**
   - Escribe tu número personal con código de país: `+57XXXXXXXXXX`
   - Verifica con el código que te llega por WhatsApp
4. Con esto puedes enviarte mensajes de prueba desde Meta directamente
5. Para que el bot responda a tu número de prueba, el webhook debe estar configurado (Paso 3.7)

---

**CAMINO B — Agregar tu número real de Aure**

Solo si el número **NO tiene WhatsApp Business App instalada actualmente** (o ya la desinstalaste).

1. En **WhatsApp** → **"Configuración de la API"**
2. Click en **"Agregar número de teléfono"**
3. **Nombre de perfil:** `Aure Joyería`
4. **Zona horaria:** `America/Bogota`
5. **Categoría:** `Shopping and retail`
6. Click en **"Siguiente"**
7. Ingresa tu número: `+57XXXXXXXXXX`
8. Elige verificación por SMS o llamada → ingresa el código
9. Click en **"Finalizar"**

---

### Paso 3.5 — Obtener Phone Number ID

1. En **WhatsApp** → **"Configuración de la API"**
2. En el selector de número (arriba), selecciona tu número (o el de prueba)
3. Anota el **Phone Number ID** — número de ~15 dígitos que aparece debajo

4. Ve a Koyeb → tu app `aure-backend` → pestaña **"Settings"** → **"Environment variables"**
5. Actualiza: `WHATSAPP_PHONE_NUMBER_ID` = *(el número que anotaste)*

### Paso 3.6 — Generar Token Permanente

El token del dashboard dura 24 horas. Para producción necesitas uno que nunca expire.

**Crear Usuario del Sistema:**

1. Ve a **https://business.facebook.com/settings**
2. Menú izquierdo → **"Usuarios"** → **"Usuarios del sistema"**
3. Click en **"Agregar"**
   - Nombre: `aure-bot`
   - Rol: **Administrador**
4. Click en **"Crear usuario del sistema"**

**Dar acceso al App:**

1. Con `aure-bot` seleccionado → click en **"Asignar activos"**
2. Panel izquierdo → **"Apps"**
3. Selecciona **"AURE Bot"**
4. Activa **"Control total"**
5. Click en **"Guardar cambios"**

**Generar el Token:**

1. Con `aure-bot` seleccionado → click en **"Generar token nuevo"**
2. Selecciona la app **"AURE Bot"**
3. **Expiración:** `Nunca`
4. Activa estos permisos:
   - `whatsapp_business_messaging` ✅
   - `whatsapp_business_management` ✅
   - `pages_messaging` ✅
   - `instagram_basic` ✅
   - `instagram_manage_messages` ✅
5. Click en **"Generar token"**
6. **Copia el token ahora** — empieza con `EAA...` — no se vuelve a mostrar

7. Ve a Koyeb → `aure-backend` → **"Environment variables"**
8. Actualiza: `META_ACCESS_TOKEN` = *(el token copiado)*

### Paso 3.7 — Configurar Webhook

1. En tu app Meta → menú izquierdo → **"Configuración"** → **"Básica"**
2. Verifica que el modo en la parte superior diga **"Live"** — si dice "Development", cámbialo a **Live**
3. Ve a **WhatsApp** → **"Configuración"**
4. Sección **"Webhooks"** → click en **"Editar"**
5. Rellena:
   - **URL de devolución de llamada:** `https://aure-backend-tuusuario.koyeb.app/webhook`
   - **Token de verificación:** `aure_webhook_secreto_2024`
6. Click en **"Verificar y guardar"**

> Si da error: verifica que el servicio en Koyeb esté corriendo (health check del Paso 2.5) y que `META_VERIFY_TOKEN` sea exactamente `aure_webhook_secreto_2024`.

### Paso 3.8 — Suscribirse a mensajes

1. En la sección **"Webhooks"**, busca el campo **`messages`**
2. Click en **"Suscribirse"** ✅
3. Click en **"Listo"**

**Redeploy en Koyeb** para aplicar los nuevos tokens:
- Koyeb → `aure-backend` → **"Redeploy"**
- Espera el mensaje `[Server] Corriendo en http://localhost:3001`

---

## FASE 4 — OpenAI API Key (5 min)

### Paso 4.1 — Crear la API Key

1. Ve a **https://platform.openai.com**
2. Crea una cuenta o inicia sesión
3. Menú izquierdo → **"API keys"**
4. Click en **"+ Create new secret key"**
5. Nombre: `aure-production`
6. Click en **"Create secret key"**
7. **Copia la clave ahora** — empieza con `sk-...` — no se vuelve a mostrar

### Paso 4.2 — Agregar créditos (obligatorio)

Sin saldo la API retorna error y el bot no responde.

1. Menú izquierdo → **"Billing"**
2. **"Add payment method"** → agrega tu tarjeta
3. **"Add to credit balance"** → agrega mínimo **$5 USD**

### Paso 4.3 — Agregar a Koyeb

1. Koyeb → `aure-backend` → **"Environment variables"**
2. Actualiza: `OPENAI_API_KEY` = *(tu clave)*
3. Koyeb hace redeploy automático al guardar

---

## FASE 5 — Frontend en Vercel (10 min)

### Paso 5.1 — Crear cuenta en Vercel

1. Ve a **https://vercel.com**
2. Click en **"Sign Up"** → **"Continue with GitHub"**

### Paso 5.2 — Importar el proyecto

1. Dashboard de Vercel → **"Add New..."** → **"Project"**
2. Selecciona el repositorio `aure-bot` → click en **"Import"**
3. Configura el directorio raíz:
   - Busca **"Root Directory"** → click en **"Edit"** → escribe `frontend` → **"Continue"**
4. Vercel detecta Vite automáticamente:
   - **Framework Preset:** `Vite` (auto)
   - **Build Command:** `npm run build` (auto)
   - **Output Directory:** `dist` (auto)

### Paso 5.3 — Variable de entorno

En la sección **"Environment Variables"** antes de hacer deploy:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://aure-backend-tuusuario.koyeb.app` |

### Paso 5.4 — Deploy

1. Click en **"Deploy"**
2. Build tarda ~1-2 minutos
3. Obtienes tu URL: `https://aure-bot-tuusuario.vercel.app`

### Paso 5.5 — Actualizar FRONTEND_URL en Koyeb

1. Koyeb → `aure-backend` → **"Environment variables"**
2. Agrega: `FRONTEND_URL` = `https://aure-bot-tuusuario.vercel.app`

---

## FASE 6 — Prueba Final (10 min)

### Paso 6.1 — Lista de verificación de variables en Koyeb

Confirma que las 12 variables estén completas (ninguna dice "pendiente"):

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
| `REDIS_HOST` | `xxx.upstash.io` |
| `REDIS_PORT` | `6379` |
| `REDIS_PASSWORD` | cadena larga |

### Paso 6.2 — Health check

```
https://aure-backend-tuusuario.koyeb.app/health
```
Respuesta esperada: `{"status":"ok","timestamp":"..."}`

### Paso 6.3 — Prueba real

1. Abre WhatsApp en tu teléfono
2. Escribe al número de Aure (o al número de prueba si usaste el Camino A)
3. Envía: `Hola`
4. Espera 5-10 segundos → el bot responde ✅

### Paso 6.4 — Dashboard en vivo

Abre `https://aure-bot-tuusuario.vercel.app` — la conversación aparece en tiempo real.

---

## SOLUCIÓN DE PROBLEMAS

| Problema | Causa probable | Solución |
|---|---|---|
| `/health` no carga | Koyeb no deployó o hay error en código | Koyeb → tu app → pestaña **"Logbook"** → busca línea roja |
| Webhook retorna 403 | `META_VERIFY_TOKEN` no coincide | Verifica que sea exactamente `aure_webhook_secreto_2024` sin espacios |
| Bot no responde mensajes | `META_ACCESS_TOKEN` incorrecto | Regenera token en Meta Business → Usuarios del sistema |
| Error de base de datos | `DATABASE_URL` mal copiada de Neon | Copia de nuevo desde Neon → tu proyecto → **"Connection string"** |
| Error de Redis al arrancar | Credenciales de Upstash mal puestas | Verifica los 3 valores en Upstash → tu base → "Database Details" |
| "insufficient_quota" en logs | Sin saldo en OpenAI | Agrega créditos en platform.openai.com → Billing |
| App Meta en modo Development | No activaste modo Live | Meta Developer → tu app → toggle **Live** arriba a la derecha |
| Webhook verificado pero no llegan mensajes | No suscrito al campo `messages` | Meta → WhatsApp → Configuración → Webhooks → Suscribirse a `messages` |

### Ver logs en Koyeb

Koyeb → tu app `aure-backend` → pestaña **"Logbook"**

Logs normales de arranque exitoso:
```
[DB] Conexión exitosa a PostgreSQL
[Server] Corriendo en http://localhost:3001
```

---

## DESPUÉS DE QUE FUNCIONE — Cargar productos

Edita `backend/src/seeders/products.js` con los productos reales de Aure, luego conéctate a la base de datos de Neon desde tu computadora:

```powershell
cd "C:\Users\Asus\Desktop\Anderson\Joyeria Aure\agente inteligente aure\backend"
npm install
$env:DATABASE_URL="postgresql://...neon.tech/..." # pega la connection string de Neon
node src/seeders/products.js
```

---

## COSTOS MENSUALES

| Servicio | Costo |
|---|---|
| Koyeb (backend, siempre activo) | **$0** |
| Neon (PostgreSQL, 500 MB) | **$0** |
| Upstash (Redis, 10K cmd/día) | **$0** |
| Vercel (frontend) | **$0** |
| OpenAI GPT-4o-mini | ~$1-5/mes según volumen |
| Meta WhatsApp API | $0 hasta 1.000 conv/mes |
| **TOTAL** | **~$1-5/mes** |
