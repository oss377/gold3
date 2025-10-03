'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../fconfig';
import { toast } from 'react-toastify';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';

// Define interface for translations
interface Translations {
  messageDeleted: string;
  pleaseLogin?: string;
  fetchError?: string;
  userDataNotFound?: string;
  emptyMessage?: string;
  messageSent?: string;
  sendError?: string;
  messagePinned?: string;
  messageUnpinned?: string;
  pinError?: string;
  cannotDelete?: string;
  deleteError?: string;
  groupCreationError?: string;
  groupCreated?: string;
  loading?: string;
  messages?: string;
  welcome?: string;
  newChat?: string;
  createGroup?: string;
  conversations?: string;
  noConversations?: string;
  noMessages?: string;
  selectConversation?: string;
  pinnedMessages?: string;
  unpin?: string;
  pin?: string;
  reply?: string;
  delete?: string;
  backToConversations?: string;
  selectRecipient?: string;
  changeRecipient?: string;
  replyingTo?: string;
  cancel?: string;
  messagePlaceholder?: string;
  sendMessage?: string;
  groupNamePlaceholder?: string;
  selectUsers?: string;
  create?: string;
  noContent?: string;
  noTimestamp?: string;
}

// Define interface for LanguageContext
interface LanguageContextType {
  t: Translations;
}

// Define interface for message
interface Message {
  content: string;
  senderEmail: string;
  senderName: string;
  receiver: string; // For private chats; 'group_[groupId]' for groups
  timestamp: string;
  read?: boolean;
  conversationId: string; // 'private_[email1]_[email2]' or 'group_[groupId]'
  groupId?: string; // For group messages
  isPinned?: boolean; // For pinned messages
}

// Define interface for user
interface User {
  email: string;
  firstName: string;
}

// Define interface for conversation
interface Conversation {
  otherUser?: User; // For private chats
  groupId?: string; // For group chats
  groupName?: string; // For group chats
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  conversationId: string;
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<{ type: 'user' | 'group'; value: string; name: string } | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
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
  const { t } = languageContext as unknown as LanguageContextType; // Explicitly cast to the correct type

  // Generate consistent conversation ID
  const getConversationId = (email1: string, email2: string) => {
    const emails = [email1.replace(/[@.]/g, '_'), email2.replace(/[@.]/g, '_')].sort();
    return `private_${emails[0]}_${emails[1]}`;
  };

  // Generate group conversation ID
  const getGroupConversationId = (groupId: string) => `group_${groupId}`;

  // Fetch user data, validate session, and fetch all users
  useEffect(() => {
    const validateSessionAndFetchUser = async () => {
      try {
        const response = await fetch('/api/validate', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          toast.error(t.pleaseLogin || 'Please log in to access this page');
          router.push('/login');
          return;
        }

        const data = await response.json();
        const email = data.email || '';
        if (!email) {
          toast.error(t.pleaseLogin || 'Please log in to access this page');
          router.push('/login');
          return;
        }

        setUserEmail(email);
        setIsAuthorized(true);
        console.log('User authorized:', email);

        const userRef = doc(db, 'GYM', email);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserName(userData.firstName || 'User');
          console.log('User firstName fetched from Firebase:', userData.firstName);
        } else {
          console.warn('User data not found in GYM collection for:', email);
          setUserName('User');
          toast.warn(t.userDataNotFound || 'User data not found. Please contact support.');
        }

        const usersCollectionRef = collection(db, 'GYM');
        const usersSnapshot = await getDocs(usersCollectionRef);
        const fetchedUsers: User[] = usersSnapshot.docs
          .map((doc) => ({
            email: doc.data().email || 'Unknown',
            firstName: doc.data().firstName || 'User',
          }))
          .filter((user) => user.email !== email); // Exclude current user
        fetchedUsers.push({ email: 'admin', firstName: 'Admin' });
        setUsers(fetchedUsers);
        console.log('Users fetched:', fetchedUsers.length, fetchedUsers.map(u => u.email));
      } catch (error) {
        console.error('Session validation or user data fetch error:', error);
        toast.error(t.pleaseLogin || 'Please log in to access this page');
        router.push('/login');
      }
    };

    validateSessionAndFetchUser();
  }, [router, t]);

  // Fetch all messages and listen for real-time updates
  useEffect(() => {
    if (!isAuthorized || !userEmail || users.length === 0) {
      console.log('Not authorized, no user email, or no users, skipping message fetch');
      return;
    }

    setLoading(true);
    const messageDocRef = doc(db, 'publicMessage', 'allMessages');

    const unsubscribe = onSnapshot(messageDocRef, (messageSnap) => {
      try {
        let fetchedMessages: Message[] = [];
        let fetchedPinned: Message[] = [];
        if (messageSnap.exists()) {
          const messageData = messageSnap.data();
          fetchedMessages = (messageData.messages || []).map((msg: any) => {
            const sender = users.find(u => u.email === msg.senderEmail) || {
              email: msg.senderEmail || '',
              firstName: msg.senderEmail === 'admin' ? 'Admin' : 'User',
            };
            return {
              content: msg.content || '',
              senderEmail: msg.senderEmail || '',
              senderName: sender.firstName,
              receiver: msg.receiver || '',
              timestamp: msg.timestamp || '',
              read: msg.read || false,
              conversationId: msg.conversationId || (msg.groupId ? getGroupConversationId(msg.groupId) : getConversationId(msg.senderEmail, msg.receiver)),
              groupId: msg.groupId || '',
              isPinned: msg.isPinned || false,
            };
          });
          fetchedPinned = messageData.pinnedMessages || [];
        }

        fetchedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setAllMessages(fetchedMessages);
        setPinnedMessages(fetchedPinned);
        console.log('All messages fetched:', fetchedMessages.length);

        // Build conversation list
        const conversationMap = new Map<string, Conversation>();
        const userEmails = new Set<string>();

        fetchedMessages.forEach((msg) => {
          const convId = msg.conversationId;
          const isGroup = msg.groupId;
          const isUserInvolved = isGroup
            ? true // Assume user is in group for simplicity
            : msg.senderEmail === userEmail || msg.receiver === userEmail;
          if (!isUserInvolved) return;

          if (isGroup) {
            if (!conversationMap.has(convId)) {
              const convMessages = fetchedMessages.filter(m => m.conversationId === convId);
              const lastMessage = convMessages[convMessages.length - 1];
              const unreadCount = convMessages.filter(m => m.receiver === userEmail && !m.read).length;
              conversationMap.set(convId, {
                groupId: msg.groupId,
                groupName: `Group ${msg.groupId}`,
                lastMessage: lastMessage?.content || '',
                lastMessageTime: lastMessage?.timestamp || '',
                unreadCount,
                conversationId: convId,
              });
            }
          } else {
            let otherUserEmail = msg.senderEmail === userEmail ? msg.receiver : msg.senderEmail;
            if (userEmails.has(otherUserEmail)) return;
            userEmails.add(otherUserEmail);

            const otherUser = users.find(u => u.email === otherUserEmail) || {
              email: otherUserEmail,
              firstName: otherUserEmail === 'admin' ? 'Admin' : 'User',
            };
            const convMessages = fetchedMessages.filter(m => m.conversationId === convId);
            const lastMessage = convMessages[convMessages.length - 1];
            const unreadCount = convMessages.filter(m => m.receiver === userEmail && !m.read).length;

            conversationMap.set(convId, {
              otherUser,
              lastMessage: lastMessage?.content || '',
              lastMessageTime: lastMessage?.timestamp || '',
              unreadCount,
              conversationId: convId,
            });
          }
        });

        const conversationList = Array.from(conversationMap.values()).sort(
          (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
        setConversations(conversationList);
        console.log('Conversations built:', conversationList.length);

        // Update selected conversation messages
        if (selectedConversationId) {
          const selectedMessages = fetchedMessages.filter(m => m.conversationId === selectedConversationId);
          setMessages(selectedMessages);
          if (selectedMessages.some(m => m.receiver === userEmail && !m.read)) {
            updateDoc(messageDocRef, {
              messages: fetchedMessages.map(m => ({
                ...m,
                read: m.conversationId === selectedConversationId && m.receiver === userEmail ? true : m.read,
              })),
            });
          }
        } else {
          setMessages([]);
        }

        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching messages:', error);
        toast.error(t.fetchError || 'Failed to fetch messages');
        setLoading(false);
      }
    }, (error) => {
      console.error('Snapshot error:', error);
      toast.error(t.fetchError || 'Failed to fetch messages');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthorized, userEmail, users, selectedConversationId, t]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.warn(t.emptyMessage || 'Message cannot be empty');
      return;
    }

    if (!isAuthorized || !userEmail) {
      toast.error(t.pleaseLogin || 'Please log in to send a message');
      router.push('/login');
      return;
    }

    try {
      // Determine recipient and conversation ID
      let recipient = selectedRecipient;
      let conversationId = selectedConversationId;

      if (!recipient && selectedConversationId) {
        const conv = conversations.find(c => c.conversationId === selectedConversationId);
        if (conv) {
          recipient = conv.groupId
            ? { type: 'group', value: conv.groupId, name: conv.groupName || `Group ${conv.groupId}` }
            : { type: 'user', value: conv.otherUser!.email, name: conv.otherUser!.firstName };
        }
      }

      if (!recipient) {
        // Fallback to admin
        recipient = { type: 'user', value: 'admin', name: 'Admin' };
        conversationId = getConversationId(userEmail, 'admin');
      }

      conversationId = conversationId || (recipient.type === 'group'
        ? getGroupConversationId(recipient.value)
        : getConversationId(userEmail, recipient.value));

      const messageData = {
        content: replyTo ? `> ${replyTo.senderName}: ${replyTo.content}\n\n${newMessage}` : newMessage,
        senderEmail: userEmail,
        senderName: userName || 'User',
        receiver: recipient.type === 'group' ? recipient.value : recipient.value,
        timestamp: new Date().toISOString(),
        read: recipient.type === 'group' ? false : recipient.value === 'admin',
        conversationId,
        groupId: recipient.type === 'group' ? recipient.value : '',
        isPinned: false,
      };

      console.log('Sending message:', messageData);

      const messageDocRef = doc(db, 'publicMessage', 'allMessages');
      const messageSnap = await getDoc(messageDocRef);

      if (messageSnap.exists()) {
        await updateDoc(messageDocRef, {
          messages: arrayUnion(messageData),
        });
      } else {
        await setDoc(messageDocRef, {
          messages: [messageData],
          pinnedMessages: [],
        });
      }

      setNewMessage('');
      setReplyTo(null);
      setSelectedConversationId(conversationId);
      setSelectedRecipient(recipient);
      toast.success(t.messageSent || 'Message sent successfully');
    } catch (error: any) {
      console.error('Error sending message:', error.message, error.code);
      toast.error(`${t.sendError || 'Failed to send message'}: ${error.message}`);
    }
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
    setNewMessage(`> ${message.senderName}: ${message.content}\n\n`);
    document.getElementById('message-input')?.focus();
  };

  const handlePinMessage = async (message: Message) => {
    try {
      const messageDocRef = doc(db, 'publicMessage', 'allMessages');
      const messageSnap = await getDoc(messageDocRef);
      let currentPinned = messageSnap.exists() ? messageSnap.data().pinnedMessages || [] : [];

      if (message.isPinned) {
        currentPinned = currentPinned.filter((m: Message) => m.timestamp !== message.timestamp);
      } else {
        currentPinned.push({ ...message, isPinned: true });
      }

      await updateDoc(messageDocRef, {
        messages: allMessages.map(m => ({
          ...m,
          isPinned: m.timestamp === message.timestamp ? !m.isPinned : m.isPinned,
        })),
        pinnedMessages: currentPinned,
      });
      toast.success(message.isPinned ? (t.messageUnpinned || 'Message unpinned') : (t.messagePinned || 'Message pinned'));
    } catch (error) {
      console.error('Error pinning message:', error);
      toast.error(t.pinError || 'Failed to pin message');
    }
  };

  const handleDeleteMessage = async (message: Message) => {
    if (message.senderEmail !== userEmail) {
      toast.warn(t.cannotDelete || 'You can only delete your own messages');
      return;
    }

    try {
      const messageDocRef = doc(db, 'publicMessage', 'allMessages');
      await updateDoc(messageDocRef, {
        messages: arrayRemove(message),
        pinnedMessages: pinnedMessages.filter(m => m.timestamp !== message.timestamp),
      });
      toast.success(t.messageDeleted || 'Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error(t.deleteError || 'Failed to delete message');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedGroupUsers.length === 0) {
      toast.warn(t.groupCreationError || 'Group name and at least one user are required');
      return;
    }

    try {
      const groupId = `group_${Date.now()}`;
      const messageDocRef = doc(db, 'publicMessage', 'allMessages');
      const messageSnap = await getDoc(messageDocRef);
      const groupMessage = {
        content: `${userName} created group "${groupName}"`,
        senderEmail: userEmail,
        senderName: userName || 'User',
        receiver: getGroupConversationId(groupId),
        timestamp: new Date().toISOString(),
        read: false,
        conversationId: getGroupConversationId(groupId),
        groupId,
        isPinned: false,
      };

      if (messageSnap.exists()) {
        await updateDoc(messageDocRef, {
          messages: arrayUnion(groupMessage),
        });
      } else {
        await setDoc(messageDocRef, {
          messages: [groupMessage],
          pinnedMessages: [],
        });
      }

      setGroupName('');
      setSelectedGroupUsers([]);
      setShowGroupModal(false);
      toast.success(t.groupCreated || 'Group created successfully');
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error(t.groupCreationError || 'Failed to create group');
    }
  };

  const handleConversationSelect = (convId: string) => {
    setSelectedConversationId(convId);
    const conv = conversations.find(c => c.conversationId === convId);
    if (conv) {
      setSelectedRecipient(
        conv.groupId
          ? { type: 'group', value: conv.groupId, name: conv.groupName || `Group ${conv.groupId}` }
          : { type: 'user', value: conv.otherUser!.email, name: conv.otherUser!.firstName }
      );
    }
    setReplyTo(null);
    setNewMessage('');
  };

  const handleRecipientSelect = (type: 'user' | 'group', value: string, name: string) => {
    setSelectedRecipient({ type, value, name });
    setShowRecipientModal(false);
    // Auto-select the corresponding conversation if it exists
    const convId = type === 'group' ? getGroupConversationId(value) : getConversationId(userEmail, value);
    if (conversations.find(c => c.conversationId === convId)) {
      setSelectedConversationId(convId);
    } else {
      setSelectedConversationId(null);
    }
  };

  const toggleGroupUser = (email: string) => {
    setSelectedGroupUsers(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  if (!isAuthorized) {
    console.log('Not authorized, redirecting to login');
    return null;
  }

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
        <div className="flex items-center space-x-4">
          <h2
            className={`text-3xl font-extrabold tracking-tight ${
              theme === 'light' ? 'text-blue-900' : 'text-white'
            }`}
          >
            {selectedConversationId
              ? conversations.find(c => c.conversationId === selectedConversationId)?.groupId
                ? `Group: ${conversations.find(c => c.conversationId === selectedConversationId)?.groupName}`
                : `Chat with ${conversations.find(c => c.conversationId === selectedConversationId)?.otherUser?.firstName || 'User'}`
              : (t.messages || 'Messages')}
          </h2>
          <p
            className={`text-lg font-semibold ${
              theme === 'light' ? 'text-teal-600' : 'text-teal-300'
            }`}
          >
            {t.welcome || 'Welcome'}, {userName || userEmail || 'User'}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowRecipientModal(true)}
            className={`p-2 rounded-xl transition-all duration-300 ${
              theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
            }`}
          >
            {t.newChat || 'New Chat'}
          </button>
          <button
            onClick={() => setShowGroupModal(true)}
            className={`p-2 rounded-xl transition-all duration-300 ${
              theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
            }`}
          >
            {t.createGroup || 'Create Group'}
          </button>
        </div>
      </header>

      <main className={`flex-1 p-8 flex relative ${
        theme === 'light' ? 'bg-gradient-to-br from-blue-50 to-teal-50 text-blue-900' : 'bg-gradient-to-br from-blue-950 to-teal-950 text-white'
      }`}>
        {/* Conversation List */}
        <div
          className={`w-1/3 rounded-3xl shadow-2xl p-6 border mr-4 flex flex-col ${
            theme === 'light' ? 'bg-white bg-opacity-90 text-blue-900 border-blue-100' : 'bg-blue-800 bg-opacity-90 text-white border-teal-800'
          }`}
          style={{
            boxShadow: theme === 'light'
              ? '0 10px 30px rgba(59, 130, 246, 0.3), 0 4px 10px rgba(59, 130, 246, 0.2)'
              : '0 10px 30px rgba(45, 212, 191, 0.3), 0 4px 10px rgba(45, 212, 191, 0.2)',
          }}
        >
          <h3
            className={`text-lg font-semibold mb-3 ${
              theme === 'light' ? 'text-blue-900' : 'text-white'
            }`}
          >
            {t.conversations || 'Conversations'}
          </h3>
          <div className="flex-1 overflow-y-auto">
            {conversations.length > 0 ? (
              conversations.map((conv, index) => (
                <button
                  key={index}
                  onClick={() => handleConversationSelect(conv.conversationId)}
                  className={`w-full text-left p-3 rounded-xl flex items-center space-x-3 mb-2 transition-transform duration-200 ${
                    selectedConversationId === conv.conversationId
                      ? theme === 'light'
                        ? 'bg-teal-100'
                        : 'bg-teal-700'
                      : theme === 'light'
                        ? 'bg-blue-100 hover:bg-blue-200'
                        : 'bg-blue-700 hover:bg-blue-600'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    theme === 'light' ? 'bg-teal-600 text-white' : 'bg-teal-300 text-black'
                  }`}>
                    <span className="text-sm font-bold">{conv.groupId ? 'G' : conv.otherUser?.firstName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{conv.groupId ? conv.groupName : conv.otherUser?.firstName}</p>
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
              ))
            ) : (
              <p className={`text-center text-lg ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
                {t.noConversations || 'No conversations yet.'}
              </p>
            )}
          </div>
        </div>

        {/* Message Area */}
        <div
          className={`flex-1 rounded-3xl shadow-2xl p-6 border flex flex-col ${
            theme === 'light' ? 'bg-white bg-opacity-90 text-blue-900 border-blue-100' : 'bg-blue-800 bg-opacity-90 text-white border-teal-800'
          }`}
          style={{
            boxShadow: theme === 'light'
              ? '0 10px 30px rgba(59, 130, 246, 0.3), 0 4px 10px rgba(59, 130, 246, 0.2)'
              : '0 10px 30px rgba(45, 212, 191, 0.3), 0 4px 10px rgba(45, 212, 191, 0.2)',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10z' fill='%23${theme === 'light' ? 'dbeafe' : '1e3a8a'}' fill-opacity='0.05'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          {selectedConversationId ? (
            <>
              {/* Pinned Messages */}
              {pinnedMessages.filter(m => m.conversationId === selectedConversationId).length > 0 && (
                <div className={`mb-4 p-3 rounded-xl border ${
                  theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900 border-teal-800'
                }`}>
                  <p className="text-sm font-semibold">{t.pinnedMessages || 'Pinned Messages'}</p>
                  {pinnedMessages
                    .filter(m => m.conversationId === selectedConversationId)
                    .map((message, index) => (
                      <div key={index} className="mt-2">
                        <p className="text-sm font-semibold">{message.senderName}</p>
                        <p className="text-xs">{message.content}</p>
                        <button
                          onClick={() => handlePinMessage(message)}
                          className={`text-xs underline ${theme === 'light' ? 'text-teal-600' : 'text-teal-300'}`}
                        >
                          {t.unpin || 'Unpin'}
                        </button>
                      </div>
                    ))}
                </div>
              )}
              <button
                onClick={() => {
                  setSelectedConversationId(null);
                  setSelectedRecipient(null);
                }}
                className={`mb-4 p-2 rounded-xl transition-all duration-300 ${
                  theme === 'light' ? 'bg-blue-200 hover:bg-blue-300 text-blue-900' : 'bg-blue-700 hover:bg-blue-600 text-white'
                }`}
                aria-label={t.backToConversations || 'Back to conversations'}
              >
                <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                {t.backToConversations || 'Back to Conversations'}
              </button>
              <div className="flex-1 flex flex-col space-y-4 max-h-[60vh] overflow-y-auto">
                {messages.length > 0 ? (
                  messages.map((message, index) => {
                    const isCurrentUser = message.senderEmail === userEmail;
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
                          <p className="mt-1 whitespace-pre-wrap">{message.content || t.noContent || 'No content'}</p>
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
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => handleReply(message)}
                              className={`text-xs underline ${
                                theme === 'light' ? 'text-teal-600 hover:text-teal-700' : 'text-teal-300 hover:text-teal-400'
                              }`}
                            >
                              {t.reply || 'Reply'}
                            </button>
                            <button
                              onClick={() => handlePinMessage(message)}
                              className={`text-xs underline ${
                                theme === 'light' ? 'text-teal-600 hover:text-teal-700' : 'text-teal-300 hover:text-teal-400'
                              }`}
                            >
                              {message.isPinned ? (t.unpin || 'Unpin') : (t.pin || 'Pin')}
                            </button>
                            {isCurrentUser && (
                              <button
                                onClick={() => handleDeleteMessage(message)}
                                className={`text-xs underline ${
                                  theme === 'light' ? 'text-red-600 hover:text-red-700' : 'text-red-300 hover:text-red-400'
                                }`}
                              >
                                {t.delete || 'Delete'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className={`text-center flex-1 text-lg ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
                    {t.noMessages || 'No messages in this conversation.'}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className={`text-center flex-1 text-lg ${theme === 'light' ? 'text-blue-500' : 'text-teal-400'}`}>
              {t.selectConversation || 'Select a conversation or start a new chat.'}
            </p>
          )}
          {/* Always visible text input area */}
          <div className="mt-4 flex items-center space-x-2">
            {selectedRecipient ? (
              <div className="flex items-center space-x-2">
                <p className={`text-sm font-semibold ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>
                  To: {selectedRecipient.name}
                </p>
                <button
                  onClick={() => setSelectedRecipient(null)}
                  className={`text-xs underline ${theme === 'light' ? 'text-teal-600' : 'text-teal-300'}`}
                >
                  {t.changeRecipient || 'Change'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowRecipientModal(true)}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
                }`}
              >
                {t.selectRecipient || 'Select Recipient'}
              </button>
            )}
            {replyTo && (
              <div
                className={`w-full p-3 rounded-xl border ${
                  theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900 border-teal-800'
                }`}
              >
                <p className="text-sm font-semibold">{t.replyingTo || 'Replying to'} {replyTo.senderName}</p>
                <p className="text-xs opacity-70 truncate">{replyTo.content}</p>
                <button
                  onClick={() => setReplyTo(null)}
                  className={`text-xs underline ${theme === 'light' ? 'text-teal-600' : 'text-teal-300'}`}
                >
                  {t.cancel || 'Cancel'}
                </button>
              </div>
            )}
            <input
              id="message-input"
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
      </main>

      {/* Recipient Selection Modal */}
      {showRecipientModal && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
            theme === 'light' ? 'text-blue-900' : 'text-white'
          }`}
        >
          <div
            className={`rounded-3xl p-6 border max-w-md w-full ${
              theme === 'light' ? 'bg-white bg-opacity-90 border-blue-100' : 'bg-blue-800 bg-opacity-90 border-teal-800'
            }`}
            style={{
              boxShadow: theme === 'light'
                ? '0 10px 30px rgba(59, 130, 246, 0.3)'
                : '0 10px 30px rgba(45, 212, 191, 0.3)',
            }}
          >
            <h3 className="text-lg font-semibold mb-4">{t.selectRecipient || 'Select Recipient'}</h3>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {users.map((user, index) => (
                <button
                  key={index}
                  onClick={() => handleRecipientSelect('user', user.email, user.firstName)}
                  className={`w-full text-left p-3 rounded-xl flex items-center space-x-3 hover:scale-105 transition-transform duration-200 ${
                    theme === 'light' ? 'bg-blue-100 hover:bg-blue-200' : 'bg-blue-700 hover:bg-blue-600'
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
              {conversations
                .filter(c => c.groupId)
                .map((conv, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecipientSelect('group', conv.groupId!, conv.groupName!)}
                    className={`w-full text-left p-3 rounded-xl flex items-center space-x-3 hover:scale-105 transition-transform duration-200 ${
                      theme === 'light' ? 'bg-blue-100 hover:bg-blue-200' : 'bg-blue-700 hover:bg-blue-600'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      theme === 'light' ? 'bg-teal-600 text-white' : 'bg-teal-300 text-black'
                    }`}>
                      <span className="text-sm font-bold">G</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{conv.groupName}</p>
                      <p className="text-xs opacity-70">Group</p>
                    </div>
                  </button>
                ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowRecipientModal(false)}
                className={`p-2 rounded-xl ${
                  theme === 'light' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {t.cancel || 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Creation Modal */}
      {showGroupModal && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
            theme === 'light' ? 'text-blue-900' : 'text-white'
          }`}
        >
          <div
            className={`rounded-3xl p-6 border max-w-md w-full ${
              theme === 'light' ? 'bg-white bg-opacity-90 border-blue-100' : 'bg-blue-800 bg-opacity-90 border-teal-800'
            }`}
            style={{
              boxShadow: theme === 'light'
                ? '0 10px 30px rgba(59, 130, 246, 0.3)'
                : '0 10px 30px rgba(45, 212, 191, 0.3)',
            }}
          >
            <h3 className="text-lg font-semibold mb-4">{t.createGroup || 'Create Group'}</h3>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={t.groupNamePlaceholder || 'Enter group name...'}
              className={`w-full p-3 rounded-2xl border mb-4 ${
                theme === 'light'
                  ? 'bg-white bg-opacity-90 border-blue-100 text-blue-900'
                  : 'bg-blue-800 bg-opacity-90 border-teal-800 text-white'
              } focus:outline-none focus:ring-2 focus:ring-teal-600`}
            />
            <h4 className="text-sm font-semibold mb-2">{t.selectUsers || 'Select Users'}</h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {users.map((user, index) => (
                <label key={index} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedGroupUsers.includes(user.email)}
                    onChange={() => toggleGroupUser(user.email)}
                    className="form-checkbox h-5 w-5 text-teal-600"
                  />
                  <span>{user.firstName} ({user.email})</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowGroupModal(false)}
                className={`p-2 rounded-xl ${
                  theme === 'light' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {t.cancel || 'Cancel'}
              </button>
              <button
                onClick={handleCreateGroup}
                className={`p-2 rounded-xl ${
                  theme === 'light' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-800 hover:bg-teal-700 text-white'
                }`}
              >
                {t.create || 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}