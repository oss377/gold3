import { Search, XCircle, ChevronDown, X } from "lucide-react";
import { useState, useEffect } from "react";
import fuzzysearch from "fuzzysearch";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../app/fconfig"; // Assumes Firebase is initialized in firebase.ts

interface SearchComponentProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isHighContrast: boolean;
  userName?: string; // Optional prop for current user's name
}

interface CollectionItem {
  id: string;
  firstName?: string;
  lastName?: string;
  membershipType?: string;
  category: string;
  email?: string;
  phoneNumber?: string;
  paymentStatus?: string;
  [key: string]: any; // Allow for additional fields
}

export default function SearchComponent({ searchQuery, setSearchQuery, isHighContrast, userName }: SearchComponentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchByMembership, setSearchByMembership] = useState(false); // Toggle for search mode
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null); // For detail modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const categories = ["All", "Gym", "Karate", "Earobics"];

  // Fetch data from Firestore based on category and query
  const fetchData = async (queryText: string, category: string) => {
    if (!queryText) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let results: CollectionItem[] = [];

    try {
      const collectionsToQuery = category === "All" ? categories.slice(1) : [category];

      for (const col of collectionsToQuery) {
        const colRef = collection(db, col.toLowerCase());
        const snapshot = await getDocs(colRef);
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          category: col,
        })) as CollectionItem[];

        // Apply fuzzy search based on toggle
        results = results.concat(
          docs.filter(item => {
            if (searchByMembership) {
              return (
                item.membershipType &&
                typeof item.membershipType === "string" &&
                fuzzysearch(queryText.toLowerCase(), item.membershipType.toLowerCase())
              );
            } else {
              const fullName = `${item.firstName || ""} ${item.lastName || ""}`.trim();
              return (
                (item.firstName &&
                  typeof item.firstName === "string" &&
                  fuzzysearch(queryText.toLowerCase(), item.firstName.toLowerCase())) ||
                (item.lastName &&
                  typeof item.lastName === "string" &&
                  fuzzysearch(queryText.toLowerCase(), item.lastName.toLowerCase())) ||
                (fullName && fuzzysearch(queryText.toLowerCase(), fullName.toLowerCase()))
              );
            }
          })
        );
      }

      setSearchResults(results);
    } catch (error) {
      console.error("Error fetching data from Firestore:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle "Search My Name" functionality
  const handleSearchMyName = () => {
    if (userName) {
      setSearchByMembership(false); // Ensure name search is active
      setSearchQuery(userName);
    }
  };

  // Handle "Paid" button
  const handlePaid = async (item: CollectionItem) => {
    try {
      const docRef = doc(db, item.category.toLowerCase(), item.id);
      await updateDoc(docRef, { paymentStatus: "Paid" });
      setSearchResults(prev =>
        prev.map(i => (i.id === item.id ? { ...i, paymentStatus: "Paid" } : i))
      );
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  // Handle "Pending" button
  const handlePending = async (item: CollectionItem) => {
    try {
      const docRef = doc(db, item.category.toLowerCase(), item.id);
      await updateDoc(docRef, { paymentStatus: "Pending" });
      setSearchResults(prev =>
        prev.map(i => (i.id === item.id ? { ...i, paymentStatus: "Pending" } : i))
      );
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  // Handle "Detail" button
  const handleDetail = (item: CollectionItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Handle "Delete" button
  const handleDelete = async (item: CollectionItem) => {
    if (window.confirm(`Are you sure you want to delete ${item.firstName} ${item.lastName}?`)) {
      try {
        const docRef = doc(db, item.category.toLowerCase(), item.id);
        await deleteDoc(docRef);
        setSearchResults(prev => prev.filter(i => i.id !== item.id));
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    }
  };

  // Fetch data when query, category, or search mode changes
  useEffect(() => {
    fetchData(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory, searchByMembership]);

  return (
    <div className={`relative w-full max-w-5xl mb-10 mx-auto transition-all duration-300 group`}>
      <div className="flex gap-4 items-center">
        {/* Category Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-md border-2 ${
              isHighContrast
                ? "bg-gray-800 border-gray-600 text-white"
                : "bg-white border-indigo-200 text-gray-900"
            } focus:outline-none transition-all duration-200`}
          >
            {selectedCategory}
            <ChevronDown
              size={18}
              className={`${
                isHighContrast ? "text-gray-300" : "text-indigo-500"
              } group-hover:text-indigo-600 transition-colors duration-200`}
            />
          </button>
          {isDropdownOpen && (
            <div
              className={`absolute mt-2 w-40 rounded-md shadow-lg ${
                isHighContrast ? "bg-gray-800 text-white" : "bg-white text-gray-900"
              } z-10`}
            >
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setIsDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    isHighContrast
                      ? "hover:bg-gray-700 text-gray-300"
                      : "hover:bg-indigo-50 text-gray-700"
                  } transition-colors duration-200`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Input and Toggle */}
        <div className="flex items-center flex-1 gap-2 relative w-full max-w-3xl">
          <div
            className={`flex items-center flex-1 rounded-full shadow-md border-2 ${
              isHighContrast
                ? "bg-gray-800 border-gray-600 text-white"
                : "bg-white border-indigo-200 text-gray-900"
            } focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-400 transition-all duration-300`}
          >
            <Search
              size={25}
              className={`ml-4 ${
                isHighContrast ? "text-gray-300 group-hover:text-white" : "text-indigo-500 group-hover:text-indigo-600"
              } transition-colors duration-200`}
            />
            <input
              type="text"
              placeholder={`Search ${selectedCategory.toLowerCase()} by ${searchByMembership ? "membership type" : "name"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-3 bg-transparent rounded-full focus:outline-none placeholder:${
                isHighContrast ? "text-gray-400" : "text-gray-500"
              } text-sm font-medium transition-all duration-200`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={`mr-4 p-1 rounded-full ${
                  isHighContrast ? "text-gray-300 hover:text-white" : "text-indigo-500 hover:text-indigo-600"
                } transition-colors duration-200`}
              >
                <XCircle size={18} />
              </button>
            )}
          </div>
          {/* Toggle for Search Mode */}
          <button
            onClick={() => setSearchByMembership(!searchByMembership)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isHighContrast
                ? searchByMembership
                  ? "bg-gray-600 text-white"
                  : "bg-gray-700 text-gray-300"
                : searchByMembership
                ? "bg-indigo-200 text-indigo-700"
                : "bg-indigo-100 text-indigo-700"
            } transition-colors duration-200`}
          >
            {searchByMembership ? "Membership" : "Name"}
          </button>
        </div>
      </div>

      {/* Search My Name Button */}
      {userName && (
        <button
          onClick={handleSearchMyName}
          className={`mt-2 px-4 py-2 rounded-full text-sm font-medium ${
            isHighContrast
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
          } transition-colors duration-200`}
        >
          Search My Name
        </button>
      )}

      {/* Search Results Table */}
      {searchQuery && (
        <div className="mt-6 w-full">
          {loading ? (
            <p className={`${isHighContrast ? "text-gray-300" : "text-gray-600"} text-center`}>Loading...</p>
          ) : searchResults.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <table
                className={`w-full table-auto divide-y ${
                  isHighContrast ? "divide-gray-600" : "divide-gray-200"
                } whitespace-nowrap`}
              >
                <thead
                  className={`${isHighContrast ? "bg-gray-800" : "bg-gray-50"} sticky top-0`}
                >
                  <tr>
                    <th
                      scope="col"
                      className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                        isHighContrast ? "text-gray-300" : "text-gray-500"
                      } uppercase tracking-wider`}
                    >
                      First Name
                    </th>
                    <th
                      scope="col"
                      className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                        isHighContrast ? "text-gray-300" : "text-gray-500"
                      } uppercase tracking-wider`}
                    >
                      Last Name
                    </th>
                    <th
                      scope="col"
                      className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                        isHighContrast ? "text-gray-300" : "text-gray-500"
                      } uppercase tracking-wider`}
                    >
                      Membership Type
                    </th>
                    <th
                      scope="col"
                      className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                        isHighContrast ? "text-gray-300" : "text-gray-500"
                      } uppercase tracking-wider`}
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className={`w-[20%] px-4 py-3 text-left text-xs font-medium ${
                        isHighContrast ? "text-gray-300" : "text-gray-500"
                      } uppercase tracking-wider`}
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className={`w-[20%] px-4 py-3 text-left text-xs font-medium ${
                        isHighContrast ? "text-gray-300" : "text-gray-500"
                      } uppercase tracking-wider`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`${
                    isHighContrast ? "bg-gray-900 divide-gray-600" : "bg-white divide-gray-200"
                  } divide-y`}
                >
                  {searchResults.map(item => (
                    <tr key={item.id}>
                      <td
                        className={`px-4 py-4 text-sm ${
                          isHighContrast ? "text-gray-300" : "text-gray-900"
                        } truncate max-w-[15%]`}
                      >
                        {item.firstName || "N/A"}
                      </td>
                      <td
                        className={`px-4 py-4 text-sm ${
                          isHighContrast ? "text-gray-300" : "text-gray-900"
                        } truncate max-w-[15%]`}
                      >
                        {item.lastName || "N/A"}
                      </td>
                      <td
                        className={`px-4 py-4 text-sm ${
                          isHighContrast ? "text-gray-300" : "text-gray-900"
                        } truncate max-w-[15%]`}
                      >
                        {item.membershipType || "N/A"}
                      </td>
                      <td
                        className={`px-4 py-4 text-sm ${
                          isHighContrast ? "text-gray-300" : "text-gray-900"
                        } truncate max-w-[15%]`}
                      >
                        {item.category}
                      </td>
                      <td
                        className={`px-4 py-4 text-sm ${
                          isHighContrast ? "text-gray-300" : "text-gray-500"
                        } truncate max-w-[20%]`}
                      >
                        {item.email || "N/A"}
                      </td>
                      <td
                        className={`px-4 py-4 text-sm ${
                          isHighContrast ? "text-gray-300" : "text-gray-900"
                        } max-w-[20%]`}
                      >
                        <div className="flex gap-1">
                          <button
                            onClick={() => handlePaid(item)}
                            className={`px-2 py-1 rounded text-xs ${
                              isHighContrast
                                ? "bg-green-600 text-white hover:bg-green-500"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            } transition-colors duration-200`}
                          >
                            Paid
                          </button>
                          <button
                            onClick={() => handleDetail(item)}
                            className={`px-2 py-1 rounded text-xs ${
                              isHighContrast
                                ? "bg-blue-600 text-white hover:bg-blue-500"
                                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            } transition-colors duration-200`}
                          >
                            Detail
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className={`px-2 py-1 rounded text-xs ${
                              isHighContrast
                                ? "bg-red-600 text-white hover:bg-red-500"
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            } transition-colors duration-200`}
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handlePending(item)}
                            className={`px-2 py-1 rounded text-xs ${
                              isHighContrast
                                ? "bg-yellow-600 text-white hover:bg-yellow-500"
                                : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            } transition-colors duration-200`}
                          >
                            Pending
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p
              className={`text-center text-sm ${
                isHighContrast ? "text-gray-300" : "text-gray-500"
              }`}
            >
              No results found
            </p>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto ${
              isHighContrast ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            } shadow-lg`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Member Details</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  isHighContrast
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } transition-colors duration-200 flex items-center gap-2`}
              >
                Close
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              <p><strong>First Name:</strong> {selectedItem.firstName || "N/A"}</p>
              <p><strong>Last Name:</strong> {selectedItem.lastName || "N/A"}</p>
              <p><strong>Membership Type:</strong> {selectedItem.membershipType || "N/A"}</p>
              <p><strong>Category:</strong> {selectedItem.category || "N/A"}</p>
              <p><strong>Email:</strong> {selectedItem.email || "N/A"}</p>
              <p><strong>Phone Number:</strong> {selectedItem.phoneNumber || "N/A"}</p>
              <p><strong>Payment Status:</strong> {selectedItem.paymentStatus || "N/A"}</p>
              {Object.entries(selectedItem).map(([key, value]) => {
                if (
                  ![
                    "id",
                    "firstName",
                    "lastName",
                    "membershipType",
                    "category",
                    "email",
                    "phoneNumber",
                    "paymentStatus",
                  ].includes(key)
                ) {
                  return (
                    <p key={key}>
                      <strong>{key}:</strong> {value || "N/A"}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}