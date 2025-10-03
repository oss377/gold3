'use client';

import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { Bell, X } from 'lucide-react';
import { db } from '../app/fconfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// Import Translation interface from LanguageContext to ensure consistency
import { Translation } from '../context/LanguageContext';

interface Registration {
  id: string;
  name: string;
  email: string;
  registrationDate: Date;
  details: string;
  collection: string;
}

interface NotificationsProps {
  notificationCount: number;
  setNotificationCount: Dispatch<SetStateAction<number>>;
  theme: string;
  t: Translation;
}

export default function Notifications({ notificationCount, setNotificationCount, theme, t }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Registration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const notificationsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const collections = ['aerobics', 'gym', 'karate'];
    const unsubscribes = collections.map((collectionName) => {
      const q = query(collection(db, collectionName), orderBy('registrationDate', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const fetchedRegistrations: Registration[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          registrationDate: doc.data().registrationDate.toDate(),
          details: doc.data().details || 'No additional details',
          collection: collectionName,
        }));
        setNotifications((prev) => {
          const otherCollections = prev.filter((reg) => reg.collection !== collectionName);
          return [...otherCollections, ...fetchedRegistrations].sort(
            (a, b) => b.registrationDate.getTime() - a.registrationDate.getTime()
          );
        });
        setNotificationCount(fetchedRegistrations.length);
      });
    });

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [setNotificationCount]);

  useEffect(() => {
    notificationsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notifications]);

  const handleCardClick = (registration: Registration) => {
    setSelectedRegistration(registration);
  };

  const closeModal = () => {
    setSelectedRegistration(null);
  };

  const groupedNotifications = {
    aerobics: notifications.filter((n) => n.collection === 'aerobics'),
    gym: notifications.filter((n) => n.collection === 'gym'),
    karate: notifications.filter((n) => n.collection === 'karate'),
  };

  return (
    <div className="relative group">
      <button
        className={`p-2 rounded-full ${
          theme === 'light'
            ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t.newRegistrations || 'Toggle notifications window'}
      >
        <Bell size={24} />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {notificationCount}
          </span>
        )}
      </button>

      {isOpen && notifications.length > 0 && (
        <div
          className={`fixed inset-y-0 left-64 right-0 bg-black bg-opacity-30 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } z-50 ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-xl shadow-2xl overflow-hidden transform transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          } md:max-w-2xl md:mx-auto md:left-64 md:right-4 md:inset-y-4`}
        >
          <div className="flex flex-col h-full">
            <div className={`p-4 border-b ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'} flex justify-between items-center`}>
              <h3 className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {t.newRegistrations || 'New Registrations'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-full ${
                  theme === 'light' ? 'text-gray-600 hover:bg-gray-200' : 'text-gray-300 hover:bg-gray-600'
                } transition-colors duration-200`}
                aria-label={t.newRegistrations || 'Close notifications window'}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {['aerobics', 'gym', 'karate'].map((collectionName) => (
                <div
                  key={collectionName}
                  className={`p-4 rounded-lg ${
                    theme === 'light' ? 'bg-indigo-50' : 'bg-gray-700'
                  } shadow-md transition-all duration-200 hover:shadow-lg`}
                >
                  <h4 className={`text-md font-medium capitalize ${theme === 'light' ? 'text-indigo-800' : 'text-gray-200'} mb-3`}>
                    {t[collectionName as keyof Translation] || collectionName} Registrations
                  </h4>
                  {groupedNotifications[collectionName as keyof typeof groupedNotifications].length === 0 ? null : (
                    groupedNotifications[collectionName as keyof typeof groupedNotifications].map((notification) => (
                      <div
                        key={notification.id}
                        className={`inline-block max-w-fit p-3 rounded-lg ${
                          theme === 'light' ? 'bg-indigo-100 text-gray-900' : 'bg-gray-600 text-white'
                        } shadow-sm cursor-pointer hover:bg-opacity-80 transition-all duration-200 mb-2`}
                        onClick={() => handleCardClick(notification)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleCardClick(notification)}
                      >
                        <p className="text-sm font-medium">{notification.name}</p>
                        <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} mt-1`}>
                          {notification.registrationDate.toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              ))}
              <div ref={notificationsEndRef} />
            </div>
          </div>
        </div>
      )}

      {selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-xl max-w-md w-full ${
              theme === 'light' ? 'bg-white text-gray-900' : 'bg-gray-800 text-white'
            } shadow-xl transform transition-all duration-300 scale-100`}
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">{t.registrationDetails || 'Registration Details'}</h4>
              <button
                onClick={closeModal}
                className={`p-1 rounded-full ${
                  theme === 'light' ? 'text-gray-600 hover:bg-gray-200' : 'text-gray-300 hover:bg-gray-600'
                } transition-colors duration-200`}
                aria-label={t.registrationDetails || 'Close details modal'}
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-sm">
                <strong>{t.name || 'Name'}:</strong> {selectedRegistration.name}
              </p>
              <p className="text-sm">
                <strong>{t.email || 'Email'}:</strong> {selectedRegistration.email}
              </p>
              <p className="text-sm">
                <strong>{t.collection || 'Collection'}:</strong>{' '}
                {t[selectedRegistration.collection as keyof Translation] || selectedRegistration.collection}
              </p>
              <p className="text-sm">
                <strong>{t.registrationDate || 'Registration Date'}:</strong>{' '}
                {selectedRegistration.registrationDate.toLocaleString()}
              </p>
              <p className="text-sm">
                <strong>{t.details || 'Details'}:</strong> {selectedRegistration.details}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}