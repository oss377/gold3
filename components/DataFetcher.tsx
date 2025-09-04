'use client';

import { useState, useEffect, useContext } from 'react';
import { db } from '../app/fconfig';
import { collection, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Member } from '../app/types/member';
import { RefreshCw, XCircle } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

interface DataFetcherProps {
  refreshTrigger: number;
  searchQuery: string;
  theme: 'light' | 'dark';
}

interface MemberDetailsModal {
  isOpen: boolean;
  member: Member | null;
}

export default function DataFetcher({ refreshTrigger, searchQuery, theme }: DataFetcherProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [members, setMembers] = useState<{ [key: string]: Member[] }>({});
  const [detailsModal, setDetailsModal] = useState<MemberDetailsModal>({ isOpen: false, member: null });
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('DataFetcher must be used within a ThemeProvider');
  }
  const { theme: currentTheme } = context;

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);

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
          membership: data.membership || undefined,
          status: data.status || undefined,
          statusColor: data.statusColor || undefined,
          payed: data.payed || false,
          actionDelete: data.actionDelete || 'delete',
          actionDetail: data.actionDetail || 'detail',
          actionPayed: data.actionPayed || 'payed',
          category: data.category || 'Uncategorized',
          ...data,
        };
      });

      // Group members by category
      memberData.forEach((member) => {
        const category = member.category || 'Uncategorized';
        if (!allMembers[category]) {
          allMembers[category] = [];
        }
        allMembers[category].push(member);
      });

      setMembers(allMembers);
      setFetchError(null);
    } catch (error) {
      console.error('Error fetching GYM members:', error);
      setFetchError('Failed to fetch members. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [refreshTrigger]);

  const openDetailsModal = async (member: Member) => {
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
          payed: data.payed || false,
          actionDelete: data.actionDelete || 'delete',
          actionDetail: data.actionDetail || 'detail',
          actionPayed: data.actionPayed || 'payed',
          category: data.category || 'Uncategorized',
          ...data,
        };
        setDetailsModal({ isOpen: true, member: freshMember });
      } else {
        console.warn(`Member ${member.id} not found in GYM`);
        setDetailsModal({ isOpen: true, member: { ...member, name: member.name || 'Unknown', email: member.email || 'Unknown', payed: member.payed || false, actionPayed: member.actionPayed || 'payed' } });
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      setDetailsModal({ isOpen: true, member: { ...member, name: member.name || 'Unknown', email: member.email || 'Unknown', payed: member.payed || false, actionPayed: member.actionPayed || 'payed' } });
    }
  };

  const closeDetailsModal = () => {
    setDetailsModal({ isOpen: false, member: null });
  };

  const handleDelete = async (id: string) => {
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
    } catch (error) {
      console.error('Error deleting member:', error);
      setFetchError('Failed to delete member. Please try again.');
    }
  };

  const handleSetPayed = async (id: string, category: string, currentPayed: boolean) => {
    try {
      const memberRef = doc(db, 'GYM', id);
      await updateDoc(memberRef, {
        payed: !currentPayed,
      });

      setMembers((prev) => ({
        ...prev,
        [category]: prev[category].map((member) =>
          member.id === id
            ? {
                ...member,
                payed: !currentPayed,
              }
            : member
        ),
      }));
    } catch (error) {
      console.error('Error updating payed status:', error);
      setFetchError('Failed to update payed status. Please try again.');
    }
  };

  const renderTable = (category: string, collectionMembers: Member[]) => (
    <div
      className={`rounded-xl shadow-lg p-6 mb-10 border ${
        theme === 'light' ? 'bg-white text-gray-900 border-gray-200' : 'bg-gray-800 text-white border-gray-700'
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-xl font-semibold capitalize ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
          {category} Members
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
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className={`text-center py-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
          Loading {category} members...
        </div>
      )}

      {fetchError && <div className="text-red-500 mb-4">{fetchError}</div>}

      {!isLoading && collectionMembers.length === 0 && !fetchError && (
        <div className={`text-sm mb-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'}`}>
          No members found in {category}
        </div>
      )}

      {!isLoading && collectionMembers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className={`border-b ${theme === 'light' ? 'border-gray-200 text-gray-600' : 'border-gray-600 text-gray-300'}`}
              >
                <th className="py-4 px-2">Name</th>
                <th className="py-4 px-2">Email</th>
                <th className="py-4 px-2">Membership</th>
                <th className="py-4 px-2">Payed</th>
                <th className="py-4 px-2">Actions</th>
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
                    <td className="py-4 px-2">{member.payed ? 'Yes' : 'No'}</td>
                    <td className="py-4 px-2 flex space-x-2">
                      <button
                        onClick={() => openDetailsModal(member)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          theme === 'light'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        } transition-colors duration-200`}
                        title={member.actionDetail}
                      >
                        {member.actionDetail}
                      </button>
                      <button
                        onClick={() => handleSetPayed(member.id, member.category || 'Uncategorized', member.payed)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          theme === 'light'
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        } transition-colors duration-200`}
                        title={member.actionPayed}
                      >
                        {member.actionPayed}
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          theme === 'light'
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        } transition-colors duration-200`}
                        title={member.actionDelete}
                      >
                        {member.actionDelete}
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

  return (
    <>
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
                Member Details
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
                      {key}:
                    </span>
                    <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-200'}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}