"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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
  const [saving, setSaving] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{
    assignmentIndex: number;
    action: "add" | "edit";
  } | null>(null);

  // Save assignments to Supabase
  const saveAssignmentsToDatabase = async (assignments: Assignment[]) => {
    try {
      console.log(
        "💾 saveAssignmentsToDatabase called with",
        assignments.length,
        "assignments"
      );
      const dataToSave = assignments.map((a) => ({
        tahun: selectedYear,
        bulan: selectedMonth, // Database uses 0-11 indexing like JavaScript
        tanggal: a.date,
        hari: a.day,
        gereja: a.church,
        waktu: a.time,
        assigned_lingkungan: a.assignedLingkungan,
        total_tatib: a.totalTatib,
        needs_more: a.needsMore,
      }));

      // Check for duplicates and log them
      const seen = new Map<string, number>();
      dataToSave.forEach((item, index) => {
        const key = `${item.tahun}-${item.bulan}-${item.tanggal}-${item.gereja}-${item.waktu}`;
        if (seen.has(key)) {
          console.error(
            `❌ DUPLICATE FOUND at index ${index}:`,
            key,
            "first seen at index",
            seen.get(key)
          );
        } else {
          seen.set(key, index);
        }
      });

      // Deduplicate before sending - prevent duplicate key errors
      const uniqueData = dataToSave.filter((item, index, self) => {
        return (
          index ===
          self.findIndex(
            (t) =>
              t.tahun === item.tahun &&
              t.bulan === item.bulan &&
              t.tanggal === item.tanggal &&
              t.gereja === item.gereja &&
              t.waktu === item.waktu
          )
        );
      });

      if (uniqueData.length !== dataToSave.length) {
        const duplicateCount = dataToSave.length - uniqueData.length;
        console.error(
          `⚠️  REMOVED ${duplicateCount} DUPLICATES from generated data before saving`
        );
      }

      console.log(
        "📤 Sending to API: tahun =",
        selectedYear,
        ", bulan =",
        selectedMonth,
        ", unique records =",
        uniqueData.length
      );
      const response = await fetch("/api/kalendar-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments: uniqueData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Failed to save assignments to database:");
        console.error("Error details:", JSON.stringify(errorData, null, 2));
        console.error("Status:", response.status);
      } else {
        const result = await response.json();
        console.log(
          "✅ Successfully saved to database:",
          result.length,
          "records"
        );
      }
    } catch (error) {
      console.error("❌ Error saving assignments:", error);
    }
  };

  // Load assignments from Supabase
  const loadAssignmentsFromDatabase = async (): Promise<
    Assignment[] | null
  > => {
    try {
      const response = await fetch(
        `/api/kalendar-assignments?tahun=${selectedYear}&bulan=${selectedMonth}` // Database uses 0-11 indexing
      );

      if (!response.ok) return null;

      const data = await response.json();

      if (!data || data.length === 0) return null;

      // Transform database format to frontend format
      return data.map((item: any) => ({
        date: item.tanggal,
        day: item.hari,
        church: item.gereja,
        time: item.waktu,
        assignedLingkungan: item.assigned_lingkungan,
        totalTatib: item.total_tatib,
        needsMore: item.needs_more,
      }));
    } catch (error) {
      console.error("Error loading assignments:", error);
      return null;
    }
  };

  // Shuffle handler for individual lingkungan
  const handleShuffleLingkungan = (
    assignmentIndex: number,
    lingkunganIndex: number
  ) => {
    const assignment = assignments[assignmentIndex];
    const currentLingkungan = assignment.assignedLingkungan[lingkunganIndex];

    // Get MIN_TATIB from configuration
    const normalizedChurch = assignment.church.includes("Yakobus")
      ? "St. Yakobus"
      : "Pegangsaan 2";
    const timeKey = `${assignment.day === "Minggu" ? "Minggu" : "Sabtu"} ${
      assignment.time
    }`;
    const configValue = minTatibConfig[normalizedChurch]?.[timeKey];
    const MIN_TATIB =
      typeof configValue === "number"
        ? configValue
        : (configValue ? parseInt(configValue as string) : 20) || 20;

    // Get all currently assigned lingkungan names in THIS MONTH only (excluding current slot)
    const allAssignedNames = new Set(
      assignments.flatMap((a) => a.assignedLingkungan.map((l) => l.name))
    );

    // Find alternative lingkungan that:
    // 1. Is available for this church/day/time
    // 2. Is not currently assigned to any slot in THIS MONTH
    // Note: We allow lingkungan from Paskah and Misa Lainnya to be used
    const availableAlternatives = lingkunganData.filter((ling) => {
      // Skip if it's the current lingkungan
      if (ling.namaLingkungan === currentLingkungan.name) return false;

      // Skip if already assigned somewhere else in this month
      if (allAssignedNames.has(ling.namaLingkungan)) return false;

      // Check availability for this church/day/time
      const availability = ling.availability[normalizedChurch];
      if (!availability) return false;

      const daySchedule =
        assignment.day === "Minggu" ? availability.Minggu : availability.Sabtu;
      if (!daySchedule || !daySchedule.includes(assignment.time)) return false;

      return true;
    });

    if (availableAlternatives.length === 0) {
      alert("Tidak ada lingkungan alternatif yang tersedia untuk slot ini");
      return;
    }

    // Pick a random alternative
    const randomIndex = Math.floor(
      Math.random() * availableAlternatives.length
    );
    const newLingkungan = availableAlternatives[randomIndex];
    const newTatib = parseInt(newLingkungan.jumlahTatib) || 0;

    // Update the assignment
    const updatedAssignments = [...assignments];
    const updatedAssignment = { ...updatedAssignments[assignmentIndex] };
    const updatedLingkunganList = [...updatedAssignment.assignedLingkungan];

    updatedLingkunganList[lingkunganIndex] = {
      name: newLingkungan.namaLingkungan,
      tatib: newTatib,
    };

    // Recalculate total tatib
    const newTotalTatib = updatedLingkunganList.reduce(
      (sum, l) => sum + l.tatib,
      0
    );

    updatedAssignment.assignedLingkungan = updatedLingkunganList;
    updatedAssignment.totalTatib = newTotalTatib;
    updatedAssignment.needsMore = newTotalTatib < MIN_TATIB;

    updatedAssignments[assignmentIndex] = updatedAssignment;
    setAssignments(updatedAssignments);
    saveAssignmentsToDatabase(updatedAssignments);
  };

  // Manual assignment handlers
  const handleAddLingkungan = (
    assignmentIndex: number,
    lingkunganName: string
  ) => {
    const assignment = assignments[assignmentIndex];
    const lingkungan = lingkunganData.find(
      (l) => l.namaLingkungan === lingkunganName
    );
    if (!lingkungan) return;

    const tatib = parseInt(lingkungan.jumlahTatib) || 0;
    const updatedAssignments = [...assignments];
    const updatedAssignment = { ...updatedAssignments[assignmentIndex] };

    updatedAssignment.assignedLingkungan = [
      ...updatedAssignment.assignedLingkungan,
      { name: lingkunganName, tatib },
    ];

    // Recalculate total
    const newTotalTatib = updatedAssignment.assignedLingkungan.reduce(
      (sum, l) => sum + l.tatib,
      0
    );

    // Get MIN_TATIB from configuration
    const normalizedChurch = assignment.church.includes("Yakobus")
      ? "St. Yakobus"
      : "Pegangsaan 2";
    const timeKey = `${assignment.day === "Minggu" ? "Minggu" : "Sabtu"} ${
      assignment.time
    }`;
    const configValue = minTatibConfig[normalizedChurch]?.[timeKey];
    const MIN_TATIB =
      typeof configValue === "number"
        ? configValue
        : (configValue ? parseInt(configValue as string) : 20) || 20;

    updatedAssignment.totalTatib = newTotalTatib;
    updatedAssignment.needsMore = newTotalTatib < MIN_TATIB;

    updatedAssignments[assignmentIndex] = updatedAssignment;
    setAssignments(updatedAssignments);
    setEditingSlot(null);

    // Save to database
    saveAssignmentsToDatabase(updatedAssignments);
  };

  const handleRemoveLingkungan = (
    assignmentIndex: number,
    lingkunganIndex: number
  ) => {
    const assignment = assignments[assignmentIndex];
    const updatedAssignments = [...assignments];
    const updatedAssignment = { ...updatedAssignments[assignmentIndex] };

    updatedAssignment.assignedLingkungan =
      updatedAssignment.assignedLingkungan.filter(
        (_, idx) => idx !== lingkunganIndex
      );

    // Recalculate total
    const newTotalTatib = updatedAssignment.assignedLingkungan.reduce(
      (sum, l) => sum + l.tatib,
      0
    );

    // Get MIN_TATIB from configuration
    const normalizedChurch = assignment.church.includes("Yakobus")
      ? "St. Yakobus"
      : "Pegangsaan 2";
    const timeKey = `${assignment.day === "Minggu" ? "Minggu" : "Sabtu"} ${
      assignment.time
    }`;
    const configValue = minTatibConfig[normalizedChurch]?.[timeKey];
    const MIN_TATIB =
      typeof configValue === "number"
        ? configValue
        : (configValue ? parseInt(configValue as string) : 20) || 20;

    updatedAssignment.totalTatib = newTotalTatib;
    updatedAssignment.needsMore = newTotalTatib < MIN_TATIB;

    updatedAssignments[assignmentIndex] = updatedAssignment;
    setAssignments(updatedAssignments);
    saveAssignmentsToDatabase(updatedAssignments);
  };

  const toggleManualMode = () => {
    // Manual mode removed - editing is always available
  };

  // Min Tatib Configuration
  const [showMinTatibConfig, setShowMinTatibConfig] = useState(false);
  const [minTatibConfig, setMinTatibConfig] = useState<{
    [church: string]: { [time: string]: number | string };
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

  // Load min tatib config from database on mount
  useEffect(() => {
    const loadMinTatibConfig = async () => {
      try {
        const response = await fetch("/api/min-tatib-config");
        if (response.ok) {
          const config = await response.json();
          setMinTatibConfig(config);
        }
      } catch (error) {
        console.error("Error loading min tatib config:", error);
      }
    };
    loadMinTatibConfig();
  }, []);

  useEffect(() => {
    loadLingkunganData();
  }, []);

  useEffect(() => {
    loadPaskahData();
    loadMisaLainnyaData();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (lingkunganData.length > 0) {
      // Load assignments from database or generate new ones
      loadAssignmentsFromDatabase().then((savedAssignments) => {
        if (savedAssignments && savedAssignments.length > 0) {
          // Use saved assignments
          setAssignments(savedAssignments);
        } else {
          // Generate new assignments if no saved data
          generateAssignments();
        }
      });
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
      console.log("📊 Loaded lingkungan data:", data.length, "lingkungan");
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

  const generateAssignments = async () => {
    console.log(
      "🔄 Starting generateAssignments for",
      selectedYear,
      "month",
      selectedMonth,
      "(DB bulan:",
      selectedMonth + 1,
      ")"
    );
    const assignments: Assignment[] = [];
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    console.log("📅 Days in month:", daysInMonth);

    // Create a unique seed for this month to ensure consistent but different shuffling per month
    const monthSeed = selectedYear * 12 + selectedMonth;

    // Global rotation system: track usage counts across all months from database
    const getGlobalUsageCounts = async (): Promise<Map<string, number>> => {
      const usageCounts = new Map<string, number>();

      // Initialize all lingkungan with 0 count
      lingkunganData.forEach((ling) => {
        usageCounts.set(ling.namaLingkungan, 0);
      });

      // Scan through last 6 months from database to count assignments
      for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
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
            // API returns array directly, not wrapped in { assignments: [...] }
            if (Array.isArray(data)) {
              data.forEach((assignment: any) => {
                if (
                  assignment.assigned_lingkungan &&
                  Array.isArray(assignment.assigned_lingkungan)
                ) {
                  assignment.assigned_lingkungan.forEach((ling: any) => {
                    const currentCount = usageCounts.get(ling.name) || 0;
                    usageCounts.set(ling.name, currentCount + 1);
                  });
                }
              });
            }
          }
        } catch (error) {
          console.error(
            `Error loading assignments for ${checkYear}-${checkMonth + 1}:`,
            error
          );
          // Skip this month if there's an error
        }
      }

      return usageCounts;
    };

    const usageCounts = await getGlobalUsageCounts();

    // FIXED: Track assignments using GLOBAL 6-month count + current month additions
    // This ensures true fairness across months: lingkungan with fewer assignments overall get priority
    const currentMonthUsageCounts = new Map<string, number>();

    // Initialize with GLOBAL counts from last 6 months (not 0!)
    lingkunganData.forEach((ling) => {
      const globalCount = usageCounts.get(ling.namaLingkungan) || 0;
      currentMonthUsageCounts.set(ling.namaLingkungan, globalCount);
    });

    console.log("📊 Global usage counts loaded:");
    const sortedCounts = Array.from(currentMonthUsageCounts.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, 10);
    sortedCounts.forEach(([name, count]) => {
      console.log(`   ${name}: ${count}x`);
    });

    // Don't filter out lingkungan globally - they should only be excluded on specific celebration dates
    // Use all available lingkungan for regular mass assignments
    const availableLingkungan = lingkunganData;

    // Function to rebuild the pool with GLOBAL usage counts + current month - called after each assignment
    // Priority order based on TOTAL assignments (6 months + current month):
    // 1. Lingkungan with lowest total count (0x, then 1x, then 2x, etc.)
    const rebuildPoolByUsage = (): LingkunganData[] => {
      // Group by total usage count
      const groupedByCount: { [count: number]: LingkunganData[] } = {};

      availableLingkungan.forEach((ling) => {
        const count = currentMonthUsageCounts.get(ling.namaLingkungan) || 0;
        if (!groupedByCount[count]) {
          groupedByCount[count] = [];
        }
        groupedByCount[count].push(ling);
      });

      // Sort groups by count (ascending: 0, 1, 2, 3...)
      const sortedCounts = Object.keys(groupedByCount)
        .map(Number)
        .sort((a, b) => a - b);

      const sortedByUsage: LingkunganData[] = [];
      for (const count of sortedCounts) {
        const group = groupedByCount[count];
        // Sort by name for consistency within same count
        group.sort((a, b) => a.namaLingkungan.localeCompare(b.namaLingkungan));
        sortedByUsage.push(...group);
      }

      return sortedByUsage;
    };

    // Initial pool build
    let unassignedPool = rebuildPoolByUsage();

    // Track assignments per week to avoid assigning same lingkungan in consecutive weeks
    const weeklyAssignments: { [weekNum: number]: Set<string> } = {};

    // Track assignments per day to avoid assigning same lingkungan multiple times on same date
    const dailyAssignments: { [dayNum: number]: Set<string> } = {};

    // Track ALL assignments in this month to prevent duplicates across the entire month
    const monthlyAssignedLingkungan = new Set<string>();

    // Helper function to get week number of the month
    const getWeekOfMonth = (dayNum: number): number => {
      return Math.ceil(dayNum / 7);
    };

    // Helper function to extract wilayah (area) from lingkungan name
    // e.g., "Agnes 2" -> "Agnes", "Maria 1" -> "Maria"
    // "Lingkungan Santa Maria" -> "Maria", "Lingkungan Santo Petrus" -> "Petrus"
    const getWilayah = (namaLingkungan: string): string => {
      // Handle "Lingkungan Santa/Santo X" format
      const lingkunganMatch = namaLingkungan.match(
        /^Lingkungan\s+Sant[ao]\s+(.+)$/i
      );
      if (lingkunganMatch) {
        return lingkunganMatch[1].trim();
      }

      // Handle "Name Number" format (e.g., "Agnes 2" -> "Agnes")
      const numberMatch = namaLingkungan.match(/^(.+?)\s*\d+$/);
      return numberMatch ? numberMatch[1].trim() : namaLingkungan;
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
      const configValue = minTatibConfig[normalizedChurch]?.[timeKey];
      const MIN_TATIB =
        typeof configValue === "number"
          ? configValue
          : (configValue ? parseInt(configValue as string) : 20) || 20;

      const assigned: AssignedLingkungan[] = [];
      let totalTatib = 0;

      // Get lingkungan already assigned today (same day of month)
      const todayAssignments =
        dailyAssignments[currentDay] || new Set<string>();

      // SIMPLE FAIRNESS ALGORITHM:
      // 1. Filter lingkungan who are available for this slot AND not assigned today
      // 2. Sort by total assignment count (lowest first)
      // 3. Pick the first one

      const availableLingkungan = lingkunganData.filter((ling) => {
        // Skip if already assigned today
        if (todayAssignments.has(ling.namaLingkungan)) return false;

        // Skip if already assigned ANYWHERE in this month
        if (monthlyAssignedLingkungan.has(ling.namaLingkungan)) return false;

        // Check availability for this church/day/time
        const availability = ling.availability[normalizedChurch];
        if (!availability) return false;

        const daySchedule =
          day === "Minggu" ? availability.Minggu : availability.Sabtu;
        if (!daySchedule || !daySchedule.includes(time)) return false;

        return true;
      });

      if (availableLingkungan.length === 0) {
        console.warn(
          `⚠️  NO lingkungan available for ${church} ${day} ${time} on day ${currentDay}`
        );
        return [];
      }

      // Sort by assignment count (FAIRNESS FIRST AND ONLY)
      availableLingkungan.sort((a, b) => {
        const countA = currentMonthUsageCounts.get(a.namaLingkungan) || 0;
        const countB = currentMonthUsageCounts.get(b.namaLingkungan) || 0;

        if (countA !== countB) return countA - countB; // Lower count wins

        // If counts are equal, sort alphabetically for consistency
        return a.namaLingkungan.localeCompare(b.namaLingkungan);
      });

      const selectedLingkungan = availableLingkungan[0];
      const tatib = parseInt(selectedLingkungan.jumlahTatib) || 0;
      const currentCount =
        currentMonthUsageCounts.get(selectedLingkungan.namaLingkungan) || 0;

      // Debug: Show top 3 candidates to understand selection
      if (availableLingkungan.length >= 3) {
        const top3 = availableLingkungan
          .slice(0, 3)
          .map((l) => {
            const count = currentMonthUsageCounts.get(l.namaLingkungan) || 0;
            const t = parseInt(l.jumlahTatib) || 0;
            return `${l.namaLingkungan}(${count}x,${t}t)`;
          })
          .join(", ");
        console.log(`   Top 3: ${top3}`);
      }

      console.log(
        `✅ ${church} ${time} Day ${currentDay}: Selected ${selectedLingkungan.namaLingkungan} (${tatib} tatib, count: ${currentCount})`
      );

      assigned.push({
        name: selectedLingkungan.namaLingkungan,
        tatib: tatib,
      });

      totalTatib = tatib; // Update the existing totalTatib variable

      // Update count
      currentMonthUsageCounts.set(
        selectedLingkungan.namaLingkungan,
        currentCount + 1
      );

      // Track daily assignment
      if (!dailyAssignments[currentDay]) {
        dailyAssignments[currentDay] = new Set<string>();
      }
      dailyAssignments[currentDay].add(selectedLingkungan.namaLingkungan);

      // Track monthly assignment (to prevent same lingkungan being assigned twice in one month)
      monthlyAssignedLingkungan.add(selectedLingkungan.namaLingkungan);

      // If tatib < MIN_TATIB, try to add more lingkungan from the SAME wilayah
      if (tatib < MIN_TATIB) {
        const wilayah = getWilayah(selectedLingkungan.namaLingkungan);

        // Get ALL available lingkungan (not assigned today or this month)
        let candidateLingkungan = availableLingkungan.filter((ling) => {
          if (ling.namaLingkungan === selectedLingkungan.namaLingkungan)
            return false; // Skip the one already selected
          if (dailyAssignments[currentDay]?.has(ling.namaLingkungan))
            return false; // Skip if already assigned today
          if (monthlyAssignedLingkungan.has(ling.namaLingkungan)) return false; // Skip if already assigned this month
          return true;
        });

        // Sort by: 1) Same wilayah first, 2) Usage count (fairness), 3) Name
        candidateLingkungan.sort((a, b) => {
          const aIsWilayah = getWilayah(a.namaLingkungan) === wilayah;
          const bIsWilayah = getWilayah(b.namaLingkungan) === wilayah;

          // Prioritize same wilayah
          if (aIsWilayah && !bIsWilayah) return -1;
          if (!aIsWilayah && bIsWilayah) return 1;

          // Within same priority (both same wilayah or both different), sort by count
          const countA = currentMonthUsageCounts.get(a.namaLingkungan) || 0;
          const countB = currentMonthUsageCounts.get(b.namaLingkungan) || 0;
          if (countA !== countB) return countA - countB;

          return a.namaLingkungan.localeCompare(b.namaLingkungan);
        });

        if (candidateLingkungan.length === 0) {
          console.log(
            `   ⚠️ No additional lingkungan available for ${selectedLingkungan.namaLingkungan}`
          );
        }

        // Add lingkungan until we reach MIN_TATIB (prioritizing same wilayah)
        for (const additionalLing of candidateLingkungan) {
          if (totalTatib >= MIN_TATIB) break;

          const additionalTatib = parseInt(additionalLing.jumlahTatib) || 0;
          const additionalWilayah = getWilayah(additionalLing.namaLingkungan);

          assigned.push({
            name: additionalLing.namaLingkungan,
            tatib: additionalTatib,
          });
          totalTatib += additionalTatib;

          // Update count
          const addCount =
            currentMonthUsageCounts.get(additionalLing.namaLingkungan) || 0;
          currentMonthUsageCounts.set(
            additionalLing.namaLingkungan,
            addCount + 1
          );

          // Track daily assignment
          dailyAssignments[currentDay].add(additionalLing.namaLingkungan);

          // Track monthly assignment
          monthlyAssignedLingkungan.add(additionalLing.namaLingkungan);

          const wilayahLabel =
            additionalWilayah === wilayah
              ? `same wilayah (${wilayah})`
              : `different wilayah (${additionalWilayah})`;
          console.log(
            `   ➕ Added ${additionalLing.namaLingkungan} (${additionalTatib} tatib) - ${wilayahLabel} - Total: ${totalTatib}`
          );
        }
      }

      // Rebuild pool
      unassignedPool = rebuildPoolByUsage();

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

        // Skip this date if it's a Paskah or Misa Lainnya celebration
        // Those celebrations will use their manually assigned lingkungan
        if (paskahDates[dateStr] || misaLainnyaDates[dateStr]) {
          continue;
        }

        // Helper to check if assignment already exists before adding
        const isDuplicate = (church: string, time: string) => {
          return assignments.some(
            (a) => a.date === dateStr && a.church === church && a.time === time
          );
        };

        // St. Yakobus assignments
        if (dayOfWeek === 0) {
          // Sunday
          if (!isDuplicate("St. Yakobus", "08:00")) {
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
          }

          if (!isDuplicate("St. Yakobus", "11:00")) {
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
          }

          if (!isDuplicate("St. Yakobus", "17:00")) {
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
          }
        } else {
          // Saturday
          if (!isDuplicate("St. Yakobus", "17:00")) {
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
        }

        // Pegangsaan 2 assignments (Sunday only)
        if (dayOfWeek === 0) {
          if (!isDuplicate("Pegangsaan 2", "07:30")) {
            const assignedP0730 = getNextLingkunganForSlot(
              "Pegangsaan 2",
              dayName,
              "07:30",
              day
            );
            const totalP0730 = assignedP0730.reduce(
              (sum, l) => sum + l.tatib,
              0
            );
            assignments.push({
              date: dateStr,
              day: dayName,
              church: "Pegangsaan 2",
              time: "07:30",
              assignedLingkungan: assignedP0730,
              totalTatib: totalP0730,
              needsMore: totalP0730 < 20,
            });
          }

          if (!isDuplicate("Pegangsaan 2", "10:30")) {
            const assignedP1030 = getNextLingkunganForSlot(
              "Pegangsaan 2",
              dayName,
              "10:30",
              day
            );
            const totalP1030 = assignedP1030.reduce(
              (sum, l) => sum + l.tatib,
              0
            );
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
    }

    // Post-processing: Consolidate lingkungan from same wilayah on same date
    // This handles cases where multiple slots on the same date have partial assignments from the same wilayah
    const consolidateWilayahOnSameDate = () => {
      const dateGroups: { [date: string]: number[] } = {};

      // Group assignments by date
      assignments.forEach((assignment, index) => {
        if (!dateGroups[assignment.date]) {
          dateGroups[assignment.date] = [];
        }
        dateGroups[assignment.date].push(index);
      });

      // For each date, check if we can consolidate wilayah
      Object.keys(dateGroups).forEach((date) => {
        const indices = dateGroups[date];

        // Get assignments for this date that need more tatib
        const needsMoreIndices = indices.filter(
          (idx) =>
            assignments[idx].needsMore &&
            assignments[idx].assignedLingkungan.length > 0
        );

        if (needsMoreIndices.length < 2) return; // Need at least 2 slots to consolidate

        // Group by wilayah
        const wilayahMap: { [wilayah: string]: number[] } = {};
        needsMoreIndices.forEach((idx) => {
          const assignment = assignments[idx];
          if (assignment.assignedLingkungan.length > 0) {
            const wilayah = getWilayah(assignment.assignedLingkungan[0].name);
            if (!wilayahMap[wilayah]) {
              wilayahMap[wilayah] = [];
            }
            wilayahMap[wilayah].push(idx);
          }
        });

        // Find wilayah with multiple slots that are both incomplete
        Object.keys(wilayahMap).forEach((wilayah) => {
          const slotIndices = wilayahMap[wilayah];
          if (slotIndices.length >= 2) {
            // Combine all lingkungan from this wilayah into the first slot
            const targetIndex = slotIndices[0];
            const targetAssignment = assignments[targetIndex];

            // Get MIN_TATIB for target slot
            const normalizedChurch = targetAssignment.church.includes("Yakobus")
              ? "St. Yakobus"
              : "Pegangsaan 2";
            const timeKey = `${
              targetAssignment.day === "Minggu" ? "Minggu" : "Sabtu"
            } ${targetAssignment.time}`;
            const configValue = minTatibConfig[normalizedChurch]?.[timeKey];
            const MIN_TATIB =
              typeof configValue === "number"
                ? configValue
                : (configValue ? parseInt(configValue as string) : 20) || 20;
            const MAX_TATIB = MIN_TATIB + 10;

            let combinedLingkungan = [...targetAssignment.assignedLingkungan];
            let combinedTatib = targetAssignment.totalTatib;

            // Collect lingkungan from other slots
            for (let i = 1; i < slotIndices.length; i++) {
              const sourceIndex = slotIndices[i];
              const sourceAssignment = assignments[sourceIndex];

              sourceAssignment.assignedLingkungan.forEach((ling) => {
                // Only add if it won't exceed MAX_TATIB
                if (combinedTatib + ling.tatib <= MAX_TATIB) {
                  combinedLingkungan.push(ling);
                  combinedTatib += ling.tatib;

                  // Add back to unassigned pool so it can be reassigned
                  const lingkunganData = availableLingkungan.find(
                    (l) => l.namaLingkungan === ling.name
                  );
                  if (lingkunganData) {
                    unassignedPool.push(lingkunganData);
                  }
                }
              });

              // Clear the source slot so it can get a new assignment
              assignments[sourceIndex].assignedLingkungan = [];
              assignments[sourceIndex].totalTatib = 0;
              assignments[sourceIndex].needsMore = true;
            }

            // Update target slot with combined lingkungan
            assignments[targetIndex].assignedLingkungan = combinedLingkungan;
            assignments[targetIndex].totalTatib = combinedTatib;
            assignments[targetIndex].needsMore = combinedTatib < MIN_TATIB;

            // Now reassign empty slots with available lingkungan from different wilayah
            for (let i = 1; i < slotIndices.length; i++) {
              const emptyIndex = slotIndices[i];
              const emptyAssignment = assignments[emptyIndex];

              // Find available lingkungan from different wilayah
              const newAssignment = getNextLingkunganForSlot(
                emptyAssignment.church,
                emptyAssignment.day,
                emptyAssignment.time,
                parseInt(emptyAssignment.date.split("/")[0])
              );

              const newTotal = newAssignment.reduce(
                (sum, l) => sum + l.tatib,
                0
              );
              assignments[emptyIndex].assignedLingkungan = newAssignment;
              assignments[emptyIndex].totalTatib = newTotal;

              // Get MIN_TATIB for this slot
              const normChurch = emptyAssignment.church.includes("Yakobus")
                ? "St. Yakobus"
                : "Pegangsaan 2";
              const tKey = `${
                emptyAssignment.day === "Minggu" ? "Minggu" : "Sabtu"
              } ${emptyAssignment.time}`;
              const cValue = minTatibConfig[normChurch]?.[tKey];
              const minTatib =
                typeof cValue === "number"
                  ? cValue
                  : (cValue ? parseInt(cValue as string) : 20) || 20;

              assignments[emptyIndex].needsMore = newTotal < minTatib;
            }
          }
        });
      });
    };

    console.log("📊 Before consolidation:", assignments.length, "assignments");
    consolidateWilayahOnSameDate();
    console.log("📊 After consolidation:", assignments.length, "assignments");

    // Check for duplicates after consolidation
    const duplicatesAfterConsolidation = new Map<string, number[]>();
    assignments.forEach((a, index) => {
      const key = `${a.date}-${a.church}-${a.time}`;
      if (!duplicatesAfterConsolidation.has(key)) {
        duplicatesAfterConsolidation.set(key, []);
      }
      duplicatesAfterConsolidation.get(key)!.push(index);
    });

    duplicatesAfterConsolidation.forEach((indices, key) => {
      if (indices.length > 1) {
        console.error(
          `❌ DUPLICATE KEY AFTER CONSOLIDATION: ${key} appears at indices:`,
          indices
        );
        indices.forEach((i) => {
          console.error(`   Index ${i}:`, assignments[i]);
        });
      }
    });

    console.log("✅ Generated", assignments.length, "assignments");

    // FAIRNESS DIAGNOSTIC: Check final distribution
    console.log("\n🔍 FAIRNESS DIAGNOSTIC:");
    const finalCounts = new Map<string, number>();
    lingkunganData.forEach((ling) => finalCounts.set(ling.namaLingkungan, 0));

    assignments.forEach((assignment) => {
      assignment.assignedLingkungan.forEach((ling) => {
        const current = finalCounts.get(ling.name) || 0;
        finalCounts.set(ling.name, current + 1);
      });
    });

    const distribution = Array.from(finalCounts.entries()).sort(
      (a, b) => a[1] - b[1]
    );

    const zeros = distribution.filter(([_, count]) => count === 0);
    const ones = distribution.filter(([_, count]) => count === 1);
    const twos = distribution.filter(([_, count]) => count === 2);
    const threes = distribution.filter(([_, count]) => count >= 3);

    console.log(`   0x assignments: ${zeros.length} lingkungan`);
    console.log(`   1x assignments: ${ones.length} lingkungan`);
    console.log(`   2x assignments: ${twos.length} lingkungan`);
    console.log(`   3x+ assignments: ${threes.length} lingkungan`);

    if (zeros.length > 0) {
      console.warn("   ⚠️ Lingkungan with 0 assignments:");
      zeros.slice(0, 5).forEach(([name]) => {
        const ling = lingkunganData.find((l) => l.namaLingkungan === name);
        if (ling) {
          const availSlots = [];
          if (ling.availability["St. Yakobus"]?.Minggu)
            availSlots.push(
              ...ling.availability["St. Yakobus"].Minggu.map(
                (t) => `SY Minggu ${t}`
              )
            );
          if (ling.availability["St. Yakobus"]?.Sabtu)
            availSlots.push(
              ...ling.availability["St. Yakobus"].Sabtu.map(
                (t) => `SY Sabtu ${t}`
              )
            );
          if (ling.availability["Pegangsaan 2"]?.Minggu)
            availSlots.push(
              ...ling.availability["Pegangsaan 2"].Minggu.map(
                (t) => `P2 Minggu ${t}`
              )
            );
          console.log(
            `      ${name}: Available for ${
              availSlots.length
            } slots - ${availSlots.join(", ")}`
          );
        }
      });
    }

    if (threes.length > 0) {
      console.warn("   ⚠️ Lingkungan with 3+ assignments:");
      threes.slice(0, 5).forEach(([name, count]) => {
        console.log(`      ${name}: ${count}x`);
      });
    }
    console.log("");

    // Check for duplicates before saving
    const uniqueKeys = new Set();
    const duplicates: any[] = [];
    assignments.forEach((a, idx) => {
      const key = `${a.date}_${a.church}_${a.time}`;
      if (uniqueKeys.has(key)) {
        duplicates.push({ index: idx, key, assignment: a });
      }
      uniqueKeys.add(key);
    });

    if (duplicates.length > 0) {
      console.error("⚠️  Found duplicate assignments:", duplicates);
    } else {
      console.log("✅ No duplicate assignments found");
    }

    setAssignments(assignments);

    // Save to database (async, but don't block UI)
    console.log("💾 Saving assignments to database...");
    saveAssignmentsToDatabase(assignments).catch((err) =>
      console.error("Error saving assignments in background:", err)
    );
  };

  const generateAllMonths = async () => {
    const startYear = selectedYear;
    const startMonth = selectedMonth;
    const confirmed = window.confirm(
      `Generate assignments for 12 consecutive months starting from ${new Date(
        startYear,
        startMonth
      ).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      })}?\n\nThis will take about 2-3 minutes.`
    );

    if (!confirmed) return;

    try {
      // Generate 12 months starting from current selected month
      for (let i = 0; i < 12; i++) {
        const monthToGenerate = (startMonth + i) % 12;
        const yearToGenerate = startYear + Math.floor((startMonth + i) / 12);

        console.log(`\n${"=".repeat(60)}`);
        console.log(
          `📅 Generating ${i + 1}/12: ${new Date(
            yearToGenerate,
            monthToGenerate
          ).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`
        );
        console.log(`${"=".repeat(60)}\n`);

        // Set the month/year for generation
        setSelectedYear(yearToGenerate);
        setSelectedMonth(monthToGenerate);

        // Wait for state to update
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Generate assignments for this month
        await generateAssignments();

        // Wait between months to ensure database operations complete
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Restore original month/year
      setSelectedYear(startYear);
      setSelectedMonth(startMonth);
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Reload the current month to show it
      await loadAssignmentsFromDatabase();

      alert(
        `✅ Successfully generated 12 months of assignments!\n\nStarting: ${new Date(
          startYear,
          startMonth
        ).toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        })}\nEnding: ${new Date(
          startYear + Math.floor((startMonth + 11) / 12),
          (startMonth + 11) % 12
        ).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`
      );
    } catch (error) {
      console.error("❌ Error generating all months:", error);
      alert("Failed to generate all months. Check console for details.");

      // Restore original month/year on error
      setSelectedYear(startYear);
      setSelectedMonth(startMonth);
    }
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

  // Export to PDF function
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title
    const monthName = new Date(selectedYear, selectedMonth).toLocaleDateString(
      "id-ID",
      {
        month: "long",
        year: "numeric",
      }
    );
    doc.setFontSize(16);
    doc.text(`Jadwal Penugasan Tatib - ${monthName}`, 14, 15);

    // Prepare data for table
    const tableData: any[] = [];
    assignments.forEach((assignment) => {
      const lingkunganNames = assignment.assignedLingkungan
        .map((l) => `${l.name} (${l.tatib} tatib)`)
        .join(", ");

      tableData.push([
        assignment.date,
        assignment.day,
        assignment.church,
        assignment.time,
        lingkunganNames || "-",
        assignment.totalTatib.toString(),
        assignment.needsMore ? "Kurang" : "Cukup",
      ]);
    });

    // Add table
    autoTable(doc, {
      head: [
        [
          "Tanggal",
          "Hari",
          "Gereja",
          "Waktu",
          "Lingkungan",
          "Total Tatib",
          "Status",
        ],
      ],
      body: tableData,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }, // Purple
    });

    // Save PDF
    doc.save(`Jadwal-Tatib-${monthName.replace(/\s/g, "-")}.pdf`);
  };

  // Export to Excel function
  const exportToExcel = () => {
    const monthName = new Date(selectedYear, selectedMonth).toLocaleDateString(
      "id-ID",
      {
        month: "long",
        year: "numeric",
      }
    );

    // Prepare data for Excel
    const excelData = assignments.map((assignment) => ({
      Tanggal: assignment.date,
      Hari: assignment.day,
      Gereja: assignment.church,
      Waktu: assignment.time,
      Lingkungan:
        assignment.assignedLingkungan
          .map((l) => `${l.name} (${l.tatib} tatib)`)
          .join(", ") || "-",
      "Total Tatib": assignment.totalTatib,
      Status: assignment.needsMore ? "Kurang" : "Cukup",
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 12 }, // Tanggal
      { wch: 10 }, // Hari
      { wch: 15 }, // Gereja
      { wch: 8 }, // Waktu
      { wch: 50 }, // Lingkungan
      { wch: 12 }, // Total Tatib
      { wch: 10 }, // Status
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Jadwal Tatib");

    // Save Excel file
    XLSX.writeFile(
      workbook,
      `Jadwal-Tatib-${monthName.replace(/\s/g, "-")}.xlsx`
    );
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
            href="/cek-rotasi"
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Cek Rotasi
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
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
              </div>

              {/* Action Buttons - Stacked on Mobile, Row on Desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2">
                <button
                  onClick={() => setShowMinTatibConfig(true)}
                  className="px-3 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                >
                  ⚙️ Min Tatib
                </button>
                <button
                  onClick={() => {
                    setSelectedYear(new Date().getFullYear());
                    setSelectedMonth(new Date().getMonth());
                  }}
                  className="px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                >
                  📅 Bulan Ini
                </button>
                <button
                  onClick={() => {
                    // Regenerate fresh assignments from scratch
                    generateAssignments();

                    alert(
                      `Jadwal baru telah di-generate untuk ${new Date(
                        selectedYear,
                        selectedMonth
                      ).toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                      })}`
                    );
                  }}
                  className="px-3 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                  title="Generate jadwal baru dari awal"
                >
                  🔄 Generate
                </button>
                <button
                  onClick={generateAllMonths}
                  className="px-3 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                  title="Generate 12 bulan berturut-turut"
                >
                  🔄 12 Bulan
                </button>
                <button
                  onClick={async () => {
                    // Save current assignments (including manual edits and swaps) to database
                    await saveAssignmentsToDatabase(assignments);

                    alert(
                      `Jadwal telah tersimpan untuk ${new Date(
                        selectedYear,
                        selectedMonth
                      ).toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                      })}`
                    );
                  }}
                  className="px-3 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                  title="Simpan jadwal saat ini"
                >
                  💾 Simpan
                </button>
                <button
                  onClick={exportToPDF}
                  className="px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                  title="Download jadwal ke PDF"
                >
                  📄 PDF
                </button>
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
                                      (() => {
                                        const assignmentIndex =
                                          assignments.findIndex(
                                            (a) =>
                                              a.date === assignment.date &&
                                              a.church === assignment.church &&
                                              a.time === assignment.time
                                          );

                                        const allAssignedNames = new Set(
                                          assignments.flatMap((a) =>
                                            a.assignedLingkungan.map(
                                              (l) => l.name
                                            )
                                          )
                                        );

                                        const normalizedChurch =
                                          assignment.church.includes("Yakobus")
                                            ? "St. Yakobus"
                                            : "Pegangsaan 2";

                                        const availableLingkungan =
                                          lingkunganData.filter((ling) => {
                                            if (
                                              allAssignedNames.has(
                                                ling.namaLingkungan
                                              )
                                            )
                                              return false;

                                            const availability =
                                              ling.availability[
                                                normalizedChurch
                                              ];
                                            if (!availability) return false;

                                            const daySchedule =
                                              assignment.day === "Minggu"
                                                ? availability.Minggu
                                                : availability.Sabtu;
                                            if (
                                              !daySchedule ||
                                              !daySchedule.includes(
                                                assignment.time
                                              )
                                            )
                                              return false;

                                            return true;
                                          });

                                        return (
                                          <select
                                            onChange={(e) => {
                                              if (e.target.value) {
                                                handleAddLingkungan(
                                                  assignmentIndex,
                                                  e.target.value
                                                );
                                                e.target.value = "";
                                              }
                                            }}
                                            className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          >
                                            <option value="">
                                              + Tambah Lingkungan
                                            </option>
                                            {availableLingkungan.map(
                                              (ling, lingIndex) => (
                                                <option
                                                  key={`${assignment.date}-${assignment.church}-${assignment.time}-${ling.namaLingkungan}-${ling.id}-${lingIndex}`}
                                                  value={ling.namaLingkungan}
                                                >
                                                  {ling.namaLingkungan} (
                                                  {ling.jumlahTatib} tatib)
                                                </option>
                                              )
                                            )}
                                          </select>
                                        );
                                      })()
                                    ) : (
                                      <div className="space-y-1">
                                        {assignment.assignedLingkungan.map(
                                          (ling, idx) => {
                                            // Find the actual index in the assignments array
                                            const assignmentIndex =
                                              assignments.findIndex(
                                                (a) =>
                                                  a.date === assignment.date &&
                                                  a.church ===
                                                    assignment.church &&
                                                  a.time === assignment.time
                                              );

                                            return (
                                              <div
                                                key={`${assignment.date}-${assignment.church}-${assignment.time}-${ling.name}-${idx}`}
                                                className="flex items-center justify-between gap-2 text-gray-900 group"
                                              >
                                                <div>
                                                  {ling.name}
                                                  <span className="text-xs text-gray-500 ml-2">
                                                    ({ling.tatib} tatib)
                                                  </span>
                                                </div>
                                                <div className="flex gap-1">
                                                  <button
                                                    onClick={() =>
                                                      handleRemoveLingkungan(
                                                        assignmentIndex,
                                                        idx
                                                      )
                                                    }
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                                                    title="Hapus lingkungan ini"
                                                  >
                                                    <svg
                                                      className="w-4 h-4 text-red-600"
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
                                                  <select
                                                    value=""
                                                    onChange={(e) => {
                                                      if (e.target.value) {
                                                        // Find the target assignment that has the selected lingkungan
                                                        const targetLingkunganName =
                                                          e.target.value;
                                                        let targetAssignmentIndex =
                                                          -1;
                                                        let targetLingkunganIndex =
                                                          -1;

                                                        assignments.forEach(
                                                          (a, aIdx) => {
                                                            a.assignedLingkungan.forEach(
                                                              (l, lIdx) => {
                                                                if (
                                                                  l.name ===
                                                                  targetLingkunganName
                                                                ) {
                                                                  targetAssignmentIndex =
                                                                    aIdx;
                                                                  targetLingkunganIndex =
                                                                    lIdx;
                                                                }
                                                              }
                                                            );
                                                          }
                                                        );

                                                        if (
                                                          targetAssignmentIndex !==
                                                          -1
                                                        ) {
                                                          // Swap the two lingkungan
                                                          const updatedAssignments =
                                                            [...assignments];
                                                          const currentLingkungan =
                                                            updatedAssignments[
                                                              assignmentIndex
                                                            ]
                                                              .assignedLingkungan[
                                                              idx
                                                            ];
                                                          const targetLingkungan =
                                                            updatedAssignments[
                                                              targetAssignmentIndex
                                                            ]
                                                              .assignedLingkungan[
                                                              targetLingkunganIndex
                                                            ];

                                                          updatedAssignments[
                                                            assignmentIndex
                                                          ].assignedLingkungan[
                                                            idx
                                                          ] = targetLingkungan;
                                                          updatedAssignments[
                                                            targetAssignmentIndex
                                                          ].assignedLingkungan[
                                                            targetLingkunganIndex
                                                          ] = currentLingkungan;

                                                          // Recalculate totals
                                                          updatedAssignments[
                                                            assignmentIndex
                                                          ].totalTatib =
                                                            updatedAssignments[
                                                              assignmentIndex
                                                            ].assignedLingkungan.reduce(
                                                              (sum, l) =>
                                                                sum + l.tatib,
                                                              0
                                                            );
                                                          updatedAssignments[
                                                            targetAssignmentIndex
                                                          ].totalTatib =
                                                            updatedAssignments[
                                                              targetAssignmentIndex
                                                            ].assignedLingkungan.reduce(
                                                              (sum, l) =>
                                                                sum + l.tatib,
                                                              0
                                                            );

                                                          setAssignments(
                                                            updatedAssignments
                                                          );
                                                          saveAssignmentsToDatabase(
                                                            updatedAssignments
                                                          );
                                                        }
                                                      }
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                                                    title="Tukar dengan lingkungan lain"
                                                  >
                                                    <option value="">
                                                      ✏️ Tukar
                                                    </option>
                                                    {(() => {
                                                      // Get current slot details for availability checking
                                                      const currentChurch =
                                                        assignment.church.includes(
                                                          "Yakobus"
                                                        )
                                                          ? "St. Yakobus"
                                                          : "Pegangsaan 2";
                                                      const currentDay =
                                                        assignment.day;
                                                      const currentTime =
                                                        assignment.time;

                                                      // Get all assigned lingkungan with availability check
                                                      const swappableLingkungan: Array<{
                                                        name: string;
                                                        assignment: string;
                                                        assignmentIndex: number;
                                                        church: string;
                                                        day: string;
                                                        time: string;
                                                      }> = [];

                                                      assignments.forEach(
                                                        (a, aIdx) => {
                                                          a.assignedLingkungan.forEach(
                                                            (l) => {
                                                              if (
                                                                l.name !==
                                                                ling.name
                                                              ) {
                                                                // Find lingkungan data for availability check
                                                                const targetLingData =
                                                                  lingkunganData.find(
                                                                    (ld) =>
                                                                      ld.namaLingkungan ===
                                                                      l.name
                                                                  );
                                                                const currentLingData =
                                                                  lingkunganData.find(
                                                                    (ld) =>
                                                                      ld.namaLingkungan ===
                                                                      ling.name
                                                                  );

                                                                if (
                                                                  !targetLingData ||
                                                                  !currentLingData
                                                                )
                                                                  return;

                                                                // Check if target lingkungan has availability for CURRENT slot
                                                                const targetAvailForCurrent =
                                                                  targetLingData
                                                                    .availability[
                                                                    currentChurch
                                                                  ];
                                                                if (
                                                                  !targetAvailForCurrent
                                                                )
                                                                  return;

                                                                const targetDaySchedule =
                                                                  currentDay ===
                                                                  "Minggu"
                                                                    ? targetAvailForCurrent.Minggu
                                                                    : targetAvailForCurrent.Sabtu;
                                                                if (
                                                                  !targetDaySchedule ||
                                                                  !targetDaySchedule.includes(
                                                                    currentTime
                                                                  )
                                                                )
                                                                  return;

                                                                // Check if current lingkungan has availability for TARGET slot
                                                                const targetChurch =
                                                                  a.church.includes(
                                                                    "Yakobus"
                                                                  )
                                                                    ? "St. Yakobus"
                                                                    : "Pegangsaan 2";
                                                                const currentAvailForTarget =
                                                                  currentLingData
                                                                    .availability[
                                                                    targetChurch
                                                                  ];
                                                                if (
                                                                  !currentAvailForTarget
                                                                )
                                                                  return;

                                                                const currentDaySchedule =
                                                                  a.day ===
                                                                  "Minggu"
                                                                    ? currentAvailForTarget.Minggu
                                                                    : currentAvailForTarget.Sabtu;
                                                                if (
                                                                  !currentDaySchedule ||
                                                                  !currentDaySchedule.includes(
                                                                    a.time
                                                                  )
                                                                )
                                                                  return;

                                                                // Both lingkungan can swap - add to list
                                                                swappableLingkungan.push(
                                                                  {
                                                                    name: l.name,
                                                                    assignment: `${a.date} ${a.church} ${a.time}`,
                                                                    assignmentIndex:
                                                                      aIdx,
                                                                    church:
                                                                      a.church,
                                                                    day: a.day,
                                                                    time: a.time,
                                                                  }
                                                                );
                                                              }
                                                            }
                                                          );
                                                        }
                                                      );

                                                      return swappableLingkungan.map(
                                                        (item, i) => (
                                                          <option
                                                            key={i}
                                                            value={item.name}
                                                          >
                                                            {item.name} (
                                                            {item.assignment})
                                                          </option>
                                                        )
                                                      );
                                                    })()}
                                                  </select>
                                                </div>
                                              </div>
                                            );
                                          }
                                        )}
                                        {(() => {
                                          const assignmentIndex =
                                            assignments.findIndex(
                                              (a) =>
                                                a.date === assignment.date &&
                                                a.church ===
                                                  assignment.church &&
                                                a.time === assignment.time
                                            );

                                          // Get all assigned lingkungan in this month
                                          const allAssignedNames = new Set(
                                            assignments.flatMap((a) =>
                                              a.assignedLingkungan.map(
                                                (l) => l.name
                                              )
                                            )
                                          );

                                          // Get available lingkungan for this slot
                                          const normalizedChurch =
                                            assignment.church.includes(
                                              "Yakobus"
                                            )
                                              ? "St. Yakobus"
                                              : "Pegangsaan 2";

                                          const availableLingkungan =
                                            lingkunganData.filter((ling) => {
                                              if (
                                                allAssignedNames.has(
                                                  ling.namaLingkungan
                                                )
                                              )
                                                return false;

                                              const availability =
                                                ling.availability[
                                                  normalizedChurch
                                                ];
                                              if (!availability) return false;

                                              const daySchedule =
                                                assignment.day === "Minggu"
                                                  ? availability.Minggu
                                                  : availability.Sabtu;
                                              if (
                                                !daySchedule ||
                                                !daySchedule.includes(
                                                  assignment.time
                                                )
                                              )
                                                return false;

                                              return true;
                                            });

                                          return (
                                            <div className="mt-2">
                                              <select
                                                onChange={(e) => {
                                                  if (e.target.value) {
                                                    handleAddLingkungan(
                                                      assignmentIndex,
                                                      e.target.value
                                                    );
                                                    e.target.value = "";
                                                  }
                                                }}
                                                className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              >
                                                <option value="">
                                                  + Tambah Lingkungan
                                                </option>
                                                {availableLingkungan.map(
                                                  (ling, lingIndex) => (
                                                    <option
                                                      key={`${assignment.date}-${assignment.church}-${assignment.time}-${ling.namaLingkungan}-${ling.id}-${lingIndex}`}
                                                      value={
                                                        ling.namaLingkungan
                                                      }
                                                    >
                                                      {ling.namaLingkungan} (
                                                      {ling.jumlahTatib} tatib)
                                                    </option>
                                                  )
                                                )}
                                              </select>
                                            </div>
                                          );
                                        })()}
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
                  {[
                    "Sabtu 17:00",
                    "Minggu 08:00",
                    "Minggu 11:00",
                    "Minggu 17:00",
                  ].map((time) => (
                    <div key={time} className="flex items-center gap-4">
                      <label className="w-32 text-sm font-medium text-gray-700">
                        {time}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={minTatibConfig["St. Yakobus"]?.[time] ?? ""}
                        onChange={(e) => {
                          const newConfig = { ...minTatibConfig };
                          if (!newConfig["St. Yakobus"]) {
                            newConfig["St. Yakobus"] = {};
                          }
                          const value =
                            e.target.value === ""
                              ? ""
                              : parseInt(e.target.value);
                          newConfig["St. Yakobus"][time] = value;
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
                        value={minTatibConfig["Pegangsaan 2"]?.[time] ?? ""}
                        onChange={(e) => {
                          const newConfig = { ...minTatibConfig };
                          if (!newConfig["Pegangsaan 2"]) {
                            newConfig["Pegangsaan 2"] = {};
                          }
                          const value =
                            e.target.value === ""
                              ? ""
                              : parseInt(e.target.value);
                          newConfig["Pegangsaan 2"][time] = value;
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
                onClick={async () => {
                  try {
                    // Save config to database
                    const response = await fetch("/api/min-tatib-config", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ config: minTatibConfig }),
                    });

                    if (response.ok) {
                      // Regenerate assignments with new config
                      generateAssignments();
                      setShowMinTatibConfig(false);
                      alert("Konfigurasi minimum tatib telah tersimpan");
                    } else {
                      alert("Gagal menyimpan konfigurasi");
                    }
                  } catch (error) {
                    console.error("Error saving min tatib config:", error);
                    alert("Terjadi kesalahan saat menyimpan konfigurasi");
                  }
                }}
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
