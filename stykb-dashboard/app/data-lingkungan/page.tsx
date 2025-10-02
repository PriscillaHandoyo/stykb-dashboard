"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

interface LingkunganData {
  _id: string;
  namaLingkungan: string;
  namaKetua: string;
  jumlahTatib: number;
  availability: {
    sabtu1700: boolean;
    minggu0800: boolean;
    minggu1100: boolean;
    minggu1700: boolean;
    minggu0730: boolean;
    minggu1030: boolean;
  };
}

export default function DataLingkunganPage() {
  const router = useRouter();
  const [lingkunganData, setLingkunganData] = useState<LingkunganData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    router.push("/");
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/lingkungan");
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();
      setLingkunganData(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please check your MongoDB connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = lingkunganData.filter(
    (item) =>
      (item.namaLingkungan?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (item.namaKetua?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const handleEdit = (id: string) => {
    // TODO: Implement edit functionality
    console.log("Edit item:", id);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this lingkungan?")) {
      try {
        const response = await fetch(`/api/lingkungan?id=${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchData(); // Refresh data
        } else {
          alert("Failed to delete item");
        }
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Error deleting item");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Sidebar activeMenu="Data Lingkungan" onLogout={handleLogout} />
        <div className="ml-64 p-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-gray-600">Loading data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar activeMenu="Data Lingkungan" onLogout={handleLogout} />

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Data Lingkungan
          </h1>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Cari Lingkungan (nama)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            />
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Actions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Ketua
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Jumlah Tatib
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Yakobus
                    <br />
                    Sabtu 17.00
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Yakobus
                    <br />
                    Minggu 08.00
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Yakobus
                    <br />
                    Minggu 11.00
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Yakobus
                    <br />
                    Minggu 17.00
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    P2
                    <br />
                    Minggu 07.30
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    P2
                    <br />
                    Minggu 10.30
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(item._id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.namaLingkungan || "N/A"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.namaKetua || "N/A"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {item.jumlahTatib || 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {item.availability?.sabtu1700 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-400 rounded-full text-xs">
                          ×
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {item.availability?.minggu0800 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-400 rounded-full text-xs">
                          ×
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {item.availability?.minggu1100 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-400 rounded-full text-xs">
                          ×
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {item.availability?.minggu1700 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-400 rounded-full text-xs">
                          ×
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {item.availability?.minggu0730 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-400 rounded-full text-xs">
                          ×
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {item.availability?.minggu1030 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-400 rounded-full text-xs">
                          ×
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredData.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "No matching data found." : "No data available."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
