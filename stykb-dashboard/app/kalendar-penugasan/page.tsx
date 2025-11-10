"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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

interface PaskahData {
  schedules: {
    [key: string]: {
      date: string;
      churches: any[];
    };
  };
  assignments: {
    [key: string]: Array<{
      church: string;
      time: string;
      minTatib: number;
      assignedLingkungan: Array<{
        name: string;
        tatib: number;
      }>;
      totalTatib: number;
    }>;
  };
}

interface MisaLainnyaData {
  celebrations: Array<{
    name: string;
    date: string;
    churches: Array<{
      name: string;
      time: string;
      minTatib: number;
    }>;
    assignments: Array<{
      church: string;
      time: string;
      minTatib: number;
      assignedLingkungan: Array<{
        name: string;
        tatib: number;
      }>;
      totalTatib: number;
    }>;
  }>;
}

export default function KalendarPenugasanPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [lingkunganData, setLingkunganData] = useState<LingkunganData[]>([]);
  const [paskahDates, setPaskahDates] = useState<{ [date: string]: string }>(
    {}
  );
  const [paskahAssignedLingkungan, setPaskahAssignedLingkungan] = useState<
    Set<string>
  >(new Set());
  const [misaLainnyaDates, setMisaLainnyaDates] = useState<{
    [date: string]: string;
  }>({});
  const [misaLainnyaAssignedLingkungan, setMisaLainnyaAssignedLingkungan] =
    useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Min Tatib Configuration
  const [showMinTatibConfig, setShowMinTatibConfig] = useState(false);
  const [minTatibConfig, setMinTatibConfig] = useState<{
    [church: string]: { [time: string]: number };
  }>({
    "St. Yakobus": {
      "Sabtu 17:00": 20,
      "Minggu 08:00": 20,
      "Minggu 11:00": 20,
      "Minggu 17:00": 20,
    },
    "Pegangsaan 2": {
      "Minggu 07:30": 20,
      "Minggu 10:30": 20,
    },
  });

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
    loadPaskahData();
    loadMisaLainnyaData();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (lingkunganData.length > 0) {
      generateAssignments();
    }
  }, [
    selectedYear,
    selectedMonth,
    lingkunganData,
    paskahAssignedLingkungan,
    misaLainnyaAssignedLingkungan,
  ]);

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

  const loadPaskahData = async () => {
    try {
      const response = await fetch("/api/paskah");
      const data: PaskahData = await response.json();

      // Map to convert Paskah dates to a lookup object
      const holyDayNames: { [key: string]: string } = {
        rabuAbu: "Rabu Abu",
        mingguPalma: "Minggu Palma",
        kamisPutih: "Kamis Putih",
        jumatAgung: "Jumat Agung",
        sabtuSuci: "Sabtu Suci",
        mingguPaskah: "Minggu Paskah",
      };

      const dateMap: { [date: string]: string } = {};
      const assignedLingkunganSet = new Set<string>();

      if (data.schedules) {
        Object.keys(data.schedules).forEach((key) => {
          const schedule = data.schedules[key];
          if (schedule.date) {
            // Convert the date to dd/mm/yyyy format to match calendar format
            const dateObj = new Date(schedule.date);
            const formattedDate = dateObj.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
            dateMap[formattedDate] = holyDayNames[key] || key;

            // Check if this Paskah date is in the selected month/year
            const paskahMonth = dateObj.getMonth();
            const paskahYear = dateObj.getFullYear();

            if (paskahMonth === selectedMonth && paskahYear === selectedYear) {
              // Collect all assigned lingkungan from this Paskah celebration
              if (data.assignments && data.assignments[key]) {
                data.assignments[key].forEach((assignment) => {
                  assignment.assignedLingkungan.forEach((ling) => {
                    assignedLingkunganSet.add(ling.name);
                  });
                });
              }
            }
          }
        });
      }
      setPaskahDates(dateMap);
      setPaskahAssignedLingkungan(assignedLingkunganSet);
    } catch (error) {
      console.error("Error loading paskah data:", error);
    }
  };

  const loadMisaLainnyaData = async () => {
    try {
      const response = await fetch("/api/misa-lainnya");
      const data: MisaLainnyaData = await response.json();

      const dateMap: { [date: string]: string } = {};
      const assignedLingkunganSet = new Set<string>();

      // Handle multiple celebrations
      if (data.celebrations && data.celebrations.length > 0) {
        data.celebrations.forEach((celebration) => {
          if (celebration.date) {
            const dateObj = new Date(celebration.date);
            const formattedDate = dateObj.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
            dateMap[formattedDate] = celebration.name;

            // Check if this Misa Lainnya date is in the selected month/year
            const celebrationMonth = dateObj.getMonth();
            const celebrationYear = dateObj.getFullYear();

            if (
              celebrationMonth === selectedMonth &&
              celebrationYear === selectedYear
            ) {
              // Collect all assigned lingkungan from this celebration
              if (
                celebration.assignments &&
                celebration.assignments.length > 0
              ) {
                celebration.assignments.forEach((assignment) => {
                  assignment.assignedLingkungan.forEach((ling) => {
                    assignedLingkunganSet.add(ling.name);
                  });
                });
              }
            }
          }
        });
      }
      setMisaLainnyaDates(dateMap);
      setMisaLainnyaAssignedLingkungan(assignedLingkunganSet);
    } catch (error) {
      console.error("Error loading misa lainnya data:", error);
    }
  };

  const isPaskahDate = (dateStr: string): string | null => {
    return paskahDates[dateStr] || null;
  };

  const isMisaLainnyaDate = (dateStr: string): string | null => {
    return misaLainnyaDates[dateStr] || null;
  };

  // Seeded random number generator for consistent shuffling within a month
  const seededRandom = (seed: number) => {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  };

  // Shuffle array with a seed for consistent results per month
  const shuffleArray = <T,>(array: T[], seed: number): T[] => {
    const shuffled = [...array];
    const random = seededRandom(seed);

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  };

  const generateAssignments = () => {
    const assignments: Assignment[] = [];
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    // Create a unique seed for this month to ensure consistent but different shuffling per month
    const monthSeed = selectedYear * 12 + selectedMonth;

    // Filter out lingkungan that are already assigned in Paskah or Misa Lainnya celebrations this month
    const availableLingkungan = lingkunganData.filter(
      (ling) =>
        !paskahAssignedLingkungan.has(ling.namaLingkungan) &&
        !misaLainnyaAssignedLingkungan.has(ling.namaLingkungan)
    );

    // Shuffle available lingkungan for this month
    const shuffledLingkungan = shuffleArray(availableLingkungan, monthSeed);

    // Create a pool of lingkungan that haven't been assigned yet this month
    // This pool will be depleted as we assign lingkungan
    const unassignedPool = [...shuffledLingkungan];

    // Track assignments per week to avoid assigning same lingkungan in consecutive weeks
    const weeklyAssignments: { [weekNum: number]: Set<string> } = {};

    // Track assignments per day to avoid assigning same lingkungan multiple times on same date
    const dailyAssignments: { [dayNum: number]: Set<string> } = {};

    // Helper function to get week number of the month
    const getWeekOfMonth = (dayNum: number): number => {
      return Math.ceil(dayNum / 7);
    };

    // Helper function to get next available lingkungan for a slot
    const getNextLingkunganForSlot = (
      church: string,
      day: string,
      time: string,
      currentDay: number
    ): AssignedLingkungan[] => {
      // Get MIN_TATIB from configuration
      const normalizedChurch = church.includes("Yakobus")
        ? "St. Yakobus"
        : "Pegangsaan 2";
      const timeKey = `${day === "Minggu" ? "Minggu" : "Sabtu"} ${time}`;
      const MIN_TATIB = minTatibConfig[normalizedChurch]?.[timeKey] || 20;
      
      const assigned: AssignedLingkungan[] = [];
      let totalTatib = 0;

      const currentWeek = getWeekOfMonth(currentDay);
      const previousWeek = currentWeek - 1;

      // Get lingkungan assigned in previous week and on current day
      const previousWeekAssignments =
        weeklyAssignments[previousWeek] || new Set<string>();
      const todayAssignments =
        dailyAssignments[currentDay] || new Set<string>();

      // Try to assign from unassigned pool first, prioritizing those not in previous week
      for (let i = unassignedPool.length - 1; i >= 0; i--) {
        const lingkungan = unassignedPool[i];

        // Skip if already assigned today
        if (todayAssignments.has(lingkungan.namaLingkungan)) {
          continue;
        }

        // Check if this lingkungan is available for this slot
        const availability = lingkungan.availability[normalizedChurch];
        if (!availability) continue;

        const daySchedule =
          day === "Minggu" ? availability.Minggu : availability.Sabtu;
        if (!daySchedule || !daySchedule.includes(time)) continue;

        // Skip if this lingkungan was assigned in previous week (unless pool is running low)
        const isFromPreviousWeek = previousWeekAssignments.has(
          lingkungan.namaLingkungan
        );
        if (isFromPreviousWeek && unassignedPool.length > 5) {
          continue; // Skip and try to find someone from an earlier week
        }

        // This lingkungan is available, assign it
        const tatib = parseInt(lingkungan.jumlahTatib) || 0;
        assigned.push({
          name: lingkungan.namaLingkungan,
          tatib: tatib,
        });
        totalTatib += tatib;

        // Remove from unassigned pool
        unassignedPool.splice(i, 1);

        // Track this assignment for the current week and day
        if (!weeklyAssignments[currentWeek]) {
          weeklyAssignments[currentWeek] = new Set<string>();
        }
        weeklyAssignments[currentWeek].add(lingkungan.namaLingkungan);

        if (!dailyAssignments[currentDay]) {
          dailyAssignments[currentDay] = new Set<string>();
        }
        dailyAssignments[currentDay].add(lingkungan.namaLingkungan);

        // If we've reached minimum tatib, stop assigning for this slot
        if (totalTatib >= MIN_TATIB) {
          break;
        }
      }

      // If pool is empty and we still need more tatib, reuse lingkungan
      // BUT only those NOT assigned to Paskah, NOT assigned in previous week, and NOT assigned today
      if (
        totalTatib < MIN_TATIB &&
        unassignedPool.length === 0 &&
        paskahAssignedLingkungan.size > 0
      ) {
        // Get all lingkungan not assigned to Paskah, not in previous week, and not assigned today
        const reusableLingkungan = availableLingkungan.filter(
          (ling) =>
            !previousWeekAssignments.has(ling.namaLingkungan) &&
            !todayAssignments.has(ling.namaLingkungan)
        );

        for (const lingkungan of reusableLingkungan) {
          // Check if this lingkungan is available for this slot
          const availability = lingkungan.availability[normalizedChurch];
          if (!availability) continue;

          const daySchedule =
            day === "Minggu" ? availability.Minggu : availability.Sabtu;
          if (!daySchedule || !daySchedule.includes(time)) continue;

          // This lingkungan is available, assign it
          const tatib = parseInt(lingkungan.jumlahTatib) || 0;
          assigned.push({
            name: lingkungan.namaLingkungan,
            tatib: tatib,
          });
          totalTatib += tatib;

          // Track this assignment for the current week and day
          if (!weeklyAssignments[currentWeek]) {
            weeklyAssignments[currentWeek] = new Set<string>();
          }
          weeklyAssignments[currentWeek].add(lingkungan.namaLingkungan);

          if (!dailyAssignments[currentDay]) {
            dailyAssignments[currentDay] = new Set<string>();
          }
          dailyAssignments[currentDay].add(lingkungan.namaLingkungan);

          // If we've reached minimum tatib, stop assigning for this slot
          if (totalTatib >= MIN_TATIB) {
            break;
          }
        }
      }

      return assigned;
    };

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
          const assigned0800 = getNextLingkunganForSlot(
            "St. Yakobus",
            dayName,
            "08:00",
            day
          );
          const total0800 = assigned0800.reduce((sum, l) => sum + l.tatib, 0);
          assignments.push({
            date: dateStr,
            day: dayName,
            church: "St. Yakobus",
            time: "08:00",
            assignedLingkungan: assigned0800,
            totalTatib: total0800,
            needsMore: total0800 < 20,
          });

          const assigned1100 = getNextLingkunganForSlot(
            "St. Yakobus",
            dayName,
            "11:00",
            day
          );
          const total1100 = assigned1100.reduce((sum, l) => sum + l.tatib, 0);
          assignments.push({
            date: dateStr,
            day: dayName,
            church: "St. Yakobus",
            time: "11:00",
            assignedLingkungan: assigned1100,
            totalTatib: total1100,
            needsMore: total1100 < 20,
          });

          const assigned1700 = getNextLingkunganForSlot(
            "St. Yakobus",
            dayName,
            "17:00",
            day
          );
          const total1700 = assigned1700.reduce((sum, l) => sum + l.tatib, 0);
          assignments.push({
            date: dateStr,
            day: dayName,
            church: "St. Yakobus",
            time: "17:00",
            assignedLingkungan: assigned1700,
            totalTatib: total1700,
            needsMore: total1700 < 20,
          });
        } else {
          // Saturday
          const assignedSat = getNextLingkunganForSlot(
            "St. Yakobus",
            dayName,
            "17:00",
            day
          );
          const totalSat = assignedSat.reduce((sum, l) => sum + l.tatib, 0);
          assignments.push({
            date: dateStr,
            day: dayName,
            church: "St. Yakobus",
            time: "17:00",
            assignedLingkungan: assignedSat,
            totalTatib: totalSat,
            needsMore: totalSat < 20,
          });
        }

        // Pegangsaan 2 assignments (Sunday only)
        if (dayOfWeek === 0) {
          const assignedP0730 = getNextLingkunganForSlot(
            "Pegangsaan 2",
            dayName,
            "07:30",
            day
          );
          const totalP0730 = assignedP0730.reduce((sum, l) => sum + l.tatib, 0);
          assignments.push({
            date: dateStr,
            day: dayName,
            church: "Pegangsaan 2",
            time: "07:30",
            assignedLingkungan: assignedP0730,
            totalTatib: totalP0730,
            needsMore: totalP0730 < 20,
          });

          const assignedP1030 = getNextLingkunganForSlot(
            "Pegangsaan 2",
            dayName,
            "10:30",
            day
          );
          const totalP1030 = assignedP1030.reduce((sum, l) => sum + l.tatib, 0);
          assignments.push({
            date: dateStr,
            day: dayName,
            church: "Pegangsaan 2",
            time: "10:30",
            assignedLingkungan: assignedP1030,
            totalTatib: totalP1030,
            needsMore: totalP1030 < 20,
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
            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" />
            </svg>
            Data Lingkungan
          </Link>
          <Link
            href="/kalendar-penugasan"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium"
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
                Kalendar Penugasan
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
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
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
            {/* Year and Month Selection */}
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-full sm:w-auto">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Tahun
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base text-gray-900 bg-white min-w-[120px]"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-auto">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Bulan
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base text-gray-900 bg-white min-w-[150px]"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-auto sm:ml-auto flex flex-col sm:flex-row gap-2">
                <label className="hidden sm:block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  &nbsp;
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMinTatibConfig(true)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
                  >
                    Atur Min Tatib
                  </button>
                  <button
                    onClick={() => {
                      setSelectedYear(new Date().getFullYear());
                      setSelectedMonth(new Date().getMonth());
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Bulan Ini
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Table */}
            <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-6 lg:px-0">
                <table className="min-w-full w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Tanggal
                      </th>
                      <th className="hidden sm:table-cell border border-gray-200 py-3 px-4 text-left text-sm font-semibold text-gray-700">
                        Hari
                      </th>
                      <th className="border border-gray-200 py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Gereja
                      </th>
                      <th className="hidden md:table-cell border border-gray-200 py-3 px-4 text-left text-sm font-semibold text-gray-700">
                        Waktu
                      </th>
                      <th className="border border-gray-200 py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
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
                        ([date, items], dateIndex) => {
                          const paskahHolyDay = isPaskahDate(items[0].date);
                          const misaLainnyaName = isMisaLainnyaDate(
                            items[0].date
                          );

                          // If it's a Paskah date, show special row
                          if (paskahHolyDay) {
                            return (
                              <tr
                                key={`date-${dateIndex}-${date}`}
                                className="bg-yellow-50"
                              >
                                <td className="border border-gray-200 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900 font-medium">
                                  {items[0].date}
                                </td>
                                <td className="hidden sm:table-cell border border-gray-200 py-3 px-4 text-sm text-gray-900">
                                  <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                                    {items[0].day}
                                  </span>
                                </td>
                                <td
                                  colSpan={4}
                                  className="border border-gray-200 py-3 sm:py-4 px-2 sm:px-4 text-center"
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <svg
                                      className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-900">
                                      PERAYAAN PASKAH - {paskahHolyDay}
                                    </span>
                                    <a
                                      href="/paskah"
                                      className="text-sm text-blue-600 hover:text-blue-700 underline"
                                    >
                                      (Lihat halaman 'Paskah' untuk jadwal
                                      penugasan)
                                    </a>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          // If it's a Misa Lainnya date, show special row
                          if (misaLainnyaName) {
                            return (
                              <tr
                                key={`date-${dateIndex}-${date}`}
                                className="bg-green-50"
                              >
                                <td className="border border-gray-200 py-3 px-4 text-sm text-gray-900 font-medium">
                                  {items[0].date}
                                </td>
                                <td className="border border-gray-200 py-3 px-4 text-sm text-gray-900">
                                  <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                    {items[0].day}
                                  </span>
                                </td>
                                <td
                                  colSpan={4}
                                  className="border border-gray-200 py-4 px-4 text-center"
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <svg
                                      className="w-5 h-5 text-green-600"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-900">
                                      {misaLainnyaName}
                                    </span>
                                    <a
                                      href="/misa-lainnya"
                                      className="text-sm text-blue-600 hover:text-blue-700 underline"
                                    >
                                      (Lihat halaman 'Misa Lainnya' untuk jadwal
                                      penugasan)
                                    </a>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          // Normal rendering for non-Paskah dates
                          return (
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
                                    {assignment.assignedLingkungan.length ===
                                    0 ? (
                                      <div className="flex items-center gap-2">
                                        <svg
                                          className="w-4 h-4 text-orange-500"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        <span className="text-orange-600 font-medium text-sm">
                                          Lingkungan Kurang
                                        </span>
                                        {paskahAssignedLingkungan.size > 0 && (
                                          <span className="text-xs text-gray-500">
                                            (Beberapa lingkungan sudah bertugas
                                            di Paskah)
                                          </span>
                                        )}
                                      </div>
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
                                    ) : assignment.assignedLingkungan.length >
                                      0 ? (
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
                          );
                        }
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Min Tatib Configuration Modal */}
      {showMinTatibConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Atur Minimal Tatib per Misa
                </h2>
                <button
                  onClick={() => setShowMinTatibConfig(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
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
            </div>

            <div className="p-6 space-y-6">
              {/* St. Yakobus */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Gereja St. Yakobus
                </h3>
                <div className="space-y-3">
                  {["Sabtu 17:00", "Minggu 08:00", "Minggu 11:00", "Minggu 17:00"].map((time) => (
                    <div key={time} className="flex items-center gap-4">
                      <label className="w-32 text-sm font-medium text-gray-700">
                        {time}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={minTatibConfig["St. Yakobus"]?.[time] || 20}
                        onChange={(e) => {
                          const newConfig = { ...minTatibConfig };
                          if (!newConfig["St. Yakobus"]) {
                            newConfig["St. Yakobus"] = {};
                          }
                          newConfig["St. Yakobus"][time] = parseInt(e.target.value) || 20;
                          setMinTatibConfig(newConfig);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      />
                      <span className="text-sm text-gray-500">tatib</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pegangsaan 2 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Gereja Pegangsaan 2
                </h3>
                <div className="space-y-3">
                  {["Minggu 07:30", "Minggu 10:30"].map((time) => (
                    <div key={time} className="flex items-center gap-4">
                      <label className="w-32 text-sm font-medium text-gray-700">
                        {time}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={minTatibConfig["Pegangsaan 2"]?.[time] || 20}
                        onChange={(e) => {
                          const newConfig = { ...minTatibConfig };
                          if (!newConfig["Pegangsaan 2"]) {
                            newConfig["Pegangsaan 2"] = {};
                          }
                          newConfig["Pegangsaan 2"][time] = parseInt(e.target.value) || 20;
                          setMinTatibConfig(newConfig);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      />
                      <span className="text-sm text-gray-500">tatib</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowMinTatibConfig(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => setShowMinTatibConfig(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
