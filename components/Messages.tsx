
'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { db } from '../app/fconfig';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ThemeContext } from '../context/ThemeContext';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isSentByUser: boolean;
}

interface MessagesProps {
  messageCount: number;
  setMessageCount: (count: number) => void;
  onClick: () => void;
  theme: 'light' | 'dark';
}

export default function Messages({ messageCount, setMessageCount, onClick, theme }: MessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('Messages must be used within a ThemeProvider');
  }

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        text: doc.data().text,
        timestamp: doc.data().timestamp.toDate(),
        isSentByUser: doc.data().isSentByUser || false,
      }));
      setMessages(fetchedMessages);
      // Count only received messages (not sent by user)
      const receivedMessages = fetchedMessages.filter((msg) => !msg.isSentByUser).length;
      setMessageCount(receivedMessages);
    });

    return () => unsubscribe();
  }, [setMessageCount]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        timestamp: new Date(),
        isSentByUser: true,
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="relative group">
      <button
        className={`p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          theme === 'light'
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            : 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
        }`}
        onClick={() => {
          setIsOpen(!isOpen);
          onClick();
        }}
        aria-label="Toggle message window"
      >
        <MessageSquare size={24} />
        {messageCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse`}
          >
            {messageCount}
          </span>
        )}
      </button>

      <div
        className={`fixed top-0 right-0 h-full transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } z-50 rounded-xl shadow-2xl overflow-hidden transform transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } w-[calc(100vw-256px)] md:w-[calc(100vw-256px)] max-w-2xl ${
          theme === 'light' ? 'bg-white' : 'bg-gray-800'
        }`}
      >
        <div className="flex flex-col h-full">
          <div
            className={`p-4 border-b flex justify-between items-center ${
              theme === 'light'
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-zinc-800 border-gray-200'
                : 'bg-gradient-to-r from-gray-700 to-gray-800 text-white border-gray-600'
            }`}
          >
            <h3 className={`text-lg font-semibold ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
              Messages
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1 rounded-full transition-colors duration-200 ${
                theme === 'light' ? 'text-gray-600 hover:bg-blue-100' : 'text-gray-300 hover:bg-gray-600'
              }`}
              aria-label="Close message window"
            >
              <X size={20} className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'} />
            </button>
          </div>

          <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
            {[...messages].reverse().map((message) => (
              <div
                key={message.id}
                className={`max-w-[75%] p-3 rounded-lg shadow-sm ${
                  message.isSentByUser
                    ? theme === 'light'
                      ? 'bg-blue-600 text-white ml-auto'
                      : 'bg-gray-700 text-white ml-auto'
                    : theme === 'light'
                    ? 'bg-blue-100 text-gray-900'
                    : 'bg-gray-600 text-white'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} mt-1`}>
                  {message.timestamp.toLocaleString()}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div
            className={`p-4 border-t ${
              theme === 'light'
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-gray-200'
                : 'bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600'
            }`}
          >
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className={`flex-1 p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                  theme === 'light' ? 'bg-white text-gray-900 border-gray-300' : 'bg-gray-700 text-white border-gray-600'
                }`}
              />
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                } disabled:opacity-50`}
                disabled={!newMessage.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
