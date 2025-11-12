"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Toast from "../components/Toast";

interface LingkunganData {
  id: number;
  namaLingkungan: string;
  namaKetua: string;
  nomorTelepon: string;
  jumlahTatib: string;
  wilayahId?: number;
  wilayah?: {
    id: number;
    nama_wilayah: string;
  };
  availability: {
    [church: string]: {
      [day: string]: string[];
    };
  };
}

export default function DataLingkunganPage() {
  const [data, setData] = useState<LingkunganData[]>([]);
  const [filteredData, setFilteredData] = useState<LingkunganData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LingkunganData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<LingkunganData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChurch, setFilterChurch] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, searchQuery, filterChurch, sortBy]);

  const loadData = () => {
    setLoading(true);
    fetch("/api/lingkungan")
      .then((response) => response.json())
      .then((jsonData) => {
        setData(jsonData);
        setFilteredData(jsonData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading data:", error);
        setLoading(false);
      });
  };

  const applyFilters = () => {
    let filtered = [...data];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.namaLingkungan
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.namaKetua.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.nomorTelepon.includes(searchQuery)
      );
    }

    // Apply church filter
    if (filterChurch !== "all") {
      filtered = filtered.filter((item) => {
        const churches = Object.keys(item.availability);
        return churches.some((church) =>
          church.toLowerCase().includes(filterChurch.toLowerCase())
        );
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "name-asc":
        filtered.sort((a, b) =>
          a.namaLingkungan.localeCompare(b.namaLingkungan)
        );
        break;
      case "name-desc":
        filtered.sort((a, b) =>
          b.namaLingkungan.localeCompare(a.namaLingkungan)
        );
        break;
      case "tatib-asc":
        filtered.sort((a, b) => {
          const numA = parseInt(a.jumlahTatib) || 0;
          const numB = parseInt(b.jumlahTatib) || 0;
          return numA - numB;
        });
        break;
      case "tatib-desc":
        filtered.sort((a, b) => {
          const numA = parseInt(a.jumlahTatib) || 0;
          const numB = parseInt(b.jumlahTatib) || 0;
          return numB - numA;
        });
        break;
      case "ketua-asc":
        filtered.sort((a, b) => a.namaKetua.localeCompare(b.namaKetua));
        break;
      case "ketua-desc":
        filtered.sort((a, b) => b.namaKetua.localeCompare(a.namaKetua));
        break;
      default:
        // Keep original order
        break;
    }

    setFilteredData(filtered);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      try {
        const response = await fetch("/api/lingkungan", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });

        if (response.ok) {
          // Reload data after successful deletion
          loadData();
          setToast({ message: "Data berhasil dihapus!", type: "success" });
        } else {
          setToast({ message: "Gagal menghapus data", type: "error" });
        }
      } catch (error) {
        console.error("Error deleting data:", error);
        setToast({
          message: "Terjadi kesalahan saat menghapus data",
          type: "error",
        });
      }
    }
  };

  const handleDetail = (item: LingkunganData) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleEdit = (item: LingkunganData) => {
    setEditFormData(item);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editFormData) return;

    try {
      // For now, we'll use a PUT endpoint. You'll need to add this to your API
      const response = await fetch("/api/lingkungan", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        loadData();
        setShowEditModal(false);
        setEditFormData(null);
        setToast({ message: "Data berhasil diupdate!", type: "success" });
      } else {
        setToast({ message: "Gagal mengupdate data", type: "error" });
      }
    } catch (error) {
      console.error("Error updating data:", error);
      setToast({
        message: "Terjadi kesalahan saat mengupdate data",
        type: "error",
      });
    }
  };

  const renderAvailability = (availability: LingkunganData["availability"]) => {
    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(availability).map(([church, days]) => (
          <div key={church}>
            <div className="text-xs font-semibold text-blue-700 mb-1">
              {church === "St. Yakobus" ? "St. Yakobus" : "Pegangsaan 2"}
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(days).map(([day, times]) =>
                times.map((time) => (
                  <span
                    key={`${day}-${time}`}
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      day === "Minggu"
                        ? church === "St. Yakobus"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {day === "Minggu" ? "Min" : "Sab"} {time}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 lg:w-56 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-40 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">St. Yakobus</h2>
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-1">
          <Link
            href="/dashboard"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
            Dashboard
          </Link>
          <Link
            href="/form-lingkungan"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
            Form Lingkungan
          </Link>
          <Link
            href="/data-lingkungan"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" />
            </svg>
            Data Lingkungan
          </Link>
          <Link
            href="/kalendar-penugasan"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
            </svg>
            Kalendar Penugasan
          </Link>
          <Link
            href="/paskah"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Paskah
          </Link>
          <Link
            href="/misa-lainnya"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Misa Lainnya
          </Link>
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white font-semibold">
              N
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Admin</div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-56 min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="ml-12 lg:ml-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Data Lingkungan
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Daftar dan informasi lingkungan dalam paroki
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                </svg>
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-700">
                  Welcome back, Admin!
                </span>
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  Logout
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Data Lingkungan
            </h2>
            <p className="text-gray-600 mb-6">
              Kelola dan lihat data lingkungan dalam paroki
            </p>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading data...</p>
              </div>
            ) : (
              <>
                {/* Search and Filter Section */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                  {/* Search Bar */}
                  <div className="flex-1">
                    <div className="relative">
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <input
                        type="text"
                        placeholder="Cari nama lingkungan, ketua, atau nomor telepon..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Filter by Church */}
                  <div className="sm:w-64">
                    <select
                      value={filterChurch}
                      onChange={(e) => setFilterChurch(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
                    >
                      <option value="all">Semua Gereja</option>
                      <option value="yakobus">St. Yakobus</option>
                      <option value="pegangsaan">Pegangsaan 2</option>
                    </select>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="sm:w-64">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
                    >
                      <option value="default">Urutkan</option>
                      <option value="name-asc">Nama A-Z</option>
                      <option value="name-desc">Nama Z-A</option>
                      <option value="ketua-asc">Ketua A-Z</option>
                      <option value="ketua-desc">Ketua Z-A</option>
                      <option value="tatib-asc">Tatib Terendah</option>
                      <option value="tatib-desc">Tatib Tertinggi</option>
                    </select>
                  </div>

                  {/* Clear Filters Button */}
                  {(searchQuery ||
                    filterChurch !== "all" ||
                    sortBy !== "default") && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setFilterChurch("all");
                        setSortBy("default");
                      }}
                      className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Results Count */}
                <div className="mb-4 text-sm text-gray-600">
                  Menampilkan {filteredData.length} dari {data.length}{" "}
                  lingkungan
                </div>

                {/* Table */}
                <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-0">
                  <div className="inline-block min-w-full align-middle px-4 sm:px-6 lg:px-0">
                    <table className="min-w-full w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-gray-600 uppercase">
                            Nama Lingkungan
                          </th>
                          <th className="hidden sm:table-cell text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                            Wilayah
                          </th>
                          <th className="hidden md:table-cell text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                            Ketua Lingkungan
                          </th>
                          <th className="hidden lg:table-cell text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                            No. Telepon
                          </th>
                          <th className="hidden lg:table-cell text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                            Jumlah Tatib
                          </th>
                          <th className="hidden lg:table-cell text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                            Availability
                          </th>
                          <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-gray-600 uppercase">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="py-8 text-center text-gray-500"
                            >
                              Tidak ada data yang sesuai dengan pencarian
                            </td>
                          </tr>
                        ) : (
                          filteredData.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-4 px-2 sm:px-4 text-sm text-gray-900">
                                {item.namaLingkungan}
                              </td>
                              <td className="hidden sm:table-cell py-4 px-4 text-sm text-gray-700">
                                {item.wilayah ? (
                                  <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                    {item.wilayah.nama_wilayah}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">
                                    Tidak ada
                                  </span>
                                )}
                              </td>
                              <td className="hidden md:table-cell py-4 px-4 text-sm text-gray-700">
                                {item.namaKetua}
                              </td>
                              <td className="hidden lg:table-cell py-4 px-4 text-sm text-gray-700">
                                {item.nomorTelepon}
                              </td>
                              <td className="hidden lg:table-cell py-4 px-4 text-sm text-gray-700">
                                {item.jumlahTatib}
                              </td>
                              <td className="hidden lg:table-cell py-4 px-4">
                                {renderAvailability(item.availability)}
                              </td>
                              <td className="py-4 px-2 sm:px-4">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <button
                                    onClick={() => handleDetail(item)}
                                    className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium"
                                  >
                                    Detail
                                  </button>
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add Button */}
                <div className="mt-6">
                  <a
                    href="/form-lingkungan"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Tambah Lingkungan Baru
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Detail Lingkungan
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Nama Lingkungan
                </label>
                <p className="text-gray-900 mt-1">
                  {selectedItem.namaLingkungan}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Wilayah
                </label>
                <p className="text-gray-900 mt-1">
                  {selectedItem.wilayah ? (
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                      {selectedItem.wilayah.nama_wilayah}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Tidak ada</span>
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Ketua Lingkungan
                </label>
                <p className="text-gray-900 mt-1">{selectedItem.namaKetua}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Nomor Telepon
                </label>
                <p className="text-gray-900 mt-1">
                  {selectedItem.nomorTelepon}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Jumlah Tatib
                </label>
                <p className="text-gray-900 mt-1">{selectedItem.jumlahTatib}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-2">
                  Availability
                </label>
                {renderAvailability(selectedItem.availability)}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Edit Lingkungan
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditFormData(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lingkungan
                </label>
                <input
                  type="text"
                  value={editFormData.namaLingkungan}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      namaLingkungan: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ketua Lingkungan
                </label>
                <input
                  type="text"
                  value={editFormData.namaKetua}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      namaKetua: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  value={editFormData.nomorTelepon}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      nomorTelepon: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Tatib
                </label>
                <input
                  type="text"
                  value={editFormData.jumlahTatib}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      jumlahTatib: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditFormData(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
