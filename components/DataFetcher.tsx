'use client';

import { useState, useEffect, useCallback, Dispatch, SetStateAction, useMemo } from 'react';
import { db } from '../app/fconfig';
import { collection, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Member } from '../app/types/member';
import { toast } from 'react-toastify';
import { RefreshCw, XCircle } from 'lucide-react';

// TypeScript interface for translation
interface Translation {
  loading?: string;
  error?: string;
  noMembers?: string;
  memberDetails?: string;
  close?: string;
  category?: string;
  refresh?: string;
  name?: string;
  photo?: string;
  email?: string;
  membership?: string;
  payment?: string;
  daysStatus?: string;
  actions?: string;
  payed?: string;
  notPayed?: string;
  detail?: string;
  update?: string;
  delete?: string;
  [key: string]: string | undefined;
}

// Interface for DataFetcher props
interface DataFetcherProps {
  refreshTrigger: number;
  searchQuery: string;
  theme: 'light' | 'dark';
  t: Translation;
  onStatsFetched: (stats: any) => void;
  onStatsStatus: Dispatch<SetStateAction<boolean>>;
}

// Interface for Member Details Modal
interface MemberDetailsModal {
  isOpen: boolean;
  member: Member | null;
}

export default function DataFetcher({ refreshTrigger, searchQuery, theme, t, onStatsFetched, onStatsStatus }: DataFetcherProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [members, setMembers] = useState<{ [key: string]: Member[] }>({});
  const [filteredMembers, setFilteredMembers] = useState<{ [key: string]: Member[] }>({});
  const [detailsModal, setDetailsModal] = useState<MemberDetailsModal>({ isOpen: false, member: null });
  const [imageModal, setImageModal] = useState<{ isOpen: boolean; src: string | null }>({ isOpen: false, src: null });

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);

      const querySnapshot = await getDocs(collection(db, 'GYM'));
      const memberData: Member[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          collectionType: 'GYM',
          name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || 'Unknown',
          email: data.email || 'Unknown',
          membership: data.membershipType || 'N/A',
          payment: data.payment || 'Not Payed',
          paymentStartDate: data.paymentStartDate,
          category: data.category || 'GYM', // Fallback to 'GYM' if no category
          registrationDate: data.registrationDate,
          photoURL: data.photoURL,
          ...data,
          birthDate: data.birthDate || '',
          bloodType: data.bloodType || '',
          breakfastFrequency: data.breakfastFrequency || '',
          city: data.city || '',
          createdAt: data.createdAt || { seconds: 0, nanoseconds: 0 },
          eatingReasons: data.eatingReasons || [],
          emergencyName: data.emergencyName || '',
          emergencyPhone: data.emergencyPhone || '',
          exerciseDays: data.exerciseDays || [],
          exerciseDuration: data.exerciseDuration || '',
          exercisePain: data.exercisePain || false,
          exerciseTime: data.exerciseTime || '',
          firstName: data.firstName || '',
          foodTracking: data.foodTracking || false,
          goalWeight: data.goalWeight || '',
          healthIssues: data.healthIssues || '',
          height: data.height || '',
          lastName: data.lastName || '',
          medications: data.medications || '',
          membershipType: data.membershipType || '',
          nightEating: data.nightEating || '',
          nutritionRating: data.nutritionRating || '',
          password: data.password || '',
          phoneNumber: data.phoneNumber || '',
          proSport: data.proSport || false,
          role: data.role || '',
          signature: data.signature || '',
          smoke: data.smoke || false,
          startMonth: data.startMonth || '',
          state: data.state || '',
          streetAddress: data.streetAddress || '',
          streetAddress2: data.streetAddress2 || '',
          supplements: data.supplements || false,
          surgery: data.surgery || false,
          trainingGoals: data.trainingGoals || [],
          userId: data.userId || '',
          weight: data.weight || '',
          zipCode: data.zipCode || '',
        } as Member;
      });

      // Check and update payment status for expired memberships
      const updatedMembers = await Promise.all(
        memberData.map(async (member) => {
          if (member.payment === 'Payed' && member.paymentStartDate) {
            const startDate = new Date(member.paymentStartDate);
            const currentDate = new Date();
            const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 30) {
              const memberRef = doc(db, 'GYM', member.id);
              await updateDoc(memberRef, { payment: 'Not Payed' }); // Keep paymentStartDate
              return { ...member, payment: 'Not Payed' };
            }
          }
          return member;
        })
      );

      // Group members by category
      const allMembers: { [key: string]: Member[] } = {};
      updatedMembers.forEach((member) => {
        const category = member.category || 'Uncategorized';
        if (!allMembers[category]) {
          allMembers[category] = [];
        }
        allMembers[category].push(member);
      });

      setMembers(allMembers);
      setFetchError(null);

      // Calculate stats for onStatsFetched
      const stats = {
        totalMembers: updatedMembers.length,
        categories: Object.keys(allMembers).reduce((acc, category) => ({
          ...acc,
          [category]: allMembers[category].length,
        }), {}),
      };
      onStatsFetched(stats);
    } catch (error) {
      onStatsStatus(false);
      console.error('Error fetching GYM members:', error);
      setFetchError(t.error || 'Failed to fetch members. Please try again.');
    } finally {
      setIsLoading(false);
      onStatsStatus(false);
    }
  }, [onStatsFetched, onStatsStatus, t]);

  useEffect(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = Object.keys(members).reduce((acc, category) => {
        const categoryMembers = members[category].filter(
          (member) =>
            (member.name?.toLowerCase().includes(lowercasedQuery)) ||
            (member.email?.toLowerCase().includes(lowercasedQuery))
        );
        if (categoryMembers.length > 0) {
          acc[category] = categoryMembers;
        }
        return acc;
      }, {} as { [key: string]: Member[] });
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchQuery, members]);

  const openDetailsModal = useCallback(async (member: Member) => {
    try {
      const memberRef = doc(db, member.collectionType, member.id);
      const memberSnap = await getDoc(memberRef);

      if (memberSnap.exists()) {
        const data = memberSnap.data();
        const freshMember: Member = {
          id: memberSnap.id,
          name: data.name || 'Unknown',
          email: data.email || 'Unknown',
          membership: data.membership || 'Unknown',
          status: data.status || 'Unknown',
          statusColor: data.statusColor || 'text-gray-500',
          collectionType: member.collectionType,
          payment: data.payment || 'Not Payed',
          paymentStartDate: data.paymentStartDate || undefined,
          actionDelete: data.actionDelete || 'delete',
          actionDetail: data.actionDetail || 'detail',
          actionPayed: data.actionPayed || 'payment',
          category: data.category || 'Uncategorized',
          ...data,
          birthDate: '',
          bloodType: '',
          breakfastFrequency: '',
          city: '',
          createdAt: {
            seconds: 0,
            nanoseconds: 0
          },
          eatingReasons: [],
          emergencyName: '',
          emergencyPhone: '',
          exerciseDays: [],
          exerciseDuration: '',
          exercisePain: false,
          exerciseTime: '',
          firstName: '',
          foodTracking: false,
          goalWeight: '',
          healthIssues: '',
          height: '',
          lastName: '',
          medications: '',
          membershipType: '',
          nightEating: '',
          nutritionRating: '',
          password: '',
          phoneNumber: '',
          proSport: false,
          role: '',
          signature: '',
          smoke: false,
          startMonth: '',
          state: '',
          streetAddress: '',
          streetAddress2: '',
          supplements: false,
          surgery: false,
          trainingGoals: [],
          userId: '',
          weight: '',
          zipCode: ''
        };
        setDetailsModal({ isOpen: true, member: freshMember });
      } else {
        console.warn(`Member ${member.id} not found in ${member.collectionType}`);
        setDetailsModal({ isOpen: true, member: { ...member, name: member.name || 'Unknown', email: member.email || 'Unknown', payment: member.payment || 'Not Payed', paymentStartDate: member.paymentStartDate || undefined, actionPayed: member.actionPayed || 'payment' } });
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      setDetailsModal({ isOpen: true, member: { ...member, name: member.name || 'Unknown', email: member.email || 'Unknown', payment: member.payment || 'Not Payed', paymentStartDate: member.paymentStartDate || undefined, actionPayed: member.actionPayed || 'payment' } });
    }
  }, []); 

  const closeDetailsModal = useCallback(() => {
    setDetailsModal({ isOpen: false, member: null });
  }, []);

  const handleImageClick = useCallback((imageUrl: string) => {
    setImageModal({ isOpen: true, src: imageUrl });
  }, []);

  const closeImageModal = useCallback(() => {
    setImageModal({ isOpen: false, src: null });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, members[Object.keys(members)[0]].find(m => m.id === id)?.collectionType || 'GYM', id));
      setMembers((prev) => {
        const updatedMembers = { ...prev };
        Object.keys(updatedMembers).forEach((category) => {
          updatedMembers[category] = updatedMembers[category].filter((member) => member.id !== id);
          if (updatedMembers[category].length === 0) {
            delete updatedMembers[category];
          }
        });
        return updatedMembers;
      });
      // Update stats after deletion
      const stats = {
        totalMembers: Object.values(members).flat().length - 1,
        categories: Object.keys(members).reduce((acc, category) => ({
          ...acc,
          [category]: members[category].filter((m) => m.id !== id).length,
        }), {}),
      };
      onStatsFetched(stats);
    } catch (error) {
      console.error('Error deleting member:', error);
      setFetchError(t.error || 'Failed to delete member. Please try again.');
    }
  }, [members, onStatsFetched, t]);

  const handleSetPayment = useCallback(async (member: Member, newPayment: string) => {
    try {
      const memberRef = doc(db, 'GYM', member.id);
      const updateData: { payment: string; paymentStartDate?: string | null } = {
        payment: newPayment,
      };

      if (newPayment === 'Payed') {
        updateData.paymentStartDate = new Date().toISOString();
      }

      await updateDoc(memberRef, updateData);

      setMembers((prev) => ({
        ...prev,
        [member.category!]: prev[member.category!].map((m) =>
          m.id === member.id
            ? ({
              ...m,
              payment: newPayment,
              ...(newPayment === 'Payed' && { paymentStartDate: updateData.paymentStartDate }),
            } as Member)
            : m
        )
      }));
      toast.success(`${member.name} payment updated to ${newPayment}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      setFetchError(t.error || 'Failed to update payment status. Please try again.');
      toast.error(t.error || 'Failed to update payment status.');
    }
  }, [t]);

  const calculateDaysDisplay = useCallback((payment: string, paymentStartDate?: string | null, registrationDate?: string | null): string => {
    if (payment === 'Payed' && paymentStartDate) {
      const startDate = new Date(paymentStartDate);
      const currentDate = new Date();
      const diffTime = currentDate.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const daysLeft = 30 - diffDays;
      return daysLeft >= 0 ? `${daysLeft} days left` : 'Expired';
    } else if (payment === 'Not Payed' && paymentStartDate) {
      const startDate = new Date(paymentStartDate);
      const currentDate = new Date();
      const diffTime = currentDate.getTime() - startDate.getTime();
      const daysPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 30;
      return daysPassed > 0 ? `${daysPassed} days passed` : 'Expired';
    } else if (payment === 'Not Payed' && registrationDate) {
      const regDate = new Date(registrationDate);
      const currentDate = new Date();
      const diffTime = currentDate.getTime() - regDate.getTime();
      const daysPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return daysPassed > 0 ? `${daysPassed} days passed` : 'Just registered';
    } else {
      return 'N/A';
    }
  }, [t]);

  const renderTable = useCallback(
    (category: string, collectionMembers: Member[]) => {
      if (collectionMembers.length === 0) return null;
      return (
      <div
        className={`rounded-xl shadow-lg p-6 mb-10 border ${
          theme === 'light' ? 'bg-white text-gray-900 border-gray-200' : 'bg-gray-800 text-white border-gray-700'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-semibold capitalize ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
            {`${category} Members`}
          </h3>
          <button
            onClick={fetchMembers}
            className={`flex items-center px-3 py-1 rounded-lg text-sm ${
              theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            disabled={isLoading}
          >
            <RefreshCw
              size={16}
              className={`mr-1 ${isLoading ? 'animate-spin' : ''} ${theme === 'light' ? 'text-white' : 'text-white'}`}
            />
            {t.refresh || 'Refresh'}
          </button>
        </div>

        {isLoading && (
          <div className={`text-center py-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
            {t.loading?.replace('{category}', category.toLowerCase()) || `Loading ${category.toLowerCase()} members...`}
          </div>
        )}

        {fetchError && <div className="text-red-500 mb-4">{fetchError}</div>}

        {!isLoading && collectionMembers.length === 0 && !fetchError && (
          <div className={`text-sm mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
            {t.noMembers?.replace('{category}', category.toLowerCase()) || `No members found in ${category}`}
          </div>
        )}

        {!isLoading && collectionMembers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr
                  className={`border-b ${theme === 'light' ? 'border-gray-200 text-gray-600' : 'border-gray-600 text-gray-300'}`}
                >
                  <th className="py-4 px-2">{t.photo || 'Photo'}</th>
                  <th className="py-4 px-2">{t.name || 'Name'}</th>
                  <th className="py-4 px-2">{t.email || 'Email'}</th>
                  <th className="py-4 px-2">{t.membership || 'Membership'}</th>
                  <th className="py-4 px-2">{t.payment || 'Payment'}</th>
                  <th className="py-4 px-2">{t.daysStatus || 'Days Status'}</th>
                  <th className="py-4 px-2">{t.actions || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {collectionMembers.map((member) => (
                    <tr
                      key={`${member.id}-GYM`}
                      className={`border-b ${
                        theme === 'light' ? 'border-gray-200 hover:bg-blue-50' : 'border-gray-600 hover:bg-gray-700'
                      } transition-colors duration-200`}
                    >
                      <td className="py-4 px-2">
                        {member.photoURL ? (
                          <button
                            onClick={() => handleImageClick(member.photoURL!)}
                            className="focus:outline-none"
                            aria-label={`View ${member.name}'s profile photo`}
                          >
                            <img
                              src={member.photoURL}
                              alt={member.name || 'Member photo'}
                              className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity duration-200"
                            />
                          </button>
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              theme === 'light' ? 'bg-gray-200 text-gray-600' : 'bg-gray-600 text-gray-300'
                            }`}
                          >
                            <span className="text-xs">
                              {member.firstName ? member.firstName.charAt(0) : ''}
                              {member.lastName ? member.lastName.charAt(0) : ''}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-2">{member.name}</td>
                      <td className="py-4 px-2">{member.email}</td>
                      <td className="py-4 px-2">{member.membership}</td>
                      <td className="py-4 px-2">
                        {member.payment !== undefined ? (
                          <select
                            value={member.payment || 'Not Payed'}
                            onChange={(e) => handleSetPayment(member, e.target.value)}
                            className={`px-3 py-1 rounded-lg text-sm ${
                              theme === 'light'
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
                            } transition-colors duration-200`}
                          >
                            <option value="Payed">{t.payed || 'Payed'}</option>
                            <option value="Not Payed">{t.notPayed || 'Not Payed'}</option>
                          </select>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-4 px-2">
                        <span
                          className={`inline-block animate-pulse ${
                            theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                          }`}
                        >
                          {calculateDaysDisplay(member.payment, member.paymentStartDate, member.registrationDate)}
                        </span>
                      </td>
                      <td className="py-4 px-2 flex space-x-2">
                        <button
                          onClick={() => openDetailsModal(member)}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            theme === 'light'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-700 text-white hover:bg-gray-600'
                          } transition-colors duration-200`}
                          title={t.detail || member.actionDetail}
                        >
                          {t.detail || member.actionDetail}
                        </button>
                        <button
                          onClick={() => openDetailsModal(member)}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            theme === 'light' ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-yellow-600 text-white hover:bg-yellow-700'
                          } transition-colors duration-200`}
                          title={t.update || 'Update'}
                        >
                          {t.update || 'Update'}
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            theme === 'light'
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-gray-700 text-white hover:bg-gray-600'
                          } transition-colors duration-200`}
                          title={t.delete || member.actionDelete}
                        >
                          {t.delete || member.actionDelete}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  },[theme, isLoading, fetchError, t, fetchMembers, openDetailsModal, handleDelete, handleSetPayment, calculateDaysDisplay, handleImageClick]);
  

  useEffect(() => {
    fetchMembers();
  }, [refreshTrigger, fetchMembers]);

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
      {Object.keys(filteredMembers).map((category) => (
        <div key={category}>{renderTable(category, filteredMembers[category])}</div>
      ))}

      {/* Member Details Modal */}
      {detailsModal.isOpen && detailsModal.member && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl ${
              theme === 'light'
                ? 'bg-gradient-to-br from-blue-100 to-purple-100 text-zinc-800'
                : 'bg-gradient-to-br from-gray-700 to-gray-800 text-white'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
                {t.memberDetails || 'Member Details'}
              </h3>
              <button
                onClick={closeDetailsModal}
                className={`transition-colors duration-200 ${
                  theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300 hover:text-white'
                }`}
              >
                <XCircle
                  size={24}
                  className={theme === 'light' ? 'text-gray-500' : 'text-gray-300'}
                />
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(detailsModal.member)
                .filter(([key]) => key !== 'id' && key !== 'collectionType')
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className={`font-medium capitalize ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
                      {t[key] || key}:
                    </span>
                    <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-200'}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value || 'N/A')}
                    </span>
                  </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeDetailsModal}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {t.close || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal.isOpen && imageModal.src && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl w-full max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10"
              aria-label={t.close || 'Close image modal'}
            >
              <XCircle size={30} />
            </button>
            <div className="flex justify-center items-center h-full">
              <img src={imageModal.src} alt={t.enlargedProfile || 'Enlarged profile'} className="max-w-full max-h-full object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}