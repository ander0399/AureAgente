# Guía de Arranque — AURE Agente Inteligente
> Sigue este documento de arriba a abajo. Cada paso tiene un comando para verificar que funcionó.

---

## ¿Qué son Redis y ngrok? (léelo antes de empezar)

### Redis — el "bloc de notas temporal" del servidor

Imagínate que el agente necesita recordar una tarea pendiente:
*"En 3 horas, enviarle un mensaje de seguimiento a Juan porque miró el Combo Gucci y no compró."*

El problema es que si el servidor se reinicia, esa tarea se perdería de la memoria de Node.js.

**Redis** es una base de datos ultrarrápida que vive separada del servidor. Guarda esas tareas pendientes (jobs) en disco, así si el servidor se cae y vuelve a subir, los trabajos programados siguen ahí y se ejecutan cuando toca.

En términos simples: **Redis = agenda de tareas que no se borra aunque el servidor se reinicie.**

En este proyecto lo usa BullMQ (la librería de colas) para guardar los mensajes de seguimiento de carritos abandonados y los recordatorios post-venta.

---

### ngrok — el "túnel" entre Meta y tu PC

El problema es este: tu servidor corre en `http://localhost:3001` — eso solo existe en tu computador. Meta necesita una URL pública en internet para enviarte los mensajes de WhatsApp e Instagram.

**ngrok** crea un túnel seguro: toma tu `localhost:3001` y lo expone en una URL pública real tipo `https://abc123.ngrok-free.app`. Meta puede pegarle a esa URL, el mensaje viaja por el túnel y llega a tu servidor local.

```
WhatsApp de un cliente
        │
        ▼
Meta Cloud API (internet)
        │  envía POST a:
        ▼
https://abc123.ngrok-free.app/webhook   ← URL pública de ngrok
        │
        │  túnel seguro
        ▼
http://localhost:3001/webhook           ← tu servidor en tu PC
        │
        ▼
Respuesta de Aure IA → cliente
```

En términos simples: **ngrok = puerta trasera temporal que le abre internet a tu servidor local.**

> **Importante:** ngrok gratis cambia la URL cada vez que lo reinicias. Cuando eso pase, debes actualizar la URL en Meta Developer Console. En producción usarás un servidor real con URL fija y ngrok ya no será necesario.

---

## PARTE 1 — Instalar las herramientas en tu PC

### Paso 1.1 — Verificar si ya tienes Node.js

Abre PowerShell o CMD y ejecuta:

```powershell
node -v
npm -v
```

Si ves números (ej: `v20.11.0` y `10.2.4`), ya lo tienes. Si no:

**Instalar Node.js:**
1. Ir a https://nodejs.org
2. Descargar el instalador LTS (el botón verde grande)
3. Ejecutar el instalador → siguiente, siguiente, instalar
4. Cerrar y volver a abrir PowerShell
5. Verificar con `node -v`

---

### Paso 1.2 — Instalar PostgreSQL

```powershell
node -v   # solo para verificar que estás en PowerShell correcto
```

**Instalar PostgreSQL:**
1. Ir a https://www.postgresql.org/download/windows/
2. Descargar el instalador de EDB (el link que dice "Download the installer")
3. Ejecutar → durante la instalación:
   - Deja el puerto en **5432** (por defecto)
   - Escoge una contraseña para el usuario `postgres` → **anótala**, la vas a necesitar
   - Deja marcado el componente "pgAdmin 4" (es la interfaz visual)
4. Terminar la instalación

**Verificar:**
```powershell
psql --version
# Debe responder: psql (PostgreSQL) 16.x o similar
```

Si `psql` no se reconoce, agrégalo al PATH:
- Busca en tu PC la carpeta `C:\Program Files\PostgreSQL\16\bin`
- Agrega esa ruta a las variables de entorno de Windows (Variables del sistema → PATH → Editar → Nuevo)
- Cierra y vuelve a abrir PowerShell

---

### Paso 1.3 — Instalar Redis en Windows

Redis no tiene instalador oficial para Windows, pero hay una versión de la comunidad que funciona perfectamente para desarrollo:

1. Ir a: https://github.com/tporadowski/redis/releases
2. Descargar el archivo `.msi` más reciente (ej: `Redis-x64-5.0.14.1.msi`)
3. Ejecutar el instalador → siguiente, siguiente, instalar
4. Durante la instalación marca la opción **"Add the Redis installation folder to the PATH"**
5. También marca **"Start the Redis service"** para que arranque automáticamente con Windows

**Verificar:**
```powershell
redis-cli ping
# Debe responder: PONG
```

Si responde `PONG`, Redis está corriendo y listo. No necesitas hacer nada más con él — corre en segundo plano como un servicio de Windows.

---

### Paso 1.4 — Instalar ngrok

1. Ir a https://ngrok.com y crear una cuenta gratuita (con tu email)
2. Una vez dentro del dashboard de ngrok, ir a la sección **"Your Authtoken"**
3. Copiar el token que aparece ahí (lo necesitas en el Paso 1.4.3)

**Instalar ngrok:**
```powershell
winget install ngrok.ngrok
```

Si `winget` no funciona, descarga el `.exe` directo desde https://ngrok.com/download y ponlo en una carpeta que esté en el PATH.

**Configurar tu token (solo se hace una vez):**
```powershell
ngrok config add-authtoken TU_TOKEN_AQUI
```

**Verificar:**
```powershell
ngrok version
# Debe responder: ngrok version 3.x.x
```

---

## PARTE 2 — Crear cuentas y obtener credenciales

### Paso 2.1 — Cuenta de Meta Developer

1. Ir a https://developers.facebook.com
2. Iniciar sesión con tu cuenta de Facebook
3. Click en **"Mis apps"** → **"Crear app"**
4. Tipo de app: **"Business"** → Siguiente
5. Nombre de la app: `AURE Joyería Bot` → Crear app

#### Activar WhatsApp Business API:
1. Dentro de tu app → Dashboard → busca **"WhatsApp"** → click en **"Configurar"**
2. Vas a ver un número de teléfono de prueba gratuito (tipo `+1 555 XXX XXXX`)
3. Ese número ya puede enviar y recibir mensajes sin costo
4. Anota el **Phone Number ID** (es un número largo como `123456789012345`)
5. Ve a **"Configuración"** → **"Acceso a la API"**
6. Verás un **"Token de acceso temporal"** → cópialo (empieza con `EAA...`)
   > Este token dura 24 horas. Para producción generarás uno permanente.

#### Activar Instagram:
1. En el mismo dashboard de tu app → busca **"Instagram"** → **"Configurar"**
2. Conecta tu cuenta de Instagram de AURE Joyería
3. Anota el **Page ID** de la página de Facebook vinculada a Instagram

---

### Paso 2.2 — API Key de OpenAI

1. Ir a https://platform.openai.com
2. Crear cuenta o iniciar sesión
3. Ir a **"API Keys"** → **"Create new secret key"**
4. Copiar la key (empieza con `sk-...`) → **guárdala ahora**, no la podrás ver de nuevo
5. Ir a **"Billing"** → agregar tarjeta → cargar mínimo **$5 USD**
   > Con $5 tienes para miles de conversaciones con GPT-4o-mini

---

## PARTE 3 — Configurar y arrancar el proyecto

### Paso 3.1 — Crear la base de datos

```powershell
# Conectarte a PostgreSQL como administrador
psql -U postgres
# Escribe tu contraseña cuando la pida

# Dentro de psql, crear la base de datos:
CREATE DATABASE aure_db;

# Verificar que se creó:
\l
# Debes ver aure_db en la lista

# Salir
\q
```

---

### Paso 3.2 — Configurar el archivo .env del backend

Navega a la carpeta del backend:

```powershell
cd "C:\Users\Asus\Desktop\Anderson\Joyeria Aure\agente inteligente aure\backend"
copy .env.example .env
```

Abre el archivo `.env` con el Bloc de notas o VS Code y completa cada variable:

```env
# ── Servidor ──────────────────────────────────────────────
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# ── PostgreSQL ─────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA_DE_POSTGRES@localhost:5432/aure_db
# Ejemplo real: postgresql://postgres:mipassword123@localhost:5432/aure_db

# ── Meta / WhatsApp ────────────────────────────────────────
META_VERIFY_TOKEN=aure_webhook_secreto_2024
# ^ Este lo inventas tú. Puede ser cualquier texto sin espacios.
# Lo usarás también en Meta Developer Console en el Paso 3.6.

META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# ^ El token que copiaste del dashboard de Meta (el que empieza con EAA)

WHATSAPP_PHONE_NUMBER_ID=123456789012345
# ^ El Phone Number ID del número de prueba de WhatsApp

INSTAGRAM_PAGE_ID=123456789012345
# ^ El Page ID de tu página de Facebook vinculada a Instagram

# ── OpenAI ─────────────────────────────────────────────────
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# ^ La API key que copiaste de platform.openai.com

OPENAI_MODEL=gpt-4o-mini
# ^ Deja este modelo para el MVP. Es el más barato y funciona muy bien.

# ── Redis (BullMQ) ─────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
# ^ Redis local no tiene contraseña. Deja ese campo vacío.
```

**Guarda el archivo.**

---

### Paso 3.3 — Instalar dependencias y arrancar el backend

```powershell
cd "C:\Users\Asus\Desktop\Anderson\Joyeria Aure\agente inteligente aure\backend"
npm install
npm run dev
```

Debes ver estos mensajes en la consola:

```
[DB] Conexión exitosa a PostgreSQL
[Server] Corriendo en http://localhost:3001
```

Si ves un error de base de datos, verifica que la contraseña en `DATABASE_URL` sea la correcta.

---

### Paso 3.4 — Cargar los productos de prueba

**Abre una segunda terminal** (sin cerrar la del servidor) y ejecuta:

```powershell
cd "C:\Users\Asus\Desktop\Anderson\Joyeria Aure\agente inteligente aure\backend"
npm run seed
```

Debes ver:
```
[Seeder] 8 productos insertados/verificados.
```

---

### Paso 3.5 — Arrancar el frontend

**Abre una tercera terminal:**

```powershell
cd "C:\Users\Asus\Desktop\Anderson\Joyeria Aure\agente inteligente aure\frontend"
copy .env.example .env
npm install
npm run dev
```

Abre tu navegador en **http://localhost:5173** — debes ver el panel de control de AURE.

---

### Paso 3.6 — Exponer el servidor con ngrok

**Abre una cuarta terminal:**

```powershell
ngrok http 3001
```

Verás algo como esto:

```
Session Status    online
Account           tu@email.com
Forwarding        https://abc123.ngrok-free.app -> http://localhost:3001
```

Copia esa URL (`https://abc123.ngrok-free.app`). La necesitas en el siguiente paso.

> Deja esta terminal abierta siempre que estés probando. Si la cierras, el túnel se corta.

---

### Paso 3.7 — Registrar el webhook en Meta Developer Console

#### Para WhatsApp:
1. Ir a tu app en developers.facebook.com
2. Menú izquierdo → **WhatsApp** → **Configuración**
3. En la sección **"Webhooks"** → click en **"Editar"**
4. **Callback URL:** `https://abc123.ngrok-free.app/webhook`
   (la URL de ngrok que copiaste + `/webhook`)
5. **Verify token:** `aure_webhook_secreto_2024`
   (el mismo texto que pusiste en `META_VERIFY_TOKEN` en tu `.env`)
6. Click en **"Verificar y guardar"**
   - Si aparece ✅ verde, funcionó
   - Si falla, verifica que el backend esté corriendo y ngrok también
7. En la sección de campos a suscribir, activa: **`messages`**

#### Para Instagram:
1. Menú izquierdo → **Instagram** → **Configuración**
2. Mismo proceso: agrega el webhook con la misma URL y el mismo verify token
3. Activa los campos: **`comments`**, **`messages`**

---

### Paso 3.8 — Hacer la primera prueba

1. En Meta Developer Console → WhatsApp → **"Enviar y recibir mensajes"**
2. Agrega tu número personal de WhatsApp como número de prueba (sigue las instrucciones que aparecen)
3. Desde tu WhatsApp personal, envía un mensaje al número de prueba de Meta:
   ```
   Hola, ¿qué cadenas tienen disponibles?
   ```
4. En pocos segundos debes recibir la respuesta de Aure con los productos del catálogo

Si responde correctamente: **el sistema está funcionando.**

---

## Resumen rápido — comandos para arrancar cada día

Cada vez que quieras trabajar con el sistema, abre **4 terminales**:

```powershell
# Terminal 1 — Backend (siempre primero)
cd "C:\Users\Asus\Desktop\Anderson\Joyeria Aure\agente inteligente aure\backend"
npm run dev

# Terminal 2 — Frontend
cd "C:\Users\Asus\Desktop\Anderson\Joyeria Aure\agente inteligente aure\frontend"
npm run dev

# Terminal 3 — ngrok (para que Meta pueda llegar al servidor)
ngrok http 3001

# Terminal 4 — libre para comandos varios
```

> Redis arranca automáticamente con Windows, no necesitas tocarlo.

> Cada vez que ngrok cambie la URL, ve a Meta Developer Console y actualiza el webhook.

---

## Problemas comunes y soluciones

| Error | Causa | Solución |
|---|---|---|
| `ECONNREFUSED 5432` | PostgreSQL no está corriendo | Busca "Services" en Windows → iniciar el servicio PostgreSQL |
| `ECONNREFUSED 6379` | Redis no está corriendo | Busca "Services" en Windows → iniciar el servicio Redis |
| Webhook verification failed | URL de ngrok no coincide o verify token incorrecto | Verifica que el backend corra y que `META_VERIFY_TOKEN` sea idéntico en `.env` y en Meta |
| Bot no responde | Token de Meta expiró | Generar nuevo token en Meta Developer Console → actualizar `META_ACCESS_TOKEN` en `.env` y reiniciar el backend |
| `Insufficient quota` (OpenAI) | Sin saldo en OpenAI | Agregar saldo en platform.openai.com → Billing |
| ngrok URL cambió | Reiniciaste ngrok | Actualizar la Callback URL en Meta Developer Console → WhatsApp → Webhooks |
