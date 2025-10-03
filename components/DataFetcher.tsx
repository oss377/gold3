'use client';

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { db } from '../app/fconfig';
import { collection, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Member } from '../app/types/member';
import { RefreshCw, XCircle } from 'lucide-react';

// TypeScript interface for translation
interface Translation {
  loading?: string;
  error?: string;
  noMembers?: string;
  memberDetails?: string;
  close?: string;
  refresh?: string;
  name?: string;
  email?: string;
  membership?: string;
  payment?: string;
  daysStatus?: string;
  actions?: string;
  payed?: string;
  notPayed?: string;
  detail?: string;
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
  const [detailsModal, setDetailsModal] = useState<MemberDetailsModal>({ isOpen: false, member: null });

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      onStatsStatus(true);

      const querySnapshot = await getDocs(collection(db, 'GYM'));
      const allMembers: { [key: string]: Member[] } = {};

      const memberData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          birthDate: data.birthDate || '',
          bloodType: data.bloodType || '',
          breakfastFrequency: data.breakfastFrequency || '',
          city: data.city || '',
          createdAt: data.createdAt || { seconds: 0, nanoseconds: 0 },
          eatingReasons: data.eatingReasons || [],
          email: data.email || '',
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
          collectionType: 'GYM',
          name: data.name || undefined,
          membership: data.membership || 'Unknown',
          status: data.status || 'Unknown',
          statusColor: data.statusColor || 'text-gray-500',
          payment: data.payment || 'Not Payed',
          paymentStartDate: data.paymentStartDate || undefined,
          actionDelete: data.actionDelete || 'delete',
          actionDetail: data.actionDetail || 'detail',
          actionPayed: data.actionPayed || 'payment',
          category: data.category || 'Uncategorized',
          ...data,
        };
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
              await updateDoc(memberRef, { payment: 'Not Payed', paymentStartDate: null });
              return { ...member, payment: 'Not Payed', paymentStartDate: null };
            }
          }
          return member;
        })
      );

      // Group members by category
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
      console.error('Error fetching GYM members:', error);
      setFetchError(t.error || 'Failed to fetch members. Please try again.');
    } finally {
      setIsLoading(false);
      onStatsStatus(false);
    }
  }, [onStatsFetched, onStatsStatus, t]);

  const openDetailsModal = useCallback(async (member: Member) => {
    try {
      const memberRef = doc(db, 'GYM', member.id);
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
          collectionType: 'GYM',
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
        console.warn(`Member ${member.id} not found in GYM`);
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

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'GYM', id));
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

  const handleSetPayment = useCallback(async (id: string, category: string, newPaymentStatus: string) => {
    try {
      const memberRef = doc(db, 'GYM', id);
      const updateData: { payment: string; paymentStartDate?: string | null } = {
        payment: newPaymentStatus,
      };

      if (newPaymentStatus === 'Payed') {
        updateData.paymentStartDate = new Date().toISOString();
      } else {
        updateData.paymentStartDate = null;
      }

      await updateDoc(memberRef, updateData);

      setMembers((prev) => ({
        ...prev,
        [category]: prev[category].map((member) =>
          member.id === id
            ? {
                ...member,
                payment: newPaymentStatus,
                paymentStartDate: newPaymentStatus === 'Payed' ? new Date().toISOString() : null,
              }
            : member
        ),
      }));
    } catch (error) {
      console.error('Error updating payment status:', error);
      setFetchError(t.error || 'Failed to update payment status. Please try again.');
    }
  }, [t]);

  const calculateDaysDisplay = useCallback((paymentStatus: string, paymentStartDate?: string): string => {
    if (!paymentStartDate) return 'N/A';
    const startDate = new Date(paymentStartDate);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (paymentStatus === 'Payed') {
      const daysLeft = 30 - diffDays;
      return daysLeft > 0 ? t.daysStatus?.replace('{days}', `${daysLeft}`) || `${daysLeft} days left` : t.daysStatus?.replace('{days}', 'Expired') || 'Expired';
    } else {
      const daysPassed = Math.min(diffDays, 30); // Cap at 30 days
      return t.daysStatus?.replace('{days}', `${daysPassed} day${daysPassed === 1 ? '' : 's'} passed`) || `${daysPassed} day${daysPassed === 1 ? '' : 's'} passed`;
    }
  }, [t]);

  const renderTable = useCallback(
    (category: string, collectionMembers: Member[]) => (
      <div
        className={`rounded-xl shadow-lg p-6 mb-10 border ${
          theme === 'light' ? 'bg-white text-gray-900 border-gray-200' : 'bg-gray-800 text-white border-gray-700'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-semibold capitalize ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
            {t.category?.replace('{category}', category) || `${category} Members`}
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
                  <th className="py-4 px-2">{t.name || 'Name'}</th>
                  <th className="py-4 px-2">{t.email || 'Email'}</th>
                  <th className="py-4 px-2">{t.membership || 'Membership'}</th>
                  <th className="py-4 px-2">{t.payment || 'Payment'}</th>
                  <th className="py-4 px-2">{t.daysStatus || 'Days Status'}</th>
                  <th className="py-4 px-2">{t.actions || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {collectionMembers
                  .filter(
                    (member) =>
                      (member.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (member.email ?? '').toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((member) => (
                    <tr
                      key={`${member.id}-GYM`}
                      className={`border-b ${
                        theme === 'light' ? 'border-gray-200 hover:bg-blue-50' : 'border-gray-600 hover:bg-gray-700'
                      } transition-colors duration-200`}
                    >
                      <td className="py-4 px-2">{member.name}</td>
                      <td className="py-4 px-2">{member.email}</td>
                      <td className="py-4 px-2">{member.membership}</td>
                      <td className="py-4 px-2">
                        {member.payment !== undefined ? (
                          <select
                            value={member.payment}
                            onChange={(e) => handleSetPayment(member.id, member.category || 'Uncategorized', e.target.value)}
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
                          {calculateDaysDisplay(member.payment, member.paymentStartDate)}
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
    ),
    [theme, isLoading, fetchError, searchQuery, t, fetchMembers, openDetailsModal, handleDelete, handleSetPayment, calculateDaysDisplay]
  );

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
      {Object.keys(members).map((category) => (
        <div key={category}>{renderTable(category, members[category])}</div>
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
    </>
  );
}