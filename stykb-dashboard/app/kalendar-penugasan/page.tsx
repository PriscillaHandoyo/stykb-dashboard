"use client";

import React, { useState, useEffect } from "react";

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

interface AssignedLingkungan {
  name: string;
  tatib: number;
}

interface Assignment {
  date: string;
  day: string;
  church: string;
  time: string;
  assignedLingkungan: AssignedLingkungan[];
  totalTatib: number;
  needsMore: boolean;
}

export default function KalendarPenugasanPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [lingkunganData, setLingkunganData] = useState<LingkunganData[]>([]);
  const [loading, setLoading] = useState(true);

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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    loadLingkunganData();
  }, []);

  useEffect(() => {
    if (lingkunganData.length > 0) {
      generateAssignments();
    }
  }, [selectedYear, selectedMonth, lingkunganData]);

  const loadLingkunganData = async () => {
    try {
      const response = await fetch("/api/lingkungan");
      const data = await response.json();
      setLingkunganData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading lingkungan data:", error);
      setLoading(false);
    }
  };

  const assignLingkunganToSlot = (
    church: string,
    day: string,
    time: string
  ): { assigned: AssignedLingkungan[]; total: number; needsMore: boolean } => {
    const MIN_TATIB = 20;
    const assigned: AssignedLingkungan[] = [];
    let totalTatib = 0;

    // Normalize church name for matching
    const normalizedChurch = church.includes("Yakobus")
      ? "St. Yakobus"
      : "Pegangsaan 2";

    // Filter lingkungan that are available for this slot
    const availableLingkungan = lingkunganData.filter((lingkungan) => {
      const availability = lingkungan.availability[normalizedChurch];
      if (!availability) return false;

      const daySchedule =
        day === "Minggu" ? availability.Minggu : availability.Sabtu;
      if (!daySchedule) return false;

      return daySchedule.includes(time);
    });

    // Sort by tatib count (highest first) for efficient assignment
    availableLingkungan.sort((a, b) => {
      const tatibA = parseInt(a.jumlahTatib) || 0;
      const tatibB = parseInt(b.jumlahTatib) || 0;
      return tatibB - tatibA;
    });

    // Assign lingkungan until we reach minimum tatib
    for (const lingkungan of availableLingkungan) {
      const tatib = parseInt(lingkungan.jumlahTatib) || 0;
      assigned.push({
        name: lingkungan.namaLingkungan,
        tatib: tatib,
      });
      totalTatib += tatib;

      if (totalTatib >= MIN_TATIB) {
        break;
      }
    }

    return {
      assigned,
      total: totalTatib,
      needsMore: totalTatib < MIN_TATIB,
    };
  };

  const generateAssignments = () => {
    const assignments: Assignment[] = [];
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const dayOfWeek = date.getDay();

      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        const dayName = dayOfWeek === 0 ? "Minggu" : "Sabtu";
        const dateStr = date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        // St. Yakobus assignments
        if (dayOfWeek === 0) {
          // Sunday
          const slot0800 = assignLingkunganToSlot(
            "St. Yakobus",
            dayName,
            "08:00"
          );
          assignments.push({
            date: dateStr,
            day: dayName,
            church: "St. Yakobus",
            time: "08:00",
            assignedLingkungan: slot0800.assigned,
            totalTatib: slot0800.total,
            needsMore: slot0800.needsMore,
          });

          const slot1100 = assignLingkunganToSlot(
            "St. Yakobus",
            dayName,
            "11:00"
          );
          assignments.push({
            date: dateStr,
            day: dayName,
            church: "St. Yakobus",
            time: "11:00",
            assignedLingkungan: slot1100.assigned,
            totalTatib: slot1100.total,
            needsMore: slot1100.needsMore,
          });

          const slot1700 = assignLingkunganToSlot(
            "St. Yakobus",
            dayName,
            "17:00"
          );
          assignments.push({
            date: dateStr,
            day: dayName,
            church: "St. Yakobus",
            time: "17:00",
            assignedLingkungan: slot1700.assigned,
            totalTatib: slot1700.total,
            needsMore: slot1700.needsMore,
          });
        } else {
          // Saturday
          const slotSat = assignLingkunganToSlot(
            "St. Yakobus",
            dayName,
            "17:00"
          );
          assignments.push({
            date: dateStr,
            day: dayName,
            church: "St. Yakobus",
            time: "17:00",
            assignedLingkungan: slotSat.assigned,
            totalTatib: slotSat.total,
            needsMore: slotSat.needsMore,
          });
        }

        // Pegangsaan 2 assignments (Sunday only)
        if (dayOfWeek === 0) {
          const slotP0730 = assignLingkunganToSlot(
            "Pegangsaan 2",
            dayName,
            "07:30"
          );
          assignments.push({
            date: dateStr,
            day: dayName,
            church: "Pegangsaan 2",
            time: "07:30",
            assignedLingkungan: slotP0730.assigned,
            totalTatib: slotP0730.total,
            needsMore: slotP0730.needsMore,
          });

          const slotP1030 = assignLingkunganToSlot(
            "Pegangsaan 2",
            dayName,
            "10:30"
          );
          assignments.push({
            date: dateStr,
            day: dayName,
            church: "Pegangsaan 2",
            time: "10:30",
            assignedLingkungan: slotP1030.assigned,
            totalTatib: slotP1030.total,
            needsMore: slotP1030.needsMore,
          });
        }
      }
    }

    setAssignments(assignments);
  };

  const groupByDate = () => {
    const grouped: { [key: string]: Assignment[] } = {};
    assignments.forEach((assignment) => {
      if (!grouped[assignment.date]) {
        grouped[assignment.date] = [];
      }
      grouped[assignment.date].push(assignment);
    });
    return grouped;
  };

  const groupedAssignments = groupByDate();

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
            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" />
            </svg>
            Data Lingkungan
          </a>
          <a
            href="/kalendar-penugasan"
            className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium"
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
                Kalendar Penugasan
              </h1>
              <p className="text-sm text-gray-500">
                Jadwal penugasan lingkungan untuk misa
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
            {/* Year and Month Selection */}
            <div className="mb-6 flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tahun
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white min-w-[120px]"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bulan
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white min-w-[150px]"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ml-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  &nbsp;
                </label>
                <button
                  onClick={() => {
                    setSelectedYear(new Date().getFullYear());
                    setSelectedMonth(new Date().getMonth());
                  }}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Bulan Ini
                </button>
              </div>
            </div>

            {/* Calendar Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Tanggal
                    </th>
                    <th className="border border-gray-200 py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Hari
                    </th>
                    <th className="border border-gray-200 py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Gereja
                    </th>
                    <th className="border border-gray-200 py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Waktu
                    </th>
                    <th className="border border-gray-200 py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Lingkungan
                    </th>
                    <th className="border border-gray-200 py-3 px-4 text-left text-sm font-semibold text-gray-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(groupedAssignments).length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="border border-gray-200 py-8 text-center text-gray-500"
                      >
                        Tidak ada jadwal untuk bulan ini
                      </td>
                    </tr>
                  ) : (
                    Object.entries(groupedAssignments).map(
                      ([date, items], dateIndex) => (
                        <React.Fragment key={`date-${dateIndex}-${date}`}>
                          {items.map((assignment, index) => (
                            <tr
                              key={`${date}-${assignment.church}-${assignment.time}`}
                              className="hover:bg-gray-50"
                            >
                              {index === 0 && (
                                <>
                                  <td
                                    className="border border-gray-200 py-3 px-4 text-sm text-gray-900 font-medium"
                                    rowSpan={items.length}
                                  >
                                    {assignment.date}
                                  </td>
                                  <td
                                    className="border border-gray-200 py-3 px-4 text-sm text-gray-900"
                                    rowSpan={items.length}
                                  >
                                    <span
                                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                        assignment.day === "Minggu"
                                          ? "bg-blue-100 text-blue-700"
                                          : "bg-purple-100 text-purple-700"
                                      }`}
                                    >
                                      {assignment.day}
                                    </span>
                                  </td>
                                </>
                              )}
                              <td className="border border-gray-200 py-3 px-4 text-sm text-gray-900">
                                {assignment.church}
                              </td>
                              <td className="border border-gray-200 py-3 px-4 text-sm text-gray-900">
                                {assignment.time}
                              </td>
                              <td className="border border-gray-200 py-3 px-4 text-sm">
                                {assignment.assignedLingkungan.length === 0 ? (
                                  <span className="text-gray-400">
                                    Belum ada assignment
                                  </span>
                                ) : (
                                  <div className="space-y-1">
                                    {assignment.assignedLingkungan.map(
                                      (ling, idx) => (
                                        <div
                                          key={idx}
                                          className="text-gray-900"
                                        >
                                          {ling.name}
                                          <span className="text-xs text-gray-500 ml-2">
                                            ({ling.tatib} tatib)
                                          </span>
                                        </div>
                                      )
                                    )}
                                    <div className="mt-2 pt-1 border-t border-gray-200">
                                      <span
                                        className={`text-xs font-medium ${
                                          assignment.needsMore
                                            ? "text-red-600"
                                            : "text-green-600"
                                        }`}
                                      >
                                        Total: {assignment.totalTatib} tatib
                                        {assignment.needsMore &&
                                          " (Kurang dari 20)"}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="border border-gray-200 py-3 px-4 text-sm">
                                {assignment.needsMore ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                                    <svg
                                      className="w-4 h-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    Butuh Lebih
                                  </span>
                                ) : assignment.assignedLingkungan.length > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                    <svg
                                      className="w-4 h-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    Cukup
                                  </span>
                                ) : (
                                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                                    Assign
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
