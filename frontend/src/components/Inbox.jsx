import { useState } from 'react';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';

export default function Inbox({ conversations, socket }) {
  const [selected, setSelected] = useState(null);

  function handleSelect(conv) {
    setSelected(conv);
  }

  return (
    <div className="flex h-full overflow-hidden">
      <ConversationList
        conversations={conversations}
        selected={selected}
        onSelect={handleSelect}
      />
      <ChatWindow
        conversation={selected}
        socket={socket}
        onConversationUpdate={(updated) => {
          if (selected?.id === updated.id) setSelected(updated);
        }}
      />
    </div>
  );
}
