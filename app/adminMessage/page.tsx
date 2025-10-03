'use client';

import { useState, useEffect, useContext } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../fconfig';
import { toast } from 'react-toastify';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext,  } from '../../context/LanguageContext';

// Define interface for message
interface Message {
  content: string;
  senderName: string;
  senderEmail: string;
  receiver: string;
  timestamp: string;
  read?: boolean;
}

// Define interface for user
interface User {
  email: string;
  firstName: string;
}

// Define interface for conversation
interface Conversation {
  user: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  docId: string; // Store document ID for fetching messages
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0); // Total unread messages for admin
  const [showUsers, setShowUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const themeContext = useContext(ThemeContext);
  const languageContext = useContext(LanguageContext);

  if (!themeContext) {
    throw new Error('Messages must be used within a ThemeProvider');
  }

  if (!languageContext) {
    throw new Error('Messages must be used within a LanguageProvider');
  }

  const { theme } = themeContext;
  const { t } = languageContext;

  // Generate consistent conversation ID
  const getConversationId = (email1: string, email2: string) => {
    const emails = [email1.replace(/[@.]/g, '_'), email2.replace(/[@.]/g, '_')].sort();
    return `${emails[0]}_${emails[1]}`;
  };

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollectionRef = collection(db, 'GYM');
        const usersSnapshot = await getDocs(usersCollectionRef);
        const fetchedUsers: User[] = usersSnapshot.docs.map((doc) => ({
          email: doc.data().email || 'Unknown',
          firstName: doc.data().firstName || 'Unknown',
        }));
        setUsers(fetchedUsers);
        console.log('Users fetched:', fetchedUsers.length, fetchedUsers.map(u => u.email));
      } catch (error: any) {
        console.error('Error fetching users:', error);
        toast.error(t.fetchUsersError || 'Failed to fetch users');
      }
    };

    fetchUsers();
  }, [t]);

  // Fetch conversations and listen for real-time updates
  useEffect(() => {
    if (users.length === 0) {
      console.log('No users fetched yet, skipping conversation fetch');
      return;
    }

    setLoading(true);
    const messagesCollectionRef = collection(db, 'messages');
    
    const unsubscribe = onSnapshot(messagesCollectionRef, (snapshot) => {
      try {
        const conversationList: Conversation[] = [];
        const userEmails = new Set<string>();
        let totalUnread = 0;

        snapshot.forEach((doc) => {
          const docId = doc.id;
          const data = doc.data();
          const messages: Message[] = data.messages || [];

          if (messages.length === 0) return;

          const adminAsSender = messages.some(msg => msg.senderEmail === 'admin');
          const adminAsReceiver = messages.some(msg => msg.receiver === 'admin');

          if (!adminAsSender && !adminAsReceiver) return;

          let otherUserEmail = '';

          if (adminAsSender) {
            otherUserEmail = messages.find(msg => msg.senderEmail === 'admin')?.receiver || '';
          } else if (adminAsReceiver) {
            otherUserEmail = messages.find(msg => msg.receiver === 'admin')?.senderEmail || '';
          }

          if (otherUserEmail && !userEmails.has(otherUserEmail)) {
            userEmails.add(otherUserEmail);
            const user = users.find(u => u.email === otherUserEmail) || {
              email: otherUserEmail,
              firstName: 'Unknown',
            };
            const lastMessage = messages[messages.length - 1];
            const unreadCount = messages.filter(msg => msg.receiver === 'admin' && !msg.read).length;
            totalUnread += unreadCount;
            conversationList.push({
              user,
              lastMessage: lastMessage?.content || '',
              lastMessageTime: lastMessage?.timestamp || '',
              unreadCount,
              docId,
            });
          }
        });

        conversationList.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
        setConversations(conversationList);
        setTotalUnreadCount(totalUnread);
        console.log('Conversations fetched:', conversationList.length, 'Total unread:', totalUnread);
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching conversations:', error);
        toast.error(t.fetchConversationUsersError || 'Failed to fetch conversations');
        setLoading(false);
      }
    }, (error) => {
      console.error('Snapshot error:', error);
      toast.error(t.fetchConversationUsersError || 'Failed to fetch conversations');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [users, t]);

  // Fetch messages for selected user
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser?.email) {
        setMessages([]);
        return;
      }

      setLoading(true);
      try {
        const conversationId = getConversationId('admin', selectedUser.email);
        const messageDocRef = doc(db, 'messages', conversationId);
        const messageSnap = await getDoc(messageDocRef);

        let fetchedMessages: Message[] = [];

        if (messageSnap.exists()) {
          const messageData = messageSnap.data();
          fetchedMessages = (messageData.messages || []).map((msg: any) => ({
            content: msg.content || '',
            senderName: msg.senderName || (msg.senderEmail === 'admin' ? 'Admin' : selectedUser.firstName),
            senderEmail: msg.senderEmail || 'admin',
            receiver: msg.receiver || selectedUser.email,
            timestamp: msg.timestamp || '',
            read: msg.read || false,
          }));
        }

        fetchedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMessages(fetchedMessages);
        console.log(`Messages fetched for conversation with ${selectedUser.email}:`, fetchedMessages.length);

        // Mark messages as read
        const unreadMessages = fetchedMessages.filter(msg => msg.receiver === 'admin' && !msg.read);
        if (unreadMessages.length > 0) {
          await updateDoc(messageDocRef, {
            messages: fetchedMessages.map(msg => ({
              ...msg,
              read: msg.receiver === 'admin' ? true : msg.read,
            })),
          });
          // Update conversations and total unread count
          setConversations(prev =>
            prev.map(conv =>
              conv.user.email === selectedUser.email ? { ...conv, unreadCount: 0 } : conv
            )
          );
          // Recalculate total unread count
          const messagesCollectionRef = collection(db, 'messages');
          const messagesSnapshot = await getDocs(messagesCollectionRef);
          let totalUnread = 0;
          for (const doc of messagesSnapshot.docs) {
            const messages: Message[] = doc.data().messages || [];
            totalUnread += messages.filter(msg => msg.receiver === 'admin' && !msg.read).length;
          }
          setTotalUnreadCount(totalUnread);
        }
      } catch (error: any) {
        console.error('Error fetching messages:', error);
        toast.error(t.fetchError || 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser, t]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.warn(t.emptyMessage || 'Message cannot be empty');
      return;
    }

    if (!selectedUser?.email) {
      toast.warn(t.selectUser || 'Please select a user to message');
      return;
    }

    try {
      const messageData = {
        content: newMessage,
        senderName: 'Admin',
        senderEmail: 'admin',
        receiver: selectedUser.email,
        timestamp: new Date().toISOString(),
        read: false,
      };

      const conversationId = getConversationId('admin', selectedUser.email);
      const messageDocRef = doc(db, 'messages', conversationId);
      const messageSnap = await getDoc(messageDocRef);

      if (messageSnap.exists()) {
        await updateDoc(messageDocRef, {
          messages: arrayUnion(messageData),
        });
      } else {
        await setDoc(messageDocRef, {
          messages: [messageData],
        });
      }

      setMessages((prev) => [
        ...prev,
        messageData,
      ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
      setNewMessage('');
      toast.success(t.messageSent || 'Message sent successfully');

      // Update conversations list
      const existingConversation = conversations.find(conv => conv.user.email === selectedUser.email);
      if (!existingConversation) {
        setConversations(prev => [
          {
            user: selectedUser,
            lastMessage: messageData.content,
            lastMessageTime: messageData.timestamp,
            unreadCount: 0,
            docId: conversationId,
          },
          ...prev,
        ].sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()));
      } else {
        setConversations(prev =>
          prev
            .map(conv =>
              conv.user.email === selectedUser.email
                ? { ...conv, lastMessage: messageData.content, lastMessageTime: messageData.timestamp, unreadCount: 0, docId: conversationId }
                : conv
            )
            .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t.sendError || 'Failed to send message');
    }
  };

  const toggleUsersDisplay = () => {
    setShowUsers(!showUsers);
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setShowUsers(false);
    console.log('Selected user email:', user.email);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <span className={theme === 'light' ? 'text-blue-900' : 'text-white'}>{t.loading || 'Loading...'}</span>
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
        <div className="flex items-center space-x-2">
          <h2
            className={`text-3xl font-extrabold tracking-tight ${
              theme === 'light' ? 'text-blue-900' : 'text-white'
            }`}
          >
            {selectedUser ? `Chat with ${selectedUser.firstName}` : (t.messages || 'Messages')}
          </h2>
          {!selectedUser && totalUnreadCount > 0 && (
            <span
              className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                theme === 'light' ? 'bg-teal-600 text-white' : 'bg-teal-300 text-black'
              }`}
            >
              {totalUnreadCount}
            </span>
          )}
        </div>
      </header>

      <main className={`flex-1 p-8 flex flex-col relative ${
        theme === 'light' ? 'bg-gradient-to-br from-blue-50 to-teal-50 text-blue-900' : 'bg-gradient-to-br from-blue-950 to-teal-950 text-white'
      }`}>
        {selectedUser ? (
          <>
            <button
              onClick={() => setSelectedUser(null)}
              className={`mb-4 p-2 rounded-xl transition-all duration-300 ${
                theme === 'light' ? 'bg-blue-200 hover:bg-blue-300 text-blue-900' : 'bg-blue-700 hover:bg-blue-600 text-white'
              }`}
              aria-label={t.backToChats || 'Back to chats'}
            >
              <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              {t.backToChats || 'Back to Chats'}
            </button>
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
                  messages.map((message, index) => {
                    const isCurrentUser = message.senderEmail === 'admin';
                    return (
                      <div
                        key={index}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-2xl transition-all duration-200 ${
                            isCurrentUser
                              ? theme === 'light'
                                ? 'bg-teal-600 text-white'
                                : 'bg-teal-300 text-black'
                              : theme === 'light'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-blue-800 text-white'
                          } hover:shadow-md`}
                        >
                          <p className="text-sm font-semibold">{message.senderName}</p>
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
                  <p className={`text-center flex-1 text-lg ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
                    {t.noMessages || 'No messages yet. Start the conversation!'}
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
                  } hover:scale-105`}
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
          </>
        ) : (
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
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder || 'Search conversations...'}
              className={`mb-4 p-3 rounded-2xl border ${
                theme === 'light'
                  ? 'bg-white bg-opacity-90 border-blue-100 text-blue-900'
                  : 'bg-blue-800 bg-opacity-90 border-teal-800 text-white'
              } focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all duration-300`}
              aria-label={t.searchPlaceholder || 'Search conversations'}
            />
            <h3
              className={`text-lg font-semibold mb-3 ${
                theme === 'light' ? 'text-blue-900' : 'text-white'
              }`}
            >
              {t.conversationUsers || 'Conversations'}
            </h3>
            {filteredConversations.length > 0 ? (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredConversations.map((conv, index) => (
                  <button
                    key={index}
                    onClick={() => handleUserSelect(conv.user)}
                    className={`w-full text-left p-3 rounded-xl flex items-center space-x-3 hover:scale-105 transition-transform duration-200 ${
                      theme === 'light' ? 'bg-blue-100 hover:bg-blue-200 text-blue-900' : 'bg-blue-700 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      theme === 'light' ? 'bg-teal-600 text-white' : 'bg-teal-300 text-black'
                    }`}>
                      <span className="text-sm font-bold">{conv.user.firstName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{conv.user.firstName}</p>
                      <p className="text-xs opacity-70 truncate">{conv.lastMessage}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
                        {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString() : ''}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                          theme === 'light' ? 'bg-teal-600 text-white' : 'bg-teal-300 text-black'
                        }`}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className={`text-center text-lg ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
                {t.noConversationUsers || 'No active conversations.'}
              </p>
            )}
          </div>
        )}
        {showUsers && (
          <div
            className={`absolute bottom-20 right-8 w-64 rounded-3xl shadow-2xl p-4 border z-50 transition-all duration-300 transform ${
              theme === 'light' ? 'bg-white bg-opacity-95 text-blue-900 border-blue-100' : 'bg-blue-800 bg-opacity-95 text-white border-teal-800'
            } ${showUsers ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}
            style={{
              boxShadow: theme === 'light'
                ? '0 10px 30px rgba(59, 130, 246, 0.3)'
                : '0 10px 30px rgba(45, 212, 191, 0.3)',
            }}
          >
            <h3
              className={`text-lg font-semibold mb-3 ${
                theme === 'light' ? 'text-blue-900' : 'text-white'
              }`}
            >
              {t.allUsers || 'All Users'}
            </h3>
            {users.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {users.map((user, index) => (
                  <button
                    key={index}
                    onClick={() => handleUserSelect(user)}
                    className={`w-full text-left p-3 rounded-xl flex items-center space-x-3 hover:scale-105 transition-transform duration-200 ${
                      theme === 'light' ? 'bg-blue-100 hover:bg-blue-200 text-blue-900' : 'bg-blue-700 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      theme === 'light' ? 'bg-teal-600 text-white' : 'bg-teal-300 text-black'
                    }`}>
                      <span className="text-sm font-bold">{user.firstName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{user.firstName}</p>
                      <p className="text-xs opacity-70">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className={`text-center text-sm ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
                {t.noUsers || 'No users found.'}
              </p>
            )}
          </div>
        )}
        {!selectedUser && (
          <button
            onClick={toggleUsersDisplay}
            className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-50 ${
              theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
            }`}
            aria-label={t.newConversation || 'Start new conversation'}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        )}
      </main>
    </div>
  );
}