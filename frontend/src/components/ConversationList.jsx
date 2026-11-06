import { useState } from 'react';

const CHANNEL_ICONS = { whatsapp: '📱', instagram: '📸', facebook: '👥' };

const STATE_DOT = {
  BOT_ACTIVE: 'bg-green-400',
  HUMAN_TAKEOVER: 'bg-orange-400',
  RESOLVED: 'bg-blue-400',
  CLOSED: 'bg-gray-500',
};

const STATE_LABEL = {
  BOT_ACTIVE: 'Bot activo',
  HUMAN_TAKEOVER: 'Humano',
  RESOLVED: 'Resuelta',
  CLOSED: 'Cerrada',
};

export default function ConversationList({ conversations, selected, onSelect }) {
  const [filter, setFilter] = useState('all');

  const filtered = conversations.filter((c) => {
    if (filter === 'bot') return c.state === 'BOT_ACTIVE';
    if (filter === 'human') return c.state === 'HUMAN_TAKEOVER';
    return true;
  });

  return (
    <div className="w-72 border-r border-gray-800 flex flex-col bg-gray-900 shrink-0">
      <div className="p-4 border-b border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-200 text-sm">Conversaciones</h3>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {conversations.length}
          </span>
        </div>
        <div className="flex gap-1">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'bot', label: '🤖 Bot' },
            { id: 'human', label: '👤 Humano' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-1 rounded text-xs transition-colors ${
                filter === f.id ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-6 text-center text-gray-600 text-sm">
            {conversations.length === 0
              ? 'Las conversaciones aparecerán aquí en tiempo real'
              : 'Sin conversaciones en este filtro'}
          </div>
        )}
        {filtered.map((conv) => {
          const isSelected = selected?.id === conv.id;
          const lastMsg = conv.Messages?.[0];
          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`w-full text-left px-4 py-3 border-b border-gray-800 hover:bg-gray-800/60 transition-colors ${
                isSelected ? 'bg-gray-800 border-l-2 border-l-yellow-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-200 truncate max-w-[160px]">
                  {CHANNEL_ICONS[conv.channel]} {conv.User?.name || conv.User?.channelUserId || 'Sin nombre'}
                </span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${STATE_DOT[conv.state] || 'bg-gray-500'}`} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 truncate max-w-[180px]">
                  {lastMsg?.content || 'Sin mensajes aún'}
                </span>
                <span className="text-xs text-gray-600 ml-1 shrink-0">{STATE_LABEL[conv.state]}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
