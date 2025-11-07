"use client";

import { useState, useEffect } from "react";

interface LingkunganData {
  id: number;
  namaLingkungan: string;
  namaKetua: string;
  nomorTelepon: string;
  jumlahTatib: string;
  availability: {
    [church: string]: {
      [day: string]: string[];
    };
  };
}

export default function DataLingkunganPage() {
  const [data, setData] = useState<LingkunganData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    fetch("/api/lingkungan")
      .then((response) => response.json())
      .then((jsonData) => {
        setData(jsonData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading data:", error);
        setLoading(false);
      });
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
        } else {
          alert("Gagal menghapus data");
        }
      } catch (error) {
        console.error("Error deleting data:", error);
        alert("Terjadi kesalahan saat menghapus data");
      }
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
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200">
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
          <h2 className="text-xl font-bold text-gray-900">Parish Hub</h2>
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-1">
          <a
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
            Dashboard
          </a>
          <a
            href="/form-lingkungan"
            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
            Form Lingkungan
          </a>
          <a
            href="/data-lingkungan"
            className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" />
            </svg>
            Data Lingkungan
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
            </svg>
            Kalendar Penugasan
          </a>
          <a
            href="#"
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
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Misa Lainnya
          </a>
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
      <main className="ml-56">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Data Lingkungan
              </h1>
              <p className="text-sm text-gray-500">
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Welcome back, Admin!
                </span>
                <button className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
                  Logout
                </button>
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
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                          Nama Lingkungan
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                          Ketua Lingkungan
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                          No. Telepon
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                          Jumlah Tatib
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                          Availability
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-4 px-4 text-sm text-gray-900">
                            {item.namaLingkungan}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-700">
                            {item.namaKetua}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-700">
                            {item.nomorTelepon}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-700">
                            {item.jumlahTatib}
                          </td>
                          <td className="py-4 px-4">
                            {renderAvailability(item.availability)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                                Detail
                              </button>
                              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
    </div>
  );
}
