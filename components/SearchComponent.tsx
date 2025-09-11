'use client';

import { Search, XCircle, ChevronDown, X } from 'lucide-react';
import { useState, useEffect, useContext } from 'react';
import fuzzysearch from 'fuzzysearch';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../app/fconfig';
import { ThemeContext } from '../context/ThemeContext';

interface SearchComponentProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  theme: 'light' | 'dark';
  userName?: string;
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
  photoURL?: string;
  [key: string]: any;
}

export default function SearchComponent({ searchQuery, setSearchQuery, theme, userName }: SearchComponentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchByMembership, setSearchByMembership] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const categories = ['All', 'Gym', 'Karate', 'Earobics', 'Personal Training'];
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('SearchComponent must be used within a ThemeProvider');
  }

  const fetchData = async (queryText: string, category: string) => {
    if (!queryText) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let results: CollectionItem[] = [];

    try {
      // Only query the "gym" collection
      const colRef = collection(db, 'GYM');
      const snapshot = await getDocs(colRef);
      const docs = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Use the 'photoURL' field as the Cloudinary URL, fallback to undefined if not present
        const photoURL = data.photoURL ? data.photoURL : undefined;
        return {
          id: doc.id,
          ...data,
          photoURL, // Ensure photoURL is included for consistency
        };
      }) as CollectionItem[];

      // Filter by category first
      let filteredDocs = docs;
      if (category !== 'All') {
        filteredDocs = docs.filter((item) => 
          item.category && 
          typeof item.category === 'string' && 
          item.category.toLowerCase() === category.toLowerCase()
        );
      }

      // Then filter by search query
      results = filteredDocs.filter((item) => {
        if (searchByMembership) {
          return (
            item.membershipType &&
            typeof item.membershipType === 'string' &&
            fuzzysearch(queryText.toLowerCase(), item.membershipType.toLowerCase())
          );
        } else {
          const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim();
          return (
            (item.firstName &&
              typeof item.firstName === 'string' &&
              fuzzysearch(queryText.toLowerCase(), item.firstName.toLowerCase())) ||
            (item.lastName &&
              typeof item.lastName === 'string' &&
              fuzzysearch(queryText.toLowerCase(), item.lastName.toLowerCase())) ||
            (fullName && fuzzysearch(queryText.toLowerCase(), fullName.toLowerCase()))
          );
        }
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Error fetching data from Firestore:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchMyName = () => {
    if (userName) {
      setSearchByMembership(false);
      setSearchQuery(userName);
    }
  };

  const handlePaid = async (item: CollectionItem) => {
    try {
      const docRef = doc(db, 'GYM', item.id); // Always update in gym collection
      await updateDoc(docRef, { paymentStatus: 'Paid' });
      setSearchResults((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, paymentStatus: 'Paid' } : i))
      );
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const handlePending = async (item: CollectionItem) => {
    try {
      const docRef = doc(db, 'GYM', item.id); // Always update in gym collection
      await updateDoc(docRef, { paymentStatus: 'Pending' });
      setSearchResults((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, paymentStatus: 'Pending' } : i))
      );
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const handleDetail = (item: CollectionItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: CollectionItem) => {
    if (window.confirm(`Are you sure you want to delete ${item.firstName} ${item.lastName}?`)) {
      try {
        const docRef = doc(db, 'GYM', item.id); // Always delete from gym collection
        await deleteDoc(docRef);
        setSearchResults((prev) => prev.filter((i) => i.id !== item.id));
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

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
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-md border ${
              theme === 'light'
                ? 'bg-white border-gray-200 text-gray-900'
                : 'bg-gray-800 border-gray-600 text-white'
            } focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200`}
          >
            {selectedCategory}
            <ChevronDown
              size={18}
              className={theme === 'light' ? 'text-blue-600' : 'text-yellow-400'}
            />
          </button>
          {isDropdownOpen && (
            <div
              className={`absolute mt-2 w-48 rounded-lg shadow-lg z-10 ${
                theme === 'light' ? 'bg-white text-gray-900' : 'bg-gray-800 text-white'
              }`}
            >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setIsDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    theme === 'light' ? 'hover:bg-blue-100 text-gray-700' : 'hover:bg-gray-700 text-gray-300'
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
            className={`flex items-center flex-1 rounded-lg shadow-md border ${
              theme === 'light'
                ? 'bg-white border-gray-200 text-gray-900'
                : 'bg-gray-700 border-gray-600 text-white'
            } focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-300`}
          >
            <Search
              size={25}
              className={`ml-4 ${theme === 'light' ? 'text-blue-600' : 'text-yellow-400'} transition-colors duration-200`}
            />
            <input
              type="text"
              placeholder={`Search ${selectedCategory.toLowerCase()} by ${searchByMembership ? 'membership type' : 'name'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-3 bg-transparent rounded-lg focus:outline-none placeholder:${
                theme === 'light' ? 'text-gray-500' : 'text-gray-400'
              } text-sm font-medium transition-all duration-200`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`mr-4 p-1 rounded-full ${theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-yellow-400 hover:text-yellow-300'}`}
              >
                <XCircle size={18} />
              </button>
            )}
          </div>
          <button
            onClick={() => setSearchByMembership(!searchByMembership)}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              theme === 'light'
                ? searchByMembership
                  ? 'bg-blue-200 text-blue-700 hover:bg-blue-300'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : searchByMembership
                ? 'bg-gray-600 text-white hover:bg-gray-500'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            } transition-colors duration-200`}
          >
            {searchByMembership ? 'Membership' : 'Name'}
          </button>
        </div>
      </div>

      {/* Search My Name Button */}
      {userName && (
        <button
          onClick={handleSearchMyName}
          className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium ${
            theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-700 text-white hover:bg-gray-600'
          } transition-colors duration-200`}
        >
          Search My Name
        </button>
      )}

      {/* Search Results Table */}
      {searchQuery && (
        <div className="mt-6 w-full">
          {loading ? (
            <p className={`text-center text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
              Loading...
            </p>
          ) : searchResults.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <table
                className={`w-full table-auto divide-y ${theme === 'light' ? 'divide-gray-200' : 'divide-gray-600'}`}
              >
                <thead
                  className={`sticky top-0 ${theme === 'light' ? 'bg-gradient-to-r from-blue-50 to-purple-50' : 'bg-gradient-to-r from-gray-700 to-gray-800'}`}
                >
                  <tr>
                    <th
                      scope="col"
                      className={`w-[10%] px-4 py-3 text-left text-xs font-medium ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                      } uppercase tracking-wider`}
                    >
                      Photo
                    </th>
                    <th
                      scope="col"
                      className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                      } uppercase tracking-wider`}
                    >
                      First Name
                    </th>
                    <th
                      scope="col"
                      className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                      } uppercase tracking-wider`}
                    >
                      Last Name
                    </th>
                    <th
                      scope="col"
                      className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                      } uppercase tracking-wider`}
                    >
                      Membership Type
                    </th>
                    <th
                      scope="col"
                      className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                      } uppercase tracking-wider`}
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                      } uppercase tracking-wider`}
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                      } uppercase tracking-wider`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`${theme === 'light' ? 'bg-white divide-gray-200' : 'bg-gray-800 divide-gray-600'} divide-y`}
                >
                  {searchResults.map((item) => (
                    <tr
                      key={item.id}
                      className={theme === 'light' ? 'hover:bg-blue-50' : 'hover:bg-gray-700'}
                    >
                      <td className="px-4 py-4 max-w-[10%]">
                        {item.photoURL ? (
                          <button 
                            onClick={() => handleImageClick(item.photoURL!)}
                            className="focus:outline-none"
                          >
                            <img 
                              src={item.photoURL} 
                              alt={`${item.firstName} ${item.lastName}`}
                              className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity duration-200"
                            />
                          </button>
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            theme === 'light' ? 'bg-gray-200 text-gray-600' : 'bg-gray-600 text-gray-300'
                          }`}>
                            <span className="text-xs">
                              {item.firstName ? item.firstName.charAt(0) : ''}
                              {item.lastName ? item.lastName.charAt(0) : ''}
                            </span>
                          </div>
                        )}
                      </td>
                      <td
                        className={`px-4 py-4 text-sm ${
                          theme === 'light' ? 'text-gray-900' : 'text-gray-300'
                        } truncate max-w-[15%]`}
                      >
                        {item.firstName || 'N/A'}
                      </td>
                      <td
                        className={`px-4 py-4 text-sm ${
                          theme === 'light' ? 'text-gray-900' : 'text-gray-300'
                        } truncate max-w-[15%]`}
                      >
                        {item.lastName || 'N/A'}
                      </td>
                      <td
                        className={`px-4 py-4 text-sm ${
                          theme === 'light' ? 'text-gray-900' : 'text-gray-300'
                        } truncate max-w-[15%]`}
                      >
                        {item.membershipType || 'N/A'}
                      </td>
                      <td
                        className={`px-4 py-4 text-sm ${
                          theme === 'light' ? 'text-gray-900' : 'text-gray-300'
                        } truncate max-w-[15%]`}
                      >
                        {item.category}
                      </td>
                      <td
                        className={`px-4 py-4 text-sm ${
                          theme === 'light' ? 'text-gray-500' : 'text-gray-300'
                        } truncate max-w-[15%]`}
                      >
                        {item.email || 'N/A'}
                      </td>
                      <td
                        className={`px-4 py-4 text-sm ${
                          theme === 'light' ? 'text-gray-900' : 'text-gray-300'
                        } max-w-[15%]`}
                      >
                        <div className="flex gap-1">
                          <button
                            onClick={() => handlePaid(item)}
                            className={`px-2 py-1 rounded text-xs ${
                              theme === 'light'
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
                            } transition-colors duration-200`}
                          >
                            Paid
                          </button>
                          <button
                            onClick={() => handleDetail(item)}
                            className={`px-2 py-1 rounded text-xs ${
                              theme === 'light'
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
                            } transition-colors duration-200`}
                          >
                            Detail
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className={`px-2 py-1 rounded text-xs ${
                              theme === 'light'
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
                            } transition-colors duration-200`}
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handlePending(item)}
                            className={`px-2 py-1 rounded text-xs ${
                              theme === 'light'
                                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
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
            <p className={`text-center text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'}`}>
              No results found
            </p>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-lg ${
              theme === 'light'
                ? 'bg-gradient-to-br from-blue-100 to-purple-100 text-zinc-800'
                : 'bg-gradient-to-br from-gray-700 to-gray-800 text-white'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-semibold ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
                Member Details
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                } transition-colors duration-200 flex items-center gap-2`}
              >
                Close
                <X size={20} className={theme === 'light' ? 'text-white' : 'text-white'} />
              </button>
            </div>
            
            {/* Photo in Modal */}
            <div className="flex justify-center mb-4">
              {selectedItem.photoURL ? (
                <button 
                  onClick={() => handleImageClick(selectedItem.photoURL!)}
                  className="focus:outline-none"
                >
                  <img 
                    src={selectedItem.photoURL} 
                    alt={`${selectedItem.firstName} ${selectedItem.lastName}`}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md cursor-pointer hover:opacity-80 transition-opacity duration-200"
                  />
                </button>
              ) : (
                <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 border-white shadow-md ${
                  theme === 'light' ? 'bg-gray-200 text-gray-600' : 'bg-gray-600 text-gray-300'
                }`}>
                  <span className="text-2xl">
                    {selectedItem.firstName ? selectedItem.firstName.charAt(0) : ''}
                    {selectedItem.lastName ? selectedItem.lastName.charAt(0) : ''}
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <p>
                <strong className={theme === 'light' ? 'text-zinc-800' : 'text-white'}>First Name:</strong>{' '}
                {selectedItem.firstName || 'N/A'}
              </p>
              <p>
                <strong className={theme === 'light' ? 'text-zinc-800' : 'text-white'}>Last Name:</strong>{' '}
                {selectedItem.lastName || 'N/A'}
              </p>
              <p>
                <strong className={theme === 'light' ? 'text-zinc-800' : 'text-white'}>Membership Type:</strong>{' '}
                {selectedItem.membershipType || 'N/A'}
              </p>
              <p>
                <strong className={theme === 'light' ? 'text-zinc-800' : 'text-white'}>Category:</strong>{' '}
                {selectedItem.category || 'N/A'}
              </p>
              <p>
                <strong className={theme === 'light' ? 'text-zinc-800' : 'text-white'}>Email:</strong>{' '}
                {selectedItem.email || 'N/A'}
              </p>
              <p>
                <strong className={theme === 'light' ? 'text-zinc-800' : 'text-white'}>Phone Number:</strong>{' '}
                {selectedItem.phoneNumber || 'N/A'}
              </p>
              <p>
                <strong className={theme === 'light' ? 'text-zinc-800' : 'text-white'}>Payment Status:</strong>{' '}
                {selectedItem.paymentStatus || 'N/A'}
              </p>
              {Object.entries(selectedItem)
                .filter(
                  ([key]) =>
                    !['id', 'firstName', 'lastName', 'membershipType', 'category', 'email', 'phoneNumber', 'paymentStatus', 'photoURL'].includes(
                      key
                    )
                )
                .map(([key, value]) => (
                  <p key={key}>
                    <strong className={theme === 'light' ? 'text-zinc-800' : 'text-white'}>{key}:</strong>{' '}
                    {value || 'N/A'}
                  </p>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-4xl w-full max-h-full">
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10"
            >
              <X size={30} />
            </button>
            <div className="flex justify-center items-center h-full">
              <img 
                src={selectedImage} 
                alt="Enlarged profile"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}