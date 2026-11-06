# Plan de Implementación MVP — AURE Agente Inteligente

## Fase 0 — Prerequisitos (Día 1, ~2h)

### Cuentas y accesos requeridos
- [ ] Meta Developer App creada en developers.facebook.com
- [ ] WhatsApp Business API configurada (número de prueba disponible gratis)
- [ ] Instagram Graph API activada en la misma app
- [ ] OpenAI API Key con créditos ($5 USD alcanza para el MVP)
- [ ] PostgreSQL instalado localmente (o cuenta en Railway/Supabase gratis)
- [ ] Redis instalado localmente (`winget install Redis` en Windows) o usar Upstash gratis
- [ ] ngrok instalado (`winget install ngrok`) para exponer localhost a Meta

### Setup inicial
```bash
# Instalar ngrok y exponerlo
ngrok http 3001
# Meta necesita la URL: https://xxxx.ngrok.io/webhook
```

---

## Fase 1 — Backend Core (Día 1-2, ~4h)

**Objetivo:** Webhook recibiendo mensajes y guardándolos en PostgreSQL.

```bash
cd backend
npm install
cp .env.example .env   # Completar todas las variables
```

**Pasos:**
1. Crear la base de datos: `createdb aure_db`
2. Ejecutar `npm run dev` → Sequelize crea las tablas automáticamente (`sync({ alter: true })`)
3. Configurar el webhook en Meta Developer Console:
   - Callback URL: `https://xxxx.ngrok.io/webhook`
   - Verify Token: el que pusiste en `META_VERIFY_TOKEN`
   - Suscribir a: `messages`, `messaging_postbacks`, `comments`
4. Verificar que Meta llama al GET y retorna el challenge
5. Enviar un mensaje de prueba al número de WhatsApp → verificar que llega a la tabla `messages`

**Verificación:** `SELECT * FROM messages LIMIT 10;` en PostgreSQL muestra el mensaje.

---

## Fase 2 — Integración LLM (Día 2-3, ~3h)

**Objetivo:** El bot responde con IA a mensajes de WhatsApp.

**Pasos:**
1. Cargar productos de prueba en la tabla `products`:
```sql
INSERT INTO products (id, name, category, price, stock, description, active)
VALUES
  (gen_random_uuid(), 'Cadena Figaro 50cm', 'cadena', 85000, 15, 'Cadena de oro laminado 18K estilo figaro', true),
  (gen_random_uuid(), 'Pulsera Eslabón Grueso', 'pulsera', 72000, 10, 'Pulsera de eslabón grueso bañada en oro 18K', true),
  (gen_random_uuid(), 'Combo Gucci (Cadena + Pulsera)', 'combo', 145000, 8, 'Combo de cadena y pulsera estilo Gucci en oro laminado 18K', true),
  (gen_random_uuid(), 'Dije Cruz de Malta', 'dije', 45000, 20, 'Dije de Cruz de Malta en oro laminado 18K', true);
```
2. Enviar mensaje al bot: "Hola, ¿qué cadenas tienen?"
3. Verificar que el LLM llama a `get_products` y responde con precios reales
4. Probar: "quiero el combo gucci, ¿cuánto es con 2 pulseras?"
5. Ajustar el `SYSTEM_PROMPT` en `llmService.js` según la personalidad deseada

**Verificación:** Conversación fluida en WhatsApp con precios reales del catálogo.

---

## Fase 3 — Handoff Humano (Día 3, ~2h)

**Objetivo:** Toggle IA/humano funcionando.

**Pasos:**
1. Enviar al bot: "Quiero hablar con un asesor"
2. Verificar que `conversations.state` cambia a `HUMAN_TAKEOVER`
3. Agregar endpoint en backend para cambiar estado desde el dashboard:
```javascript
// En app.js o routes/conversations.js
app.patch('/api/conversations/:id/state', async (req, res) => {
  const { state } = req.body;
  await Conversation.update({ state }, { where: { id: req.params.id } });
  res.json({ ok: true });
});
```
4. Verificar que al estar en `HUMAN_TAKEOVER`, los mensajes nuevos NO disparan respuesta de IA

---

## Fase 4 — Cola de Seguimientos (Día 4, ~3h)

**Objetivo:** Recuperación de carritos automática.

**Pasos:**
1. Iniciar Redis: `redis-server` (o verificar que corre)
2. Verificar que BullMQ puede conectarse: revisa logs al arrancar el server
3. Iniciar conversación, dejar sin responder 3 horas (en desarrollo puedes reducir a 1 minuto cambiando el `delayMs` en `agentDecision.js`)
4. Verificar que llega el mensaje de recuperación de carrito
5. Verificar que la tabla `follow_up_jobs` registra el job con `status: 'sent'`

**Para pruebas rápidas** (cambiar delay temporalmente):
```javascript
// En agentDecision.js línea del scheduleFollowUp:
delayMs: 60 * 1000, // 1 minuto en vez de 3 horas
```

---

## Fase 5 — Dashboard React (Día 5, ~3h)

**Objetivo:** Panel de control visible en http://localhost:5173

```bash
cd frontend
npm install
npm run dev
```

**Pasos:**
1. Verificar que el dashboard carga y se conecta al WebSocket
2. En el backend, emitir eventos cuando lleguen conversaciones:
```javascript
// En agentDecision.js, después de crear/actualizar conversación:
const io = req.app?.get('io'); // Pasar io como parámetro o usar un event emitter
io?.emit('conversation:update', conversationData);
```
3. Verificar que las conversaciones aparecen en la bandeja en tiempo real
4. Probar el toggle "Tomar Control / Activar IA" en una conversación

---

## Fase 6 — Producción (Semana 2+)

**Objetivo:** Deploy en servidor real, aprobación de plantillas Meta.

| Tarea | Herramienta sugerida | Costo |
|---|---|---|
| Hosting backend | Railway / Render / VPS DigitalOcean | $5-20/mes |
| PostgreSQL managed | Railway / Supabase | Gratis-$5/mes |
| Redis managed | Upstash | Gratis (10k ops/día) |
| Dominio + SSL | Cloudflare | Gratis |
| Plantillas HSM WhatsApp | Meta Business Manager | Aprobación ~24-48h |

**Checklist de producción:**
- [ ] Variables de entorno en servidor (nunca en código)
- [ ] `NODE_ENV=production` desactiva logging de Sequelize
- [ ] Habilitar `helmet` y `express-rate-limit` en app.js
- [ ] Plantillas HSM aprobadas para mensajes fuera de la ventana de 24h
- [ ] Monitoreo de errores con Sentry (plan gratis)
- [ ] Backup automático de PostgreSQL

---

## Estructura de Carpetas Final

```
agente inteligente aure/
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── models/           ← Sequelize ORM
│   │   ├── controllers/      ← Webhook handler
│   │   ├── services/         ← agentDecision, metaApi, llmService
│   │   ├── queues/           ← BullMQ queue definitions
│   │   ├── workers/          ← BullMQ workers
│   │   ├── routes/           ← Express routers
│   │   └── app.js            ← Entry point
│   ├── .env                  ← NO subir a git
│   ├── .env.example          ← Sí subir a git
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       ← Dashboard, Inbox, ConversationList, ChatWindow
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── arquitectura.md
├── plan-implementacion.md
└── reglas.md
```

---

## Comandos de Inicio Rápido

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend  
cd frontend && npm run dev

# Terminal 3 — ngrok (para Meta webhooks)
ngrok http 3001

# Terminal 4 — Redis (si no corre como servicio)
redis-server
```

## Costos Estimados MVP

| Componente | Costo/mes |
|---|---|
| OpenAI GPT-4o-mini (~500 convos/mes) | ~$2-5 USD |
| WhatsApp Cloud API | Gratis hasta 1000 convos/mes |
| Instagram/FB Messenger API | Gratis |
| Hosting (Railway básico) | $5-10 USD |
| Redis (Upstash) | Gratis |
| PostgreSQL (Railway) | Gratis (500MB) |
| **Total estimado** | **$7-15 USD/mes** |
