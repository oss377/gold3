import { useState, useEffect } from "react";
import { db } from "../app/fconfig";
import { collection, getDocs, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { Member } from "../app/types/member";
import { RefreshCw, XCircle } from "lucide-react";

interface DataFetcherProps {
  refreshTrigger: number;
  searchQuery: string;
  isHighContrast: boolean;
}

interface MemberDetailsModal {
  isOpen: boolean;
  member: Member | null;
}

export default function DataFetcher({ refreshTrigger, searchQuery, isHighContrast }: DataFetcherProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [members, setMembers] = useState<{ [key: string]: Member[] }>({
    consult: [],
    gym: [],
    karate: [],
    personalTraining: [],
    registrations: [],
    videos: [],
    aerobics: [],
  });
  const [detailsModal, setDetailsModal] = useState<MemberDetailsModal>({ isOpen: false, member: null });

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);

      const collections = ["consult", "gym", "karate", "personalTraining", "registrations", "videos", "aerobics"];
      const allMembers: { [key: string]: Member[] } = {
        consult: [],
        gym: [],
        karate: [],
        personalTraining: [],
        registrations: [],
        videos: [],
        aerobics: [],
      };

      await Promise.all(
        collections.map(async (collectionName) => {
          try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            const memberData = querySnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                birthDate: data.birthDate || "",
                bloodType: data.bloodType || "",
                breakfastFrequency: data.breakfastFrequency || "",
                city: data.city || "",
                createdAt: data.createdAt || { seconds: 0, nanoseconds: 0 },
                eatingReasons: data.eatingReasons || [],
                email: data.email || "",
                emergencyName: data.emergencyName || "",
                emergencyPhone: data.emergencyPhone || "",
                exerciseDays: data.exerciseDays || [],
                exerciseDuration: data.exerciseDuration || "",
                exercisePain: data.exercisePain || false,
                exerciseTime: data.exerciseTime || "",
                firstName: data.firstName || "",
                foodTracking: data.foodTracking || false,
                goalWeight: data.goalWeight || "",
                healthIssues: data.healthIssues || "",
                height: data.height || "",
                lastName: data.lastName || "",
                medications: data.medications || "",
                membershipType: data.membershipType || "",
                nightEating: data.nightEating || "",
                nutritionRating: data.nutritionRating || "",
                password: data.password || "",
                phoneNumber: data.phoneNumber || "",
                proSport: data.proSport || false,
                role: data.role || "",
                signature: data.signature || "",
                smoke: data.smoke || false,
                startMonth: data.startMonth || "",
                state: data.state || "",
                streetAddress: data.streetAddress || "",
                streetAddress2: data.streetAddress2 || "",
                supplements: data.supplements || false,
                surgery: data.surgery || false,
                trainingGoals: data.trainingGoals || [],
                userId: data.userId || "",
                weight: data.weight || "",
                zipCode: data.zipCode || "",
                collectionType: collectionName,
                name: data.name || undefined,
                membership: data.membership || undefined,
                status: data.status || undefined,
                statusColor: data.statusColor || undefined,
                payed: data.payed || false,
                actionDelete: data.actionDelete || "delete",
                actionDetail: data.actionDetail || "detail",
                actionPayed: data.actionPayed || "payed",
                ...data,
              };
            });
            allMembers[collectionName] = memberData;
          } catch (error) {
            console.error(`Error fetching ${collectionName}:`, error);
            allMembers[collectionName] = [];
          }
        })
      );

      setMembers(allMembers);
      setFetchError(null);
    } catch (error) {
      console.error("Error fetching members:", error);
      setFetchError("Failed to fetch members. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [refreshTrigger]);

  const openDetailsModal = async (member: Member) => {
    try {
      const collectionType = member.collectionType ?? "unknown";
      const memberRef = doc(db, collectionType, member.id);
      const memberSnap = await getDoc(memberRef);

      if (memberSnap.exists()) {
        const data = memberSnap.data();
        const freshMember: Member = {
          id: memberSnap.id,
          name: data.name || "Unknown",
          email: data.email || "Unknown",
          membership: data.membership || "Unknown",
          status: data.status || "Unknown",
          statusColor: data.statusColor || "text-gray-500",
          collectionType: collectionType,
          payed: data.payed || false,
          actionDelete: data.actionDelete || "delete",
          actionDetail: data.actionDetail || "detail",
          actionPayed: data.actionPayed || "payed",
          ...data,
        };
        setDetailsModal({ isOpen: true, member: freshMember });
      } else {
        console.warn(`Member ${member.id} not found in ${collectionType}`);
        setDetailsModal({ isOpen: true, member: { ...member, name: member.name || "Unknown", email: member.email || "Unknown", payed: member.payed || false, actionPayed: member.actionPayed || "payed" } });
      }
    } catch (error) {
      console.error("Error fetching member details:", error);
      setDetailsModal({ isOpen: true, member: { ...member, name: member.name || "Unknown", email: member.email || "Unknown", payed: member.payed || false, actionPayed: member.actionPayed || "payed" } });
    }
  };

  const closeDetailsModal = () => {
    setDetailsModal({ isOpen: false, member: null });
  };

  const handleDelete = async (id: string, collectionType: string | undefined) => {
    try {
      const safeCollectionType = collectionType ?? "unknown";
      await deleteDoc(doc(db, safeCollectionType, id));
      setMembers((prev) => ({
        ...prev,
        [safeCollectionType]: prev[safeCollectionType].filter((member) => member.id !== id),
      }));
    } catch (error) {
      console.error("Error deleting member:", error);
      setFetchError("Failed to delete member. Please try again.");
    }
  };

  const handleSetPayed = async (id: string, collectionType: string | undefined, currentPayed: boolean) => {
    try {
      const safeCollectionType = collectionType ?? "unknown";
      const memberRef = doc(db, safeCollectionType, id);
      await updateDoc(memberRef, {
        payed: !currentPayed,
      });

      setMembers((prev) => ({
        ...prev,
        [safeCollectionType]: prev[safeCollectionType].map((member) =>
          member.id === id
            ? {
                ...member,
                payed: !currentPayed,
              }
            : member
        ),
      }));
    } catch (error) {
      console.error("Error updating payed status:", error);
      setFetchError("Failed to update payed status. Please try again.");
    }
  };

  const renderTable = (collectionName: string, collectionMembers: Member[]) => (
    <div
      className={`${
        isHighContrast ? "bg-gray-800 text-white border-gray-600" : "bg-white text-gray-900 border-gray-200"
      } rounded-xl shadow-lg p-6 mb-10 transition-colors duration-300 border`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold capitalize">{collectionName} Members</h3>
        <button
          onClick={fetchMembers}
          className={`flex items-center px-3 py-1 rounded-lg text-sm ${
            isHighContrast ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"
          }`}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={`mr-1 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {isLoading && <div className="text-center py-4">Loading {collectionName} members...</div>}

      {fetchError && <div className="text-red-500 mb-4">{fetchError}</div>}

      {!isLoading && collectionMembers.length === 0 && !fetchError && (
        <div className="text-gray-500 mb-4">No members found in {collectionName}</div>
      )}

      {!isLoading && collectionMembers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className={`border-b ${
                  isHighContrast ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"
                }`}
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
                    (member.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (member.email ?? "").toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((member) => (
                  <tr
                    key={`${member.id}-${member.collectionType ?? "unknown"}`}
                    className={`border-b ${
                      isHighContrast ? "border-gray-600 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"
                    } transition-colors duration-200`}
                  >
                    <td className="py-4 px-2">{member.name}</td>
                    <td className="py-4 px-2">{member.email}</td>
                    <td className="py-4 px-2">{member.membership}</td>
                    <td className="py-4 px-2">{member.payed ? "Yes" : "No"}</td>
                    <td className="py-4 px-2 flex space-x-2">
                      <button
                        onClick={() => openDetailsModal(member)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          isHighContrast
                            ? "bg-gray-600 text-white hover:bg-gray-500"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                        } transition-colors duration-200`}
                        title={member.actionDetail}
                      >
                        {member.actionDetail}
                      </button>
                      <button
                        onClick={() => handleSetPayed(member.id, member.collectionType, member.payed)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          isHighContrast
                            ? "bg-gray-600 text-white hover:bg-gray-500"
                            : "bg-green-500 text-white hover:bg-green-600"
                        } transition-colors duration-200`}
                        title={member.actionPayed}
                      >
                        {member.actionPayed}
                      </button>
                      <button
                        onClick={() => handleDelete(member.id, member.collectionType)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          isHighContrast
                            ? "bg-gray-600 text-white hover:bg-gray-500"
                            : "bg-red-500 text-white hover:bg-red-600"
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
      {["consult", "gym", "karate", "personalTraining", "registrations", "videos", "aerobics"].map((collection) => (
        <div key={collection}>{renderTable(collection, members[collection])}</div>
      ))}

      {/* Member Details Modal */}
      {detailsModal.isOpen && detailsModal.member && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`${
              isHighContrast ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            } rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Member Details</h3>
              <button
                onClick={closeDetailsModal}
                className={`${
                  isHighContrast ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(detailsModal.member)
                .filter(([key]) => key !== "id" && key !== "collectionType")
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium capitalize">{key}:</span>
                    <span>{typeof value === "object" ? JSON.stringify(value) : String(value)}</span>
                  </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeDetailsModal}
                className={`px-4 py-2 rounded-lg ${
                  isHighContrast
                    ? "bg-gray-600 text-white hover:bg-gray-500"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                } transition-colors duration-200`}
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