'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../fconfig';
import { toast } from 'react-toastify';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';

// Define interface for message
interface Message {
  id: string;
  content: string;
  senderEmail: string;
  senderName: string;
  timestamp: string;
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const router = useRouter();
  const themeContext = useContext(ThemeContext);
  const languageContext = useContext(LanguageContext);

  if (!themeContext) {
    throw new Error('Messages must be used within a ThemeProvider');
  }

  if (!languageContext) {
    throw new Error('Messages must be used within a LanguageProvider');
  }

  const { theme } = themeContext;
  const { t = {} } = languageContext;

  useEffect(() => {
    const validateSessionAndFetchUser = async () => {
      try {
        // Validate session to get user email
        const response = await fetch('/api/validate', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          toast.error(t.pleaseLogin || 'Please log in to access this page');
          router.push('/');
          return;
        }

        const data = await response.json();
        const email = data.email || 'Unknown';
        setUserEmail(email);
        console.log('User authorized for messages:', email);

        // Fetch user data from GYM collection
        const userRef = doc(db, 'GYM', email);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserName(userData.firstName || 'Unknown');
          console.log('User firstName fetched:', userData.firstName);
        } else {
          console.warn('User data not found in GYM collection for:', email);
          setUserName('Unknown');
          toast.warn(t.userDataNotFound || 'User data not found. Please contact support.');
        }
      } catch (error) {
        console.error('Session validation or user data fetch error:', error);
        toast.error(t.pleaseLogin || 'Please log in to access this page');
        router.push('/');
      }
    };

    validateSessionAndFetchUser();
  }, [router, t]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!userEmail) {
        console.log('No user email, skipping message fetch');
        return;
      }

      setLoading(true);
      try {
        const messagesQuery = query(
          collection(db, 'messages'),
          orderBy('timestamp', 'asc')
        );
        const messagesSnap = await getDocs(messagesQuery);
        const fetchedMessages: Message[] = messagesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];

        setMessages(fetchedMessages);
        console.log('Messages fetched:', fetchedMessages.length);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error(t.fetchError || 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      fetchMessages();
    }
  }, [userEmail, t]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.warn(t.emptyMessage || 'Message cannot be empty');
      return;
    }

    try {
      const messageData = {
        content: newMessage,
        senderEmail: userEmail,
        senderName: userName,
        timestamp: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);
      setMessages((prev) => [
        ...prev,
        { id: docRef.id, ...messageData, timestamp: new Date().toISOString() },
      ]);
      setNewMessage('');
      toast.success(t.messageSent || 'Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t.sendError || 'Failed to send message');
    }
  };

  if (loading) {
    return (
      <div
        className={`flex h-screen items-center justify-center ${
          theme === 'light' ? 'bg-blue-50 bg-opacity-30' : 'bg-blue-950 bg-opacity-50'
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M29 58C13.536 58 1 45.464 1 30 1 14.536 13.536 2 29 2c8.467 0 16.194 3.832 21.213 10.106C55.232 18.38 58 25.534 58 33c0 7.466-2.768 14.62-7.787 20.894C45.194 54.168 37.467 58 29 58z' fill='%23${theme === 'light' ? 'a3bffa' : '2a4365'}' fill-opacity='0.1'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <svg className={`h-8 w-8 animate-spin mr-2 ${theme === 'light' ? 'text-teal-600' : 'text-teal-300'}`} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className={theme === 'light' ? 'text-blue-900' : 'text-white'}>{t.loading || 'Loading messages...'}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen flex-col font-sans transition-colors duration-500 ${
        theme === 'light' ? 'bg-blue-50 bg-opacity-30' : 'bg-blue-950 bg-opacity-50'
      }`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M29 58C13.536 58 1 45.464 1 30 1 14.536 13.536 2 29 2c8.467 0 16.194 3.832 21.213 10.106C55.232 18.38 58 25.534 58 33c0 7.466-2.768 14.62-7.787 20.894C45.194 54.168 37.467 58 29 58z' fill='%23${theme === 'light' ? 'a3bffa' : '2a4365'}' fill-opacity='0.1'/%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      <header
        className={`shadow-2xl p-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-500 ${
          theme === 'light'
            ? 'bg-gradient-to-r from-blue-100 to-teal-100 text-blue-900'
            : 'bg-gradient-to-r from-blue-900 to-teal-900 text-white'
        }`}
      >
        <h2
          className={`text-3xl font-extrabold tracking-tight ${
            theme === 'light' ? 'text-blue-900' : 'text-white'
          }`}
        >
          {t.messages || 'Messages'}
        </h2>
      </header>

      <main className={`flex-1 p-8 flex flex-col ${
        theme === 'light' ? 'bg-gradient-to-br from-blue-50 to-teal-50 text-blue-900' : 'bg-gradient-to-br from-blue-950 to-teal-950 text-white'
      }`}>
        <div
          className={`rounded-3xl shadow-2xl p-6 border relative overflow-hidden flex-1 flex flex-col ${
            theme === 'light' ? 'bg-white bg-opacity-90 text-blue-900 border-blue-100' : 'bg-blue-800 bg-opacity-90 text-white border-teal-800'
          }`}
          style={{
            boxShadow: theme === 'light'
              ? '0 10px 30px rgba(59, 130, 246, 0.3), 0 4px 10px rgba(59, 130, 246, 0.2)'
              : '0 10px 30px rgba(45, 212, 191, 0.3), 0 4px 10px rgba(45, 212, 191, 0.2)',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10z' fill='%23${theme === 'light' ? 'dbeafe' : '1e3a8a'}' fill-opacity='0.05'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          <div className="flex-1 flex flex-col space-y-4 max-h-[60vh] overflow-y-auto">
            {messages.length > 0 ? (
              messages.map((message) => {
                const isCurrentUser = message.senderEmail === userEmail;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-2xl ${
                        isCurrentUser
                          ? theme === 'light'
                            ? 'bg-teal-600 text-white'
                            : 'bg-teal-300 text-black'
                          : theme === 'light'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-blue-800 text-white'
                      }`}
                    >
                      <p className="text-sm font-semibold">{message.senderName || 'Unknown'}</p>
                      <p className="mt-1">{message.content || t.noContent || 'No content'}</p>
                      <p className={`text-xs mt-2 ${
                        isCurrentUser
                          ? theme === 'light'
                            ? 'text-teal-200'
                            : 'text-teal-900'
                          : theme === 'light'
                            ? 'text-blue-500'
                            : 'text-teal-400'
                      }`}>
                        {message.timestamp ? new Date(message.timestamp).toLocaleString() : t.noTimestamp || 'No timestamp'}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className={`text-center flex-1 ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
                {t.noMessages || 'No messages found.'}
              </p>
            )}
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t.messagePlaceholder || 'Type a message...'}
              className={`flex-1 p-3 rounded-2xl border ${
                theme === 'light'
                  ? 'bg-white bg-opacity-90 border-blue-100 text-blue-900'
                  : 'bg-blue-800 bg-opacity-90 border-teal-800 text-white'
              } focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all duration-300`}
              aria-label={t.messagePlaceholder || 'Type a message'}
            />
            <button
              onClick={handleSendMessage}
              className={`p-3 rounded-2xl transition-all duration-300 ${
                theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
              }`}
              aria-label={t.sendMessage || 'Send message'}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}