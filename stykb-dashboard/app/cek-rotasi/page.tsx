"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface RotationStat {
  count: number;
  wilayah: string;
  tatib: number;
  lastAssigned: string;
}

export default function CekRotasi() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rotationStats, setRotationStats] = useState<{
    [lingkungan: string]: RotationStat;
  }>({});
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Simple password check (in production, use proper authentication)
  const ADMIN_PASSWORD = "admin123"; // Change this to a secure password

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError("");
      loadRotationStats();
    } else {
      setError("Password salah!");
      setPassword("");
    }
  };

  const loadRotationStats = async () => {
    setLoading(true);
    try {
      // First, load all lingkungan
      const lingkunganResponse = await fetch("/api/lingkungan");
      const lingkunganData = await lingkunganResponse.json();

      const stats: { [lingkungan: string]: RotationStat } = {};

      // Initialize all lingkungan
      lingkunganData.forEach((ling: any) => {
        stats[ling.namaLingkungan] = {
          count: 0,
          wilayah: ling.wilayah?.nama_wilayah || "N/A",
          tatib: parseInt(ling.jumlahTatib) || 0,
          lastAssigned: "-",
        };
      });

      // Count assignments from last 12 months
      for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
        let checkYear = selectedYear;
        let checkMonth = selectedMonth - monthOffset;

        while (checkMonth < 0) {
          checkMonth += 12;
          checkYear -= 1;
        }

        try {
          const response = await fetch(
            `/api/kalendar-assignments?tahun=${checkYear}&bulan=${checkMonth}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data)) {
              data.forEach((assignment: any) => {
                if (
                  assignment.assigned_lingkungan &&
                  Array.isArray(assignment.assigned_lingkungan)
                ) {
                  assignment.assigned_lingkungan.forEach((ling: any) => {
                    if (stats[ling.name]) {
                      stats[ling.name].count++;
                      // Update last assigned date
                      if (
                        monthOffset === 0 ||
                        stats[ling.name].lastAssigned === "-"
                      ) {
                        stats[ling.name].lastAssigned = assignment.tanggal;
                      }
                    }
                  });
                }
              });
            }
          }
        } catch (error) {
          console.error(
            `Error loading stats for ${checkYear}-${checkMonth}:`,
            error
          );
        }
      }

      setRotationStats(stats);
    } catch (error) {
      console.error("Error loading rotation stats:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadRotationStats();
    }
  }, [isAuthenticated, selectedYear, selectedMonth]);

  // Sort by count (ascending - least assigned first)
  const sortedLingkungan = Object.entries(rotationStats).sort(
    ([, a], [, b]) => a.count - b.count
  );

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const years = Array.from({ length: 10 }, (_, i) => 2024 + i);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Cek Rotasi Lingkungan
            </h1>
            <p className="text-gray-600">
              Masukkan password untuk mengakses halaman ini
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                placeholder="admin123"
                autoFocus
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Masuk
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/kalendar-penugasan"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              ← Kembali ke Kalendar Penugasan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cek Rotasi Lingkungan
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Monitoring penugasan lingkungan dalam 6 bulan terakhir
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/kalendar-penugasan"
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ← Kembali
              </Link>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Periode Perhitungan (12 bulan mundur dari)
                </label>
                <div className="flex gap-3">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                  >
                    {months.map((month, index) => (
                      <option key={index} value={index}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={loadRotationStats}
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? "Loading..." : "🔄 Refresh"}
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Lingkungan</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {sortedLingkungan.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Belum Pernah Ditugaskan
                  </p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {sortedLingkungan.filter(([, s]) => s.count === 0).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Jarang Ditugaskan (≤2x)
                  </p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {
                      sortedLingkungan.filter(
                        ([, s]) => s.count > 0 && s.count <= 2
                      ).length
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading rotation data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        No
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Lingkungan
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Wilayah
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Jumlah Tatib
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Penugasan (6 bulan)
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Terakhir Ditugaskan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedLingkungan.map(([lingkungan, stats], index) => (
                      <tr
                        key={lingkungan}
                        className={`hover:bg-gray-50 transition-colors ${
                          stats.count === 0 ? "bg-red-50" : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {lingkungan}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {stats.wilayah}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {stats.tatib}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              stats.count === 0
                                ? "bg-red-100 text-red-800"
                                : stats.count <= 2
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {stats.count}x
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {stats.lastAssigned}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Legend */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Keterangan:
              </h3>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-red-100 rounded-full"></span>
                  <span className="text-gray-600">
                    Belum pernah ditugaskan (6 bulan terakhir)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-yellow-100 rounded-full"></span>
                  <span className="text-gray-600">Jarang ditugaskan (≤2x)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-green-100 rounded-full"></span>
                  <span className="text-gray-600">
                    Sudah ditugaskan secara teratur (&gt;2x)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
