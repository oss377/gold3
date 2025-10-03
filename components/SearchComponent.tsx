'use client';

import { Search, XCircle, ChevronDown, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import fuzzysearch from 'fuzzysearch';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, limit, startAfter } from 'firebase/firestore';
import { db } from '../app/fconfig';

// TypeScript interface for translation
interface Translation {
  enlargedProfile?: string;
  searchPlaceholder?: string;
  searchMyName?: string;
  loading?: string;
  noResults?: string;
  photo?: string;
  firstName?: string;
  lastName?: string;
  membershipType?: string;
  category?: string;
  email?: string;
  actions?: string;
  detail?: string;
  delete?: string;
  pending?: string;
  memberDetails?: string;
  close?: string;
  confirmDelete?: string;
  phoneNumber?: string;
  paymentStatus?: string;
  selectCategory?: string;
  searchByMembership?: string;
  searchByName?: string;
  errorMessage?: string;
  payed?: string;
  notPayed?: string;
  daysStatus?: string;
  searchResultsCount?: string;
}

// TypeScript interface for collection item
interface CollectionItem {
  id: string;
  firstName?: string;
  lastName?: string;
  membershipType?: string;
  category: string;
  email?: string;
  phoneNumber?: string;
  photoURL?: string;
  payment?: string;
  paymentStartDate?: string | null | undefined;
}

// Interface for SearchComponent props
interface SearchComponentProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  theme: 'light' | 'dark';
  userName?: string;
  t: Translation;
}

const categories = ['All', 'Gym', 'Aerobics', 'Karate', 'personalTraining'];

export default function SearchComponent({ searchQuery, setSearchQuery, theme, userName, t }: SearchComponentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchByMembership, setSearchByMembership] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  const fetchData = useCallback(
    async (queryText: string, category: string, pageNum: number) => {
      if (!queryText) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      let results: CollectionItem[] = [];

      try {
        const colRef = collection(db, 'GYM');
        let q = query(colRef, limit(pageSize));
        if (pageNum > 1 && lastDoc) {
          q = query(colRef, limit(pageSize), startAfter(lastDoc));
        }
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          firstName: doc.data().firstName,
          lastName: doc.data().lastName,
          membershipType: doc.data().membershipType,
          category: doc.data().category,
          email: doc.data().email,
          phoneNumber: doc.data().phoneNumber,
          photoURL: doc.data().photoURL,
          payment: doc.data().payment || 'Not Payed', // Fetch payment field
          paymentStartDate: doc.data().paymentStartDate,
        })) as CollectionItem[];

        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === pageSize);

        let filteredDocs = docs;
        if (category !== 'All') {
          filteredDocs = docs.filter(
            (item) =>
              item.category &&
              typeof item.category === 'string' &&
              item.category.toLowerCase() === category.toLowerCase()
          );
        }

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
        toast.error(t.errorMessage || 'Failed to fetch search results');
      } finally {
        setLoading(false);
      }
    },
    [searchByMembership, t]
  );

  const calculateDaysDisplay = useCallback((payment: string, paymentStartDate?: string | null): string => {
    if (!paymentStartDate) return 'N/A';
    const startDate = new Date(paymentStartDate);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (payment === 'Payed') {
      const daysLeft = 30 - diffDays;
      return daysLeft > 0 ? t.daysStatus?.replace('{days}', `${daysLeft}`) || `${daysLeft} days left` : t.daysStatus?.replace('{days}', 'Expired') || 'Expired';
    } else {
      const daysPassed = Math.min(diffDays, 30);
      return t.daysStatus?.replace('{days}', `${daysPassed} day${daysPassed === 1 ? '' : 's'} passed`) || `${daysPassed} day${daysPassed === 1 ? '' : 's'} passed`;
    }
  }, [t]);

  const handleSearchMyName = useCallback(() => {
    if (userName) {
      setSearchByMembership(false);
      setSearchQuery(userName);
      setPage(1);
    }
  }, [userName, setSearchQuery]);

  const handlePending = useCallback(async (item: CollectionItem) => {
    try {
      const docRef = doc(db, 'GYM', item.id);
      await updateDoc(docRef, { payment: 'Pending' }); // Update payment to Pending
      setSearchResults((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, payment: 'Pending' } : i))
      );
      toast.success(`${item.firstName} ${item.lastName} marked as Pending`);
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error(t.errorMessage || 'Failed to update payment');
    }
  }, [t]);

  const handleSetPayment = useCallback(async (item: CollectionItem, newPayment: string) => {
    try {
      const docRef = doc(db, 'GYM', item.id);
      const updateData: { payment: string; paymentStartDate?: string | null } = {
        payment: newPayment,
      };

      // Only update paymentStartDate if it doesn't exist or if the payment status changes
      if (!item.paymentStartDate || item.payment !== newPayment) {
        updateData.paymentStartDate = newPayment === 'Payed' ? new Date().toISOString() : null;
      }

      await updateDoc(docRef, updateData);
      setSearchResults((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                payment: newPayment,
                paymentStartDate: updateData.paymentStartDate !== undefined ? updateData.paymentStartDate : i.paymentStartDate,
              } as CollectionItem
            : i
        )
      );
      toast.success(`${item.firstName} ${item.lastName} payment updated to ${newPayment}`);
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error(t.errorMessage || 'Failed to update payment');
    }
  }, [t]);

  const handleDetail = useCallback((item: CollectionItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (item: CollectionItem) => {
    if (window.confirm(t.confirmDelete?.replace('{name}', `${item.firstName} ${item.lastName}`) || `Are you sure you want to delete ${item.firstName} ${item.lastName}?`)) {
      try {
        const docRef = doc(db, 'GYM', item.id);
        await deleteDoc(docRef);
        setSearchResults((prev) => prev.filter((i) => i.id !== item.id));
        toast.success(`${item.firstName} ${item.lastName} deleted successfully`);
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error(t.errorMessage || 'Failed to delete member');
      }
    }
  }, [t]);

  const handleImageClick = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  }, []);

  const handlePreviousPage = useCallback(() => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  }, [page]);

  const handleNextPage = useCallback(() => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore]);

  useEffect(() => {
    fetchData(searchQuery, selectedCategory, page);
  }, [searchQuery, selectedCategory, page, fetchData]);

  return (
    <div className={`relative w-full max-w-5xl mb-10 mx-auto transition-all duration-300 group`}>
      <div className="flex gap-4 items-center">
        {/* Category Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label={t.selectCategory || 'Select category'}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-md border ${
              theme === 'light'
                ? 'bg-white border-gray-200 text-gray-900'
                : 'bg-gray-800 border-gray-600 text-white'
            } focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200`}
          >
            {t.selectCategory && selectedCategory === 'All' ? t.selectCategory : selectedCategory}
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
                    setPage(1);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    theme === 'light' ? 'hover:bg-blue-100 text-gray-700' : 'hover:bg-gray-700 text-gray-300'
                  } transition-colors duration-200`}
                  aria-label={`Select ${category}`}
                >
                  {t.selectCategory && category === 'All' ? t.selectCategory : category}
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
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder={
                t.searchPlaceholder?.replace('{category}', selectedCategory.toLowerCase())?.replace('{type}', searchByMembership ? t.membershipType?.toLowerCase() || 'membership type' : t.firstName?.toLowerCase() || 'name') ||
                `Search ${selectedCategory.toLowerCase()} by ${searchByMembership ? 'membership type' : 'name'}...`
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className={`w-full px-4 py-3 bg-transparent rounded-lg focus:outline-none placeholder:${
                theme === 'light' ? 'text-gray-500' : 'text-gray-400'
              } text-sm font-medium transition-all duration-200`}
              aria-label={t.searchPlaceholder || 'Search input'}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className={`mr-4 p-1 rounded-full ${theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-yellow-400 hover:text-yellow-300'}`}
                aria-label={t.close || 'Clear search'}
              >
                <XCircle size={18} />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setSearchByMembership(!searchByMembership);
              setPage(1);
            }}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              theme === 'light'
                ? searchByMembership
                  ? 'bg-blue-200 text-blue-700 hover:bg-blue-300'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : searchByMembership
                ? 'bg-gray-600 text-white hover:bg-gray-500'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            } transition-colors duration-200`}
            aria-label={searchByMembership ? t.searchByMembership || 'Search by membership' : t.searchByName || 'Search by name'}
          >
            {searchByMembership ? t.searchByMembership || 'Membership' : t.searchByName || 'Name'}
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
          aria-label={t.searchMyName || 'Search my name'}
        >
          {t.searchMyName || 'Search My Name'}
        </button>
      )}

      {/* Search Results Table */}
      {searchQuery && (
        <div className="mt-6 w-full">
          {loading ? (
            <p className={`text-center text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
              {t.loading || 'Loading...'}
            </p>
          ) : searchResults.length > 0 ? (
            <div className="w-full">
              <p className={`text-sm mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                {t.searchResultsCount?.replace('{count}', `${searchResults.length}`) || `${searchResults.length} results found`}
              </p>
              <div className="overflow-x-auto">
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
                        {t.photo || 'Photo'}
                      </th>
                      <th
                        scope="col"
                        className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                        } uppercase tracking-wider`}
                      >
                        {t.firstName || 'First Name'}
                      </th>
                      <th
                        scope="col"
                        className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                        } uppercase tracking-wider`}
                      >
                        {t.lastName || 'Last Name'}
                      </th>
                      <th
                        scope="col"
                        className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                        } uppercase tracking-wider`}
                      >
                        {t.membershipType || 'Membership Type'}
                      </th>
                      <th
                        scope="col"
                        className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                        } uppercase tracking-wider`}
                      >
                        {t.category || 'Category'}
                      </th>
                      <th
                        scope="col"
                        className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                        } uppercase tracking-wider`}
                      >
                        {t.email || 'Email'}
                      </th>
                      <th
                        scope="col"
                        className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                        } uppercase tracking-wider`}
                      >
                        {t.paymentStatus || 'Payment'}
                      </th>
                      <th
                        scope="col"
                        className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                        } uppercase tracking-wider`}
                      >
                        {t.daysStatus || 'Days Status'}
                      </th>
                      <th
                        scope="col"
                        className={`w-[15%] px-4 py-3 text-left text-xs font-medium ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                        } uppercase tracking-wider`}
                      >
                        {t.actions || 'Actions'}
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
                              aria-label={`View ${item.firstName} ${item.lastName}'s profile photo`}
                            >
                              <img
                                src={item.photoURL}
                                alt={`${item.firstName} ${item.lastName}`}
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
                          } truncate max-w-[15%]`}
                        >
                          <select
                            value={item.payment || 'Not Payed'}
                            onChange={(e) => handleSetPayment(item, e.target.value)}
                            className={`px-3 py-1 rounded-lg text-sm ${
                              theme === 'light'
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
                            } transition-colors duration-200`}
                          >
                            <option value="Payed">{t.payed || 'Payed'}</option>
                            <option value="Not Payed">{t.notPayed || 'Not Payed'}</option>
                          </select>
                        </td>
                        <td
                          className={`px-4 py-4 text-sm ${
                            theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                          } truncate max-w-[15%]`}
                        >
                          <span className="inline-block animate-pulse">
                            {calculateDaysDisplay(item.payment || 'Not Payed', item.paymentStartDate)}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-4 text-sm ${
                            theme === 'light' ? 'text-gray-900' : 'text-gray-300'
                          } max-w-[15%]`}
                        >
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDetail(item)}
                              className={`px-2 py-1 rounded text-xs ${
                                theme === 'light'
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-blue-700 text-white hover:bg-blue-600'
                              } transition-colors duration-200`}
                              aria-label={`View details for ${item.firstName} ${item.lastName}`}
                            >
                              {t.detail || 'Detail'}
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className={`px-2 py-1 rounded text-xs ${
                                theme === 'light'
                                  ? 'bg-red-500 text-white hover:bg-red-600'
                                  : 'bg-red-600 text-white hover:bg-red-700'
                              } transition-colors duration-200`}
                              aria-label={`Delete ${item.firstName} ${item.lastName}`}
                            >
                              {t.delete || 'Delete'}
                            </button>
                            <button
                              onClick={() => handlePending(item)}
                              className={`px-2 py-1 rounded text-xs ${
                                theme === 'light'
                                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
                              } transition-colors duration-200`}
                              aria-label={`Mark ${item.firstName} ${item.lastName} as pending`}
                            >
                              {t.pending || 'Pending'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination Controls */}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={handlePreviousPage}
                    disabled={page === 1}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      theme === 'light'
                        ? page === 1
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                        : page === 1
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    } transition-colors duration-200`}
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                  <span className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                    Page {page}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={!hasMore}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      theme === 'light'
                        ? !hasMore
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                        : !hasMore
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    } transition-colors duration-200`}
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className={`text-center text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'}`}>
              {t.noResults || 'No results found'}
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
                {t.memberDetails || 'Member Details'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                } transition-colors duration-200 flex items-center gap-2`}
                aria-label={t.close || 'Close modal'}
              >
                {t.close || 'Close'}
                <X size={20} className={theme === 'light' ? 'text-white' : 'text-white'} />
              </button>
            </div>

            {/* Photo in Modal */}
            <div className="flex justify-center mb-4">
              {selectedItem.photoURL ? (
                <button
                  onClick={() => handleImageClick(selectedItem.photoURL!)}
                  className="focus:outline-none"
                  aria-label={`View ${selectedItem.firstName} ${selectedItem.lastName}'s profile photo`}
                >
                  <img
                    src={selectedItem.photoURL}
                    alt={`${selectedItem.firstName} ${selectedItem.lastName}`}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md cursor-pointer hover:opacity-80 transition-opacity duration-200"
                  />
                </button>
              ) : (
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center border-4 border-white shadow-md ${
                    theme === 'light' ? 'bg-gray-200 text-gray-600' : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  <span className="text-2xl">
                    {selectedItem.firstName ? selectedItem.firstName.charAt(0) : ''}
                    {selectedItem.lastName ? selectedItem.lastName.charAt(0) : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p>
                <strong className={theme === 'light' ? 'text-zinc-800' : 'text-white'}>
                  {t.firstName || 'First Name'}:
                </strong>{' '}
                {selectedItem.firstName || 'N/A'}
              </p>
              <p>
                <strong className={theme === 'light' ? 'text-zinc-800' : 'text-white'}>
                  {t.lastName || 'Last Name'}:
                </strong>{' '}
                {selectedItem.lastName || 'N/A'}
              </p>
              <p>
                <strong className={theme === 'light' ? 'text-zinc-800' : 'text-white'}>
                  {t.membershipType || 'Membership Type'}:
                </strong>{' '}
                {selectedItem.membershipType || 'N/A'}
              </p>
              <p>
                <strong className={theme === 'light' ? 'text-zinc-800' : 'text-white'}>
                  {t.category || 'Category'}:
                </strong>{' '}
                {selectedItem.category || 'N/A'}
              </p>
              <p>
                <strong className={theme === 'light' ? 'text-zinc-800' : 'text-white'}>
                  {t.email || 'Email'}:
                </strong>{' '}
                {selectedItem.email || 'N/A'}
              </p>
              <p>
                <strong className={theme === 'light' ? 'text-zinc-800' : 'text-white'}>
                  {t.phoneNumber || 'Phone Number'}:
                </strong>{' '}
                {selectedItem.phoneNumber || 'N/A'}
              </p>
              <p>
                <strong className={theme === 'light' ? 'text-zinc-800' : 'text-white'}>
                  {t.paymentStatus || 'Payment'}:
                </strong>{' '}
                {selectedItem.payment || 'N/A'}
              </p>
              <p>
                <strong className={theme === 'light' ? 'text-zinc-800' : 'text-white'}>
                  {t.daysStatus || 'Days Status'}:
                </strong>{' '}
                {calculateDaysDisplay(selectedItem.payment || 'Not Payed', selectedItem.paymentStartDate)}
              </p>
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
              aria-label={t.close || 'Close image modal'}
            >
              <X size={30} />
            </button>
            <div className="flex justify-center items-center h-full">
              <img
                src={selectedImage}
                alt={t.enlargedProfile || 'Enlarged profile'}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}