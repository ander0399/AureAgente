import { useState, useEffect, useRef } from 'react';

const CHANNEL_ICONS = { whatsapp: '📱', instagram: '📸', facebook: '👥' };

export default function ChatWindow({ conversation, socket, onConversationUpdate }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!conversation) return;
    setLoading(true);
    fetch(`/api/conversations/${conversation.id}/messages`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setMessages(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conversation?.id]);

  useEffect(() => {
    if (!socket) return;
    socket.on('message:new', (msg) => {
      if (msg.conversationId === conversation?.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    return () => socket.off('message:new');
  }, [socket, conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function toggleBotState() {
    if (!conversation || toggling) return;
    const newState = conversation.state === 'HUMAN_TAKEOVER' ? 'BOT_ACTIVE' : 'HUMAN_TAKEOVER';
    setToggling(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState }),
      });
      if (res.ok) onConversationUpdate?.({ ...conversation, state: newState });
    } finally {
      setToggling(false);
    }
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-950">
        <div className="text-center text-gray-600">
          <div className="text-5xl mb-4">💎</div>
          <p className="text-sm">Selecciona una conversación para ver los mensajes</p>
        </div>
      </div>
    );
  }

  const isHumanTakeover = conversation.state === 'HUMAN_TAKEOVER';

  return (
    <div className="flex-1 flex flex-col bg-gray-950 min-w-0">
      {/* Cabecera */}
      <div className="px-5 py-3 border-b border-gray-800 bg-gray-900 flex items-center justify-between shrink-0">
        <div>
          <div className="font-medium text-gray-200">
            {CHANNEL_ICONS[conversation.channel]} {conversation.User?.name || 'Sin nombre'}
          </div>
          <div className="text-xs text-gray-500">
            {conversation.User?.phone || conversation.User?.channelUserId} · {conversation.channel}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              isHumanTakeover
                ? 'bg-orange-900/50 text-orange-300'
                : 'bg-green-900/50 text-green-300'
            }`}
          >
            {isHumanTakeover ? '👤 Asesor activo' : '🤖 Bot activo'}
          </span>
          <button
            onClick={toggleBotState}
            disabled={toggling}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
              isHumanTakeover
                ? 'bg-green-700 hover:bg-green-600 text-white'
                : 'bg-orange-700 hover:bg-orange-600 text-white'
            }`}
          >
            {toggling ? '...' : isHumanTakeover ? '🤖 Reactivar IA' : '👤 Tomar control'}
          </button>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {loading && (
          <div className="text-center text-gray-600 text-sm py-8">Cargando mensajes...</div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center text-gray-700 text-sm py-8">Sin mensajes en esta conversación</div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.direction === 'outbound'
                  ? 'bg-yellow-600 text-white rounded-br-sm'
                  : 'bg-gray-800 text-gray-200 rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-yellow-200/70' : 'text-gray-500'}`}>
                {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Barra inferior cuando el humano tiene control */}
      {isHumanTakeover && (
        <div className="px-4 py-2 bg-orange-950/40 border-t border-orange-800/30 text-orange-400 text-xs text-center shrink-0">
          Modo asesor humano activo — el bot está silenciado. Responde directamente desde WhatsApp/Instagram.
        </div>
      )}
    </div>
  );
}
