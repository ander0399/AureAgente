# Arquitectura del Sistema — AURE Agente Inteligente

## Diagrama de Flujo de Datos

```
┌───────────────────────────────────────────────────────────────────┐
│                     META CLOUD PLATFORM                           │
│   WhatsApp Business API    Instagram Graph     Messenger/FB       │
└────────────────────────────────┬──────────────────────────────────┘
                                 │  HTTPS POST /webhook
                                 ▼
┌───────────────────────────────────────────────────────────────────┐
│                   BACKEND  Node.js + Express                      │
│                                                                   │
│  ┌────────────────┐    ┌────────────────────┐                     │
│  │ Webhook Router │───▶│ Webhook Controller │                     │
│  │ GET  (verify)  │    │  Parsea eventos    │                     │
│  │ POST (receive) │    │  Responde 200 OK   │                     │
│  └────────────────┘    └─────────┬──────────┘                     │
│                                  │                                │
│                                  ▼                                │
│                    ┌─────────────────────────┐                    │
│                    │   agentDecision.js       │                    │
│                    │  · find/create User      │                    │
│                    │  · find/create Convo     │                    │
│                    │  · save inbound Message  │                    │
│                    │  · cancel followup jobs  │                    │
│                    │  · evaluar estado        │                    │
│                    └────────────┬────────────┘                    │
│                                 │                                 │
│          ┌──────────────────────┼─────────────────────┐          │
│          ▼                      ▼                     ▼          │
│  ┌──────────────┐    ┌────────────────────┐  ┌──────────────┐    │
│  │   Template   │    │   llmService.js    │  │   Human      │    │
│  │   Response   │    │  OpenAI GPT-4o /   │  │  Takeover    │    │
│  │  (FAQ/saludo)│    │  Anthropic Claude  │  │  Notificación│    │
│  └──────┬───────┘    │  Function Calling  │  └──────────────┘    │
│         │            └────────┬───────────┘                      │
│         │                     │                                   │
│         │            ┌────────┘                                   │
│         │            │  executeTool()                             │
│         │            │  · get_products → DB                      │
│         │            │  · get_product_detail → DB                │
│         │            │  · calculate_order_total → DB             │
│         │            │  · request_human_takeover                 │
│         └────────────┘                                           │
│                    │                                              │
│                    ▼                                              │
│          ┌──────────────────────┐                                 │
│          │   metaApi.js         │                                 │
│          │  sendWhatsAppMessage │                                 │
│          │  sendInstagramDM     │                                 │
│          │  sendCommentReply    │                                 │
│          └──────────────────────┘                                 │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │               BullMQ + Redis Queue System                   │  │
│  │  followUpQueue                                              │  │
│  │  · cart_recovery   → 3h de inactividad                     │  │
│  │  · reengagement_7  → día +7 post-compra                    │  │
│  │  · reengagement_30 → día +30 post-compra                   │  │
│  └──────────────────────┬──────────────────────────────────────┘  │
│                         │  Worker procesa jobs                    │
│                         ▼                                         │
│          ┌──────────────────────────────┐                         │
│          │  followUpWorker.js           │                         │
│          │  · Envía plantillas HSM WA   │                         │
│          │  · Registra FollowUpJob DB   │                         │
│          └──────────────────────────────┘                         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │               PostgreSQL + Sequelize ORM                    │  │
│  │  User/Lead  │ Conversation │ Message │ Product │ Order │    │  │
│  │                              FollowUpJob                   │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
              │
              │  Socket.io (WebSocket)
              ▼
┌────────────────────────────────────┐
│   FRONTEND  React + Vite + Tailwind│
│   · Bandeja multi-canal en tiempo  │
│     real (WhatsApp / IG / FB)      │
│   · Toggle IA ON/OFF por convo     │
│   · Stats: conversión, carritos    │
│   · Editor de prompts del sistema  │
└────────────────────────────────────┘
```

## Decisiones de Arquitectura

| Decisión | Elección | Razón |
|---|---|---|
| Respuesta inmediata a Meta | `res.status(200)` antes de procesar | Meta reintenta si no recibe 200 en <5s |
| Cola de jobs | BullMQ + Redis | Persistencia de jobs tras reinicio; delays precisos |
| Modelos LLM | GPT-4o-mini (default) | Balance costo/calidad; cambiar a GPT-4o para closing |
| ORM | Sequelize | Migraciones y associations declarativas en JS |
| WebSocket | Socket.io | Dashboard en tiempo real sin polling |
| State máquina conversación | 4 estados en DB | Control granular de handoff humano sin estado en memoria |

## Estados de Conversación

```
BOT_ACTIVE ──(trigger humano)──▶ HUMAN_TAKEOVER ──(admin toggle)──▶ BOT_ACTIVE
     │                                                                    │
     │                                                                    │
     └──(admin resuelve)──▶ RESOLVED ──(nueva msg)──▶ BOT_ACTIVE ◀───────┘
                                │
                                └──(cierre)──▶ CLOSED
```
