const STATE_LABELS = {
  BOT_ACTIVE: 'Bot activo',
  HUMAN_TAKEOVER: 'Atención humana',
  RESOLVED: 'Resuelta',
  CLOSED: 'Cerrada',
};

const STATE_COLORS = {
  BOT_ACTIVE: 'bg-green-500',
  HUMAN_TAKEOVER: 'bg-orange-500',
  RESOLVED: 'bg-blue-500',
  CLOSED: 'bg-gray-500',
};

export default function Dashboard({ stats, conversations }) {
  const cards = [
    { label: 'Conversaciones Abiertas', value: stats.open ?? conversations.filter((c) => c.state === 'BOT_ACTIVE').length, icon: '💬', color: 'blue' },
    { label: 'Atención Humana', value: stats.humanTakeover ?? conversations.filter((c) => c.state === 'HUMAN_TAKEOVER').length, icon: '👤', color: 'orange' },
    { label: 'Resueltas Hoy', value: stats.resolved ?? 0, icon: '✅', color: 'green' },
    { label: 'Carritos Recuperados', value: stats.cartRecovered ?? 0, icon: '🛒', color: 'yellow' },
  ];

  const colorMap = {
    blue: 'bg-blue-900/30 border-blue-700/40 text-blue-300',
    orange: 'bg-orange-900/30 border-orange-700/40 text-orange-300',
    green: 'bg-green-900/30 border-green-700/40 text-green-300',
    yellow: 'bg-yellow-900/30 border-yellow-700/40 text-yellow-300',
  };

  const channelCount = conversations.reduce((acc, c) => {
    acc[c.channel] = (acc[c.channel] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg font-semibold text-gray-200">Resumen en Tiempo Real</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-xl border p-5 ${colorMap[card.color]}`}>
            <div className="text-3xl mb-2">{card.icon}</div>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-xs mt-1 opacity-75">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 className="text-gray-300 font-medium mb-4 text-sm uppercase tracking-wider">Por Canal</h3>
          <div className="space-y-3">
            {[
              { channel: 'whatsapp', label: 'WhatsApp', icon: '📱' },
              { channel: 'instagram', label: 'Instagram', icon: '📸' },
              { channel: 'facebook', label: 'Facebook', icon: '👤' },
            ].map(({ channel, label, icon }) => (
              <div key={channel} className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">{icon} {label}</span>
                <span className="text-white font-medium">{channelCount[channel] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 className="text-gray-300 font-medium mb-4 text-sm uppercase tracking-wider">Por Estado</h3>
          <div className="space-y-3">
            {Object.entries(STATE_LABELS).map(([state, label]) => (
              <div key={state} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${STATE_COLORS[state]}`} />
                  <span className="text-gray-400 text-sm">{label}</span>
                </div>
                <span className="text-white font-medium">
                  {conversations.filter((c) => c.state === state).length}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h3 className="text-gray-300 font-medium mb-3 text-sm uppercase tracking-wider">
          Actividad Reciente
        </h3>
        {conversations.length === 0 ? (
          <p className="text-gray-600 text-sm">Los eventos aparecerán aquí en tiempo real vía WebSocket.</p>
        ) : (
          <div className="space-y-2">
            {conversations.slice(0, 5).map((conv) => (
              <div key={conv.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${STATE_COLORS[conv.state] || 'bg-gray-500'}`} />
                  <span className="text-gray-300 text-sm">{conv.User?.name || 'Sin nombre'}</span>
                  <span className="text-gray-600 text-xs capitalize">{conv.channel}</span>
                </div>
                <span className="text-gray-500 text-xs">{STATE_LABELS[conv.state]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
