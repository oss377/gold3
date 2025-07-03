"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  MessageSquare,
  UserPlus,
  Menu,
  X,
  Dumbbell,
  Users,
  Calendar,
  BarChart,
  Settings,
  LogOut,
  Sun,
  Moon,
  Search,
  Upload,
  Trash2,
  Clock,
  Info,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import VideoUploadModal from "../../components/VideoUploadModal";
import RegisterMember from "../../components/RegisterMember";
import DataFetcher from "../../components/DataFetcher";
import { db } from "../fconfig";
import { deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";

interface Member {
  id: string;
  name: string | undefined;
  email: string | undefined;
  membership: string | undefined;
  status: string | undefined;
  statusColor: string | undefined;
  collectionType: string | undefined;
  [key: string]: any;
}

interface MemberDetailsModal {
  isOpen: boolean;
  member: Member | null;
}

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}

export default function GymDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<number>(4);
  const [messages, setMessages] = useState<number>(7);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const router = useRouter();

  const navItems: NavItem[] = [
    { name: "Dashboard", href: "/admin", icon: BarChart },
    { name: "Members", href: "/admin/members", icon: Users },
    { name: "Classes", href: "/admin/classes", icon: Calendar },
    { name: "Settings", href: "/admin/settings", icon: Settings },
    { name: "Logout", icon: LogOut },
  ];

  const handleDataFetched = (data: { [key: string]: Member[] }, error: string | null) => {
    setMembers(data);
    setFetchError(error);
    setIsLoading(false);
  };

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleContrast = () => setIsHighContrast(!isHighContrast);
  const handleLogout = () => router.push("/");
  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);
  const openRegisterModal = () => setIsRegisterModalOpen(true);
  const closeRegisterModal = () => setIsRegisterModalOpen(false);

  const openDetailsModal = async (member: Member) => {
    try {
      const collectionType = member.collectionType ?? "unknown";
      const memberRef = doc(db, collectionType, member.id);
      const memberSnap = await getDoc(memberRef);

      if (memberSnap.exists()) {
        const data = memberSnap.data();
        const freshMember: Member = {
          id: memberSnap.id,
          name: data.name ?? "Unknown",
          email: data.email ?? "Unknown",
          membership: data.membership ?? "Unknown",
          status: data.status ?? "Unknown",
          statusColor: data.statusColor ?? "text-gray-500",
          collectionType: collectionType,
          ...data,
        };
        setDetailsModal({ isOpen: true, member: freshMember });
      } else {
        console.warn(`Member ${member.id} not found in ${collectionType}`);
        setDetailsModal({ isOpen: true, member });
      }
    } catch (error) {
      console.error("Error fetching member details:", error);
      setDetailsModal({ isOpen: true, member });
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

  const handleSetPending = async (id: string, collectionType: string | undefined) => {
    try {
      const safeCollectionType = collectionType ?? "unknown";
      const memberRef = doc(db, safeCollectionType, id);
      await updateDoc(memberRef, {
        status: "Pending",
        statusColor: "text-yellow-500",
      });

      setMembers((prev) => ({
        ...prev,
        [safeCollectionType]: prev[safeCollectionType].map((member) =>
          member.id === id
            ? {
                ...member,
                status: "Pending",
                statusColor: "text-yellow-500",
              }
            : member
        ),
      }));
    } catch (error) {
      console.error("Error updating status:", error);
      setFetchError("Failed to update member status. Please try again.");
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
          onClick={refreshData}
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
                <th className="py-4 px-2">Status</th>
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
                    <td className="py-4 px-2">{member.name ?? "Unknown"}</td>
                    <td className="py-4 px-2">{member.email ?? "Unknown"}</td>
                    <td className="py-4 px-2">{member.membership ?? "Unknown"}</td>
                    <td className="py-4 px-2">
                      <span className={member.statusColor ?? "text-gray-500"}>{member.status ?? "Unknown"}</span>
                    </td>
                    <td className="py-4 px-2 flex space-x-2">
                      <button
                        onClick={() => openDetailsModal(member)}
                        className={`p-2 rounded-lg ${
                          isHighContrast
                            ? "bg-gray-600 text-white hover:bg-gray-500"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                        } transition-colors duration-200`}
                        title="View Details"
                      >
                        <Info size={16} />
                      </button>
                      <button
                        onClick={() => handleSetPending(member.id, member.collectionType)}
                        className={`p-2 rounded-lg ${
                          isHighContrast
                            ? "bg-gray-600 text-white hover:bg-gray-500"
                            : "bg-yellow-500 text-white hover:bg-yellow-600"
                        } transition-colors duration-200`}
                        title="Set to Pending"
                      >
                        <Clock size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id, member.collectionType)}
                        className={`p-2 rounded-lg ${
                          isHighContrast
                            ? "bg-gray-600 text-white hover:bg-gray-500"
                            : "bg-red-500 text-white hover:bg-red-600"
                        } transition-colors duration-200`}
                        title="Delete"
                      >
                        <Trash2 size={16} />
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
    <div
      className={`flex h-screen ${
        isHighContrast ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      } font-sans transition-colors duration-300`}
    >
      <DataFetcher onDataFetched={handleDataFetched} refreshTrigger={refreshTrigger} />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 ${
          isHighContrast ? "bg-gray-800" : "bg-gradient-to-b from-indigo-800 to-indigo-600"
        } text-white shadow-2xl transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between p-5 border-b border-indigo-500/50">
          <div className="flex items-center space-x-3">
            <Dumbbell size={30} className="text-white" />
            <h1 className="text-xl font-bold tracking-tight">ADMIN DASHBOARD</h1>
          </div>
          <button className="text-white hover:text-indigo-200" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>
        <nav className="mt-8 space-y-2 px-3">
          {navItems.map((item) =>
            item.name === "Logout" ? (
              <button
                key={item.name}
                onClick={handleLogout}
                className={`flex items-center w-64 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isHighContrast ? "hover:bg-gray-700 hover:text-white" : "hover:bg-indigo-700 hover:text-white"
                }`}
              >
                <item.icon size={20} className="mr-3" />
                <span>{item.name}</span>
              </button>
            ) : (
              <Link
                key={item.name}
                href={item.href ?? "#"}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isHighContrast ? "hover:bg-gray-700 hover:text-white" : "hover:bg-indigo-700 hover:text-white"
                }`}
              >
                <item.icon size={20} className="mr-3" />
                <span>{item.name}</span>
              </Link>
            )
          )}
          <button
            onClick={toggleContrast}
            className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              isHighContrast ? "hover:bg-gray-700" : "hover:bg-indigo-700"
            }`}
          >
            {isHighContrast ? <Sun size={20} className="mr-3" /> : <Moon size={20} className="mr-3" />}
            <span>{isHighContrast ? "Light Mode" : "High Contrast"}</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Header */}
        <header
          className={`${
            isHighContrast ? "bg-gray-800 text-white" : "bg-white text-gray-900"
          } shadow-md p-5 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300`}
        >
          <div className="flex items-center">
            <button
              className={`mr-4 ${
                isHighContrast ? "text-gray-300 hover:text-white" : "text-indigo-600 hover:text-indigo-800"
              }`}
              onClick={toggleSidebar}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-2xl font-semibold tracking-tight">ADMIN DASHBOARD</h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Search
                size={24}
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isHighContrast ? "text-gray-300" : "text-gray-600"
                }`}
              />
              <input
                type="text"
                placeholder="Search members, classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-lg ${
                  isHighContrast
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-100 text-gray-900 border-gray-300"
                } border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200`}
              />
            </div>
            <div className="relative group">
              <Bell
                size={24}
                className={`${
                  isHighContrast ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-indigo-600"
                } cursor-pointer transition-colors duration-200`}
              />
              {notifications > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {notifications}
                </span>
              )}
              <div
                className={`absolute right-0 mt-3 w-64 ${
                  isHighContrast ? "bg-gray-700 text-white" : "bg-white text-gray-700"
                } rounded-lg shadow-xl hidden group-hover:block z-10 transition-opacity duration-200`}
              >
                <div className="p-3 text-sm border-b">New member registrations</div>
                <div className="p-3 text-sm">Equipment maintenance alert</div>
              </div>
            </div>
            <div className="relative group">
              <MessageSquare
                size={24}
                className={`${
                  isHighContrast ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-indigo-600"
                } cursor-pointer transition-colors duration-200`}
              />
              {messages > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {messages}
                </span>
              )}
              <div
                className={`absolute right-0 mt-3 w-64 ${
                  isHighContrast ? "bg-gray-700 text-white" : "bg-white text-gray-700"
                } rounded-lg shadow-xl hidden group-hover:block z-10 transition-opacity duration-200`}
              >
                <div className="p-3 text-sm border-b">New message from trainer</div>
                <div className="p-3 text-sm">Member feedback</div>
              </div>
            </div>
            <button
              onClick={openUploadModal}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                isHighContrast ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              <Upload size={20} className="mr-2" />
              Upload Video
            </button>
            <button
              onClick={openRegisterModal}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                isHighContrast ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              <UserPlus size={20} className="mr-2" />
              Register Member
            </button>
          </div>
        </header>

        {/* Video Upload Modal */}
        <VideoUploadModal isOpen={isUploadModalOpen} onClose={closeUploadModal} isHighContrast={isHighContrast} />

        {/* Register Member Modal */}
        <RegisterMember isOpen={isRegisterModalOpen} onClose={closeRegisterModal} isHighContrast={isHighContrast} />

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
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-2">
                {Object.entries(detailsModal.member)
                  .filter(([key]) => key !== "id" && key !== "collectionType")
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium capitalize">{key}:</span>
                      <span>{typeof value === "object" ? JSON.stringify(value) : String(value ?? "Unknown")}</span>
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

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Stats Cards */}
          <div
            className={`grid ${
              isSidebarOpen ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            } gap-6 mb-10 transition-all duration-300`}
          >
            {[
              { title: "Active Members", value: "1,567", change: "+12% this month" },
              { title: "Classes Today", value: "24", change: "+3 from yesterday" },
              { title: "New Signups", value: "45", change: "+15% this week" },
              { title: "Revenue", value: "$8,920", change: "+7% this month" },
            ].map((stat, index) => (
              <div
                key={index}
                className={`${
                  isHighContrast ? "bg-gray-800 text-white border-gray-600" : "bg-white text-gray-900 border-gray-200"
                } rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border`}
              >
                <h3 className="text-lg font-semibold">{stat.title}</h3>
                <p
                  className={`text-3xl font-bold mt-2 ${isHighContrast ? "text-indigo-300" : "text-indigo-600"}`}
                >
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
              </div>
            ))}
          </div>

          {/* Workout Schedule */}
          <div
            className={`${
              isHighContrast ? "bg-gray-800 text-white border-gray-600" : "bg-white text-gray-900 border-gray-200"
            } rounded-xl shadow-lg p-6 mb-10 transition-colors duration-300 border`}
          >
            <h3 className="text-xl font-semibold mb-6">Today's Workout Schedule</h3>
            <div
              className={`grid ${
                isSidebarOpen ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              } gap-4 transition-all duration-300`}
            >
              {[
                { title: "Yoga Class", time: "9:00 AM - 10:00 AM", instructor: "Sarah Johnson" },
                { title: "Strength Training", time: "11:00 AM - 12:00 PM", instructor: "Mike Brown" },
                { title: "Spin Class", time: "6:00 PM - 7:00 PM", instructor: "Emily Davis" },
              ].map((schedule, index) => (
                <div
                  key={index}
                  className={`${
                    isHighContrast ? "border-gray-600" : "border-gray-200"
                  } border rounded-lg p-5 hover:bg-opacity-10 hover:bg-indigo-500 transition-all duration-200`}
                >
                  <h4 className="font-semibold text-lg">{schedule.title}</h4>
                  <p className="text-sm text-gray-500">{schedule.time}</p>
                  <p className="text-sm text-gray-600">Instructor: {schedule.instructor}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Members Tables */}
          {["consult", "gym", "karate", "personalTraining", "registrations", "videos", "aerobics"].map((collection) => (
            <div key={collection}>{renderTable(collection, members[collection])}</div>
          ))}
        </main>
      </div>
    </div>
  );
}