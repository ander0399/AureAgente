Actúa como un Arquitecto de Software Full Stack y Especialista en Integraciones de Meta Cloud API con Inteligencia Artificial.

Quiero desarrollar un agente inteligente omnicanal y modular para mi marca de joyería de oro laminado 18K llamada "AURE Joyería" (aurejoyeria18k.com). 

### 1. Stack Tecnológico Base Obligatorio
- **Backend:** Node.js con Express y JavaScript moderno (ES6+).
- **Base de Datos & ORM:** PostgreSQL administrado mediante Sequelize ORM.
- **Frontend / Panel de Control:** React (Vite) estilizado con Tailwind CSS.
- **IA / LLM:** Integración con API de OpenAI (GPT-4o / GPT-4o-mini) o Claude (Anthropic API) mediante llamadas estructuradas (JSON mode / Function Calling).
- **Procesamiento Asíncrono / Cron Tasks:** BullMQ con Redis (o Node-Cron para etapas iniciales) para programar seguimientos, retargeting y recordatorios sin bloquear el servidor.
- **Canales Oficiales:** Meta Graph API & WhatsApp Cloud API oficial (mediante Webhooks unificados para WhatsApp Business, Instagram Direct/Comentarios y Messenger de Facebook).

---

### 2. Módulos y Funcionalidades Clave Requeridas

1. **Gestor Omnicanal Unificado (Webhooks de Meta):**
   - Recepción y procesamiento en tiempo real de mensajes entrantes de WhatsApp Business API, DMs de Instagram y Messenger.
   - Detección y respuesta instantánea a comentarios en posts/reels de Instagram y Facebook, enviando respuesta pública y abriendo DM directo de forma automática.
   - Manejo de estados de conversación (`BOT_ACTIVE`, `HUMAN_TAKEOVER`, `RESOLVED`, `CLOSED`).

2. **Agente de Ventas y Atención con IA (Aure AI):**
   - Personalidad de marca: Sofisticado, cercano, ágil, vendedor consultivo para joyería de oro laminado 18K (resaltando durabilidad, 5 años de garantía, acabados de lujo y envíos gratis a toda Colombia).
   - Capacidad de resolver dudas de catálogo (cadenas, pulseras, dijes, combos), precios, métodos de pago y despacho.
   - Capacidad de calificar leads, cotizar, calcular totales y cerrar ventas guiando al checkout o generando links de pago directos.
   - **Handoff Humano Fluido:** Si el usuario solicita hablar con una persona, muestra dudas complejas o la intención de compra está lista para pago manual, el bot cambia el estado a `HUMAN_TAKEOVER`, silencia sus respuestas automáticas y envía una notificación push/webhook al administrador para que el humano tome el control sin fricción.

3. **Sistema de Recuperación de Carritos y Seguimiento de Venta Fría (Retargeting):**
   - Temporizador de inactividad: si un usuario deja de responder tras consultar un producto, el sistema programa automáticamente un recordatorio tras 2 a 4 horas (e.g., "Hola Juan, vi que estabas interesado en el Combo Gucci. Nos quedan solo 3 unidades disponibles para envío hoy, ¿te aparto el tuyo?").
   - Reglas anti-spam: máximo 1 a 2 mensajes de seguimiento si no hay respuesta.

4. **Motor de Re-engagement y Fidelización Post-Venta (LTV):**
   - Programación de seguimientos escalonados según fecha de última compra en la base de datos (PostgreSQL):
     - Día +7: Mensaje de confirmación de satisfacción y consejos de cuidado del oro laminado.
     - Día +30: Notificación personalizada con nuevas piezas, combos complementarios o promociones exclusivas para clientes frecuentes.
   - Respeto de ventanas de mensajería de WhatsApp mediante plantillas aprobadas (Message Templates HSM) para no violar las políticas de Meta.

5. **Panel de Control (Dashboard en React + Tailwind):**
   - Vista de bandeja de entrada multi-canal en tiempo real (WhatsApp, IG, FB) con soporte de WebSockets.
   - Toggle manual instantáneo: botón para apagar/encender la IA en una conversación específica.
   - Estadísticas básicas: tasa de conversión, conversaciones abiertas, carritos recuperados y leads atendidos.
   - Editor de prompts del sistema y gestión de respuestas rápidas predeterminadas.

---

### 3. Lo que necesito que generes en este momento:

1. **Arquitectura del Sistema:** Diagrama de flujo de datos (Webhooks de Meta -> Express -> Queue/Workers -> LLM -> DB -> Respuesta).
2. **Modelo de Datos en Sequelize:** Código de los modelos clave en PostgreSQL (`User/Lead`, `Conversation`, `Message`, `Product`, `Order`, `FollowUpJob`).
3. **Controlador del Webhook de Meta:** Endpoint base en Express para validar el `hub.verify_token` y recibir eventos `messages` y `comment_mentions` de WhatsApp e Instagram.
4. **Lógica de Decisión del Agente:** Módulo en Node.js que determine si responde una plantilla predeterminada, si procesa la consulta con la IA vía Function Calling (para consultar inventario o precios), o si delega la conversación al asesor humano.
5. **Plan de Implementación Paso a Paso:** Fases de desarrollo para construir un Producto Mínimo Viable (MVP) funcional que pueda probar localmente con ngrok y mi base de datos en PostgreSQL.