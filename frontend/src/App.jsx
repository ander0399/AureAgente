import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Dashboard from './components/Dashboard';
import Inbox from './components/Inbox';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');

export default function App() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState({ open: 0, humanTakeover: 0, resolved: 0, cartRecovered: 0 });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('conversation:update', (conv) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conv.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = conv;
          return updated;
        }
        return [conv, ...prev];
      });
    });

    socket.on('stats:update', (s) => setStats(s));

    // Cargar conversaciones iniciales
    fetch('/api/conversations')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setConversations(data))
      .catch(() => {});

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('conversation:update');
      socket.off('stats:update');
    };
  }, []);

  const tabs = [
    { id: 'inbox', label: '📬 Bandeja' },
    { id: 'dashboard', label: '📊 Dashboard' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="bg-gray-900 border-b border-yellow-700/30 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-widest text-yellow-400">AURE</span>
          <span className="text-gray-500 text-xs uppercase tracking-wider">Panel de Control</span>
        </div>

        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-500'}`} />
          <span className="text-gray-500">{connected ? 'En línea' : 'Desconectado'}</span>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {activeTab === 'inbox' ? (
          <Inbox conversations={conversations} socket={socket} />
        ) : (
          <Dashboard stats={stats} conversations={conversations} />
        )}
      </main>
    </div>
  );
}
