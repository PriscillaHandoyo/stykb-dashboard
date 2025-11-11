"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Toast from "../components/Toast";

interface MassTime {
  time: string;
  minTatib: string;
  lingkungan?: string[];
}

interface ChurchSchedule {
  church: string;
  masses: MassTime[];
}

interface HolyDaySchedule {
  date: string;
  churches: ChurchSchedule[];
}

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

interface MassAssignment {
  church: string;
  time: string;
  minTatib: number;
  assignedLingkungan: AssignedLingkungan[];
  totalTatib: number;
}

export default function PaskahPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedSchedules, setSavedSchedules] = useState<{
    [key: string]: HolyDaySchedule;
  }>({});
  const [massAssignments, setMassAssignments] = useState<{
    [key: string]: MassAssignment[];
  }>({});
  const [editingHolyDays, setEditingHolyDays] = useState<{
    [key: string]: boolean;
  }>({
    rabuAbu: true,
    mingguPalma: true,
    kamisPutih: true,
    jumatAgung: true,
    sabtuSuci: true,
    mingguPaskah: true,
  });
  const [lingkunganData, setLingkunganData] = useState<LingkunganData[]>([]);
  const [paskahSchedule, setPaskahSchedule] = useState({
    mingguPalma: {
      date: "",
      churches: [
        { church: "St. Yakobus", masses: [{ time: "", minTatib: "" }] },
        { church: "Pegangsaan 2", masses: [{ time: "", minTatib: "" }] },
      ],
    },
    rabuAbu: {
      date: "",
      churches: [
        { church: "St. Yakobus", masses: [{ time: "", minTatib: "" }] },
        { church: "Pegangsaan 2", masses: [{ time: "", minTatib: "" }] },
      ],
    },
    kamisPutih: {
      date: "",
      churches: [
        { church: "St. Yakobus", masses: [{ time: "", minTatib: "" }] },
        { church: "Pegangsaan 2", masses: [{ time: "", minTatib: "" }] },
      ],
    },
    jumatAgung: {
      date: "",
      churches: [
        { church: "St. Yakobus", masses: [{ time: "", minTatib: "" }] },
        { church: "Pegangsaan 2", masses: [{ time: "", minTatib: "" }] },
      ],
    },
    sabtuSuci: {
      date: "",
      churches: [
        { church: "St. Yakobus", masses: [{ time: "", minTatib: "" }] },
        { church: "Pegangsaan 2", masses: [{ time: "", minTatib: "" }] },
      ],
    },
    mingguPaskah: {
      date: "",
      churches: [
        { church: "St. Yakobus", masses: [{ time: "", minTatib: "" }] },
        { church: "Pegangsaan 2", masses: [{ time: "", minTatib: "" }] },
      ],
    },
  });
  const [showFormFor, setShowFormFor] = useState<string | null>(null); // Track which holy day form is shown
  const [formData, setFormData] = useState<{
    date: string;
    stYakobus: {
      time: string;
      minTatib: string;
      assignedLingkungan: string[];
    }[];
    pegangsaan2: {
      time: string;
      minTatib: string;
      assignedLingkungan: string[];
    }[];
  }>({
    date: "",
    stYakobus: [{ time: "", minTatib: "", assignedLingkungan: [] }],
    pegangsaan2: [{ time: "", minTatib: "", assignedLingkungan: [] }],
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  const holyDayNames = {
    rabuAbu: "Rabu Abu",
    mingguPalma: "Minggu Palma",
    kamisPutih: "Kamis Putih",
    jumatAgung: "Jumat Agung",
    sabtuSuci: "Sabtu Suci",
    mingguPaskah: "Minggu Paskah",
  };

  useEffect(() => {
    loadLingkunganData();
    loadPaskahData();
  }, []);

  const loadLingkunganData = async () => {
    try {
      const response = await fetch("/api/lingkungan");
      const data = await response.json();
      setLingkunganData(data);
    } catch (error) {
      console.error("Error loading lingkungan data:", error);
    }
  };

  const loadPaskahData = async () => {
    try {
      const response = await fetch("/api/paskah");
      const data = await response.json();
      if (data.schedules && Object.keys(data.schedules).length > 0) {
        // Load saved schedules
        setSavedSchedules(data.schedules);

        // Load paskah schedule (the form data)
        Object.keys(data.schedules).forEach((key) => {
          setPaskahSchedule((prev) => ({
            ...prev,
            [key]: data.schedules[key],
          }));
        });

        // Set editing states to false for saved holy days
        const editingStates: { [key: string]: boolean } = {
          rabuAbu: true,
          mingguPalma: true,
          kamisPutih: true,
          jumatAgung: true,
          sabtuSuci: true,
          mingguPaskah: true,
        };
        Object.keys(data.schedules).forEach((key) => {
          editingStates[key] = false;
        });
        setEditingHolyDays(editingStates);
      }
      if (data.assignments && Object.keys(data.assignments).length > 0) {
        setMassAssignments(data.assignments);
      }
    } catch (error) {
      console.error("Error loading paskah data:", error);
    }
  };

  const savePaskahData = async (
    schedules: { [key: string]: HolyDaySchedule },
    assignments: { [key: string]: MassAssignment[] }
  ) => {
    try {
      await fetch("/api/paskah", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schedules, assignments }),
      });
    } catch (error) {
      console.error("Error saving paskah data:", error);
    }
  };

  const generateAllAssignments = (schedulesToUse?: {
    [key: string]: HolyDaySchedule;
  }) => {
    // Use provided schedules or fall back to state
    const schedules = schedulesToUse || savedSchedules;

    // Track which lingkungan have been assigned across all holy days
    const usedLingkungan = new Set<string>();
    const allAssignments: { [key: string]: MassAssignment[] } = {};

    // Process each holy day in order
    const holyDayKeys = [
      "rabuAbu",
      "mingguPalma",
      "kamisPutih",
      "jumatAgung",
      "sabtuSuci",
      "mingguPaskah",
    ];

    holyDayKeys.forEach((holyDayKey) => {
      // Skip if this holy day hasn't been saved yet
      if (!schedules[holyDayKey]) return;

      const holyDay = schedules[holyDayKey];
      const assignments: MassAssignment[] = [];

      holyDay.churches.forEach((church) => {
        church.masses.forEach((mass) => {
          if (mass.time) {
            const minTatib = parseInt(mass.minTatib) || 0;

            // Use manually assigned lingkungan if available, otherwise auto-generate
            let assignedLingkungan: AssignedLingkungan[];

            if (mass.lingkungan && mass.lingkungan.length > 0) {
              // Use manually assigned lingkungan
              assignedLingkungan = mass.lingkungan.map((lingName) => {
                const lingData = lingkunganData.find(
                  (l) => l.namaLingkungan === lingName
                );
                const tatib = lingData ? parseInt(lingData.jumlahTatib) : 0;
                return {
                  name: lingName,
                  tatib: tatib,
                };
              });
              // Mark these lingkungan as used
              assignedLingkungan.forEach((ling) =>
                usedLingkungan.add(ling.name)
              );
            } else {
              // Auto-generate assignments
              assignedLingkungan = assignLingkunganToMass(
                church.church,
                minTatib,
                usedLingkungan
              );
              // Mark these lingkungan as used
              assignedLingkungan.forEach((ling) =>
                usedLingkungan.add(ling.name)
              );
            }

            const totalTatib = assignedLingkungan.reduce(
              (sum, ling) => sum + ling.tatib,
              0
            );

            assignments.push({
              church: church.church,
              time: mass.time,
              minTatib,
              assignedLingkungan,
              totalTatib,
            });
          }
        });
      });

      allAssignments[holyDayKey] = assignments;
    });

    return allAssignments;
  };

  // Helper function to extract wilayah (area) from lingkungan name
  // e.g., "Agnes 2" -> "Agnes", "Maria 1" -> "Maria"
  const getWilayah = (namaLingkungan: string): string => {
    const match = namaLingkungan.match(/^(.+?)\s*\d+$/);
    return match ? match[1].trim() : namaLingkungan;
  };

  const assignLingkunganToMass = (
    church: string,
    minTatib: number,
    usedLingkungan: Set<string>
  ): AssignedLingkungan[] => {
    if (!minTatib || minTatib === 0) return [];

    const maxTatib = minTatib + 8;

    // Filter available lingkungan for this church that haven't been used yet
    const availableLingkungan = lingkunganData.filter((ling) => {
      // Skip if already used
      if (usedLingkungan.has(ling.namaLingkungan)) return false;

      // Check if lingkungan is available for this church (any day)
      const churchAvailability = ling.availability[church];
      if (!churchAvailability) return false;

      // Check if available on any day
      return Object.values(churchAvailability).some(
        (dayTimes) => dayTimes && dayTimes.length > 0
      );
    });

    const assigned: AssignedLingkungan[] = [];
    let currentTotal = 0;

    // Group lingkungan by wilayah
    const wilayahGroups: { [wilayah: string]: typeof availableLingkungan } = {};
    availableLingkungan.forEach((ling) => {
      const wilayah = getWilayah(ling.namaLingkungan);
      if (!wilayahGroups[wilayah]) {
        wilayahGroups[wilayah] = [];
      }
      wilayahGroups[wilayah].push(ling);
    });

    // Calculate total tatib per wilayah and sort wilayah by total tatib
    const wilayahTotals = Object.entries(wilayahGroups).map(
      ([wilayah, lings]) => ({
        wilayah,
        lingkungan: lings.sort(
          (a, b) => parseInt(b.jumlahTatib) - parseInt(a.jumlahTatib)
        ),
        totalTatib: lings.reduce((sum, l) => sum + parseInt(l.jumlahTatib), 0),
      })
    );

    // Sort wilayah by total tatib descending (prioritize wilayah with most tatib)
    wilayahTotals.sort((a, b) => b.totalTatib - a.totalTatib);

    // Try to assign from a single wilayah first
    for (const { wilayah, lingkungan } of wilayahTotals) {
      let wilayahTotal = 0;
      const wilayahAssigned: AssignedLingkungan[] = [];

      for (const ling of lingkungan) {
        const tatib = parseInt(ling.jumlahTatib);
        wilayahAssigned.push({
          name: ling.namaLingkungan,
          tatib: tatib,
        });
        wilayahTotal += tatib;
        usedLingkungan.add(ling.namaLingkungan);

        if (wilayahTotal >= minTatib || wilayahTotal >= maxTatib) {
          break;
        }
      }

      // If this wilayah can meet the requirement, use it
      if (wilayahTotal >= minTatib) {
        return wilayahAssigned;
      }

      // Otherwise, revert (remove from usedLingkungan) and try next wilayah
      wilayahAssigned.forEach((a) => usedLingkungan.delete(a.name));
    }

    // If no single wilayah can meet the requirement, assign from any available
    const sortedLingkungan = [...availableLingkungan].sort(
      (a, b) => parseInt(b.jumlahTatib) - parseInt(a.jumlahTatib)
    );

    for (const ling of sortedLingkungan) {
      if (currentTotal >= minTatib || currentTotal >= maxTatib) break;
      if (usedLingkungan.has(ling.namaLingkungan)) continue;

      const tatib = parseInt(ling.jumlahTatib);
      assigned.push({
        name: ling.namaLingkungan,
        tatib: tatib,
      });
      currentTotal += tatib;
      usedLingkungan.add(ling.namaLingkungan);
    }

    return assigned;
  };

  const handleDateChange = (holyDay: string, date: string) => {
    setPaskahSchedule((prev) => ({
      ...prev,
      [holyDay]: {
        ...prev[holyDay as keyof typeof prev],
        date,
      },
    }));
  };

  const handleTimeChange = (
    holyDay: string,
    churchIndex: number,
    massIndex: number,
    time: string
  ) => {
    setPaskahSchedule((prev) => {
      const updated = { ...prev };
      const day = updated[holyDay as keyof typeof updated];
      day.churches[churchIndex].masses[massIndex].time = time;
      return updated;
    });
  };

  const handleMinTatibChange = (
    holyDay: string,
    churchIndex: number,
    massIndex: number,
    minTatib: string
  ) => {
    setPaskahSchedule((prev) => {
      const updated = { ...prev };
      const day = updated[holyDay as keyof typeof updated];

      // Create a deep copy to avoid mutation
      const updatedChurches = day.churches.map((church, cIdx) => {
        if (cIdx === churchIndex) {
          return {
            ...church,
            masses: church.masses.map((mass, mIdx) => {
              if (mIdx === massIndex) {
                return { ...mass, minTatib };
              }
              return mass;
            }),
          };
        }
        return church;
      });

      return {
        ...updated,
        [holyDay]: {
          ...day,
          churches: updatedChurches,
        },
      };
    });
  };

  const addMassTime = (holyDay: string, churchIndex: number) => {
    setPaskahSchedule((prev) => {
      const updated = { ...prev };
      const day = updated[holyDay as keyof typeof updated];
      // Create a deep copy of the churches array and masses
      const updatedChurches = day.churches.map((church, idx) => {
        if (idx === churchIndex) {
          return {
            ...church,
            masses: [...church.masses, { time: "", minTatib: "" }],
          };
        }
        return church;
      });
      return {
        ...updated,
        [holyDay]: {
          ...day,
          churches: updatedChurches,
        },
      };
    });
  };

  const removeMassTime = (
    holyDay: string,
    churchIndex: number,
    massIndex: number
  ) => {
    setPaskahSchedule((prev) => {
      const updated = { ...prev };
      const day = updated[holyDay as keyof typeof updated];
      if (day.churches[churchIndex].masses.length > 1) {
        day.churches[churchIndex].masses.splice(massIndex, 1);
      }
      return updated;
    });
  };

  const handleSaveHolyDay = (holyDayKey: string) => {
    const holyDay = paskahSchedule[holyDayKey as keyof typeof paskahSchedule];

    // Validate that date is set
    if (!holyDay.date) {
      setToast({
        message: `Mohon isi tanggal untuk ${getHolyDayName(holyDayKey)}`,
        type: "warning",
      });
      return;
    }

    // Validate that at least one mass has a time
    const hasAnyMass = holyDay.churches.some((church) =>
      church.masses.some((mass) => mass.time)
    );

    if (!hasAnyMass) {
      setToast({
        message: `Mohon isi setidaknya satu waktu misa untuk ${getHolyDayName(
          holyDayKey
        )}`,
        type: "warning",
      });
      return;
    }

    // Save the schedule
    const updatedSchedules = {
      ...savedSchedules,
      [holyDayKey]: holyDay,
    };
    setSavedSchedules(updatedSchedules);

    // Regenerate ALL assignments to maintain global uniqueness
    const allAssignments = generateAllAssignments(updatedSchedules);
    setMassAssignments(allAssignments);

    // Save to JSON file
    savePaskahData(updatedSchedules, allAssignments);

    console.log("Saved schedules:", updatedSchedules);
    console.log("Generated all assignments:", allAssignments);

    // Set editing to false to show the table
    setEditingHolyDays((prev) => ({
      ...prev,
      [holyDayKey]: false,
    }));

    setToast({
      message: `Jadwal ${getHolyDayName(holyDayKey)} berhasil disimpan!`,
      type: "success",
    });
  };

  const handleRegenerateHolyDay = (holyDayKey: string) => {
    // Get the saved schedule for this holy day
    const schedule = savedSchedules[holyDayKey];

    if (schedule) {
      // Populate the form with existing data including assigned lingkungan
      const stYakobusData = schedule.churches.find(
        (c) => c.church === "St. Yakobus"
      );
      const pegangsaan2Data = schedule.churches.find(
        (c) => c.church === "Pegangsaan 2"
      );

      setFormData({
        date: schedule.date,
        stYakobus: stYakobusData?.masses.map((m) => ({
          time: m.time,
          minTatib: m.minTatib,
          assignedLingkungan: m.lingkungan || [],
        })) || [{ time: "", minTatib: "", assignedLingkungan: [] }],
        pegangsaan2: pegangsaan2Data?.masses.map((m) => ({
          time: m.time,
          minTatib: m.minTatib,
          assignedLingkungan: m.lingkungan || [],
        })) || [{ time: "", minTatib: "", assignedLingkungan: [] }],
      });
    }

    setShowFormFor(holyDayKey);
  };

  const getHolyDayName = (key: string) => {
    const names: { [key: string]: string } = {
      rabuAbu: "Rabu Abu",
      mingguPalma: "Minggu Palma",
      kamisPutih: "Kamis Putih",
      jumatAgung: "Jumat Agung",
      sabtuSuci: "Sabtu Suci",
      mingguPaskah: "Minggu Paskah",
    };
    return names[key] || key;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const renderAssignmentTable = (holyDayKey: string, holyDayName: string) => {
    const schedule = savedSchedules[holyDayKey];
    const assignments = massAssignments[holyDayKey];

    console.log(`Rendering ${holyDayKey}:`, { schedule, assignments });

    if (!schedule || !assignments || assignments.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">
            {holyDayName} ({formatDate(schedule.date)})
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                // Reset form to blank
                setFormData({
                  date: "",
                  stYakobus: [
                    { time: "", minTatib: "", assignedLingkungan: [] },
                  ],
                  pegangsaan2: [
                    { time: "", minTatib: "", assignedLingkungan: [] },
                  ],
                });
                setShowFormFor(holyDayKey);
              }}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
            >
              Form
            </button>
            <button
              type="button"
              onClick={() => handleRegenerateHolyDay(holyDayKey)}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
            >
              Edit
            </button>
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
          <div className="inline-block min-w-full align-middle px-4 sm:px-6 lg:px-0">
            <table className="min-w-full border-collapse bg-white shadow-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                    Gereja
                  </th>
                  <th className="border border-gray-200 py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                    Waktu
                  </th>
                  <th className="border border-gray-200 py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-semibold text-gray-700 hidden md:table-cell">
                    Min Tatib
                  </th>
                  <th className="border border-gray-200 py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                    Lingkungan
                  </th>
                  <th className="border border-gray-200 py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                    Total Tatib
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border border-gray-200 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900">
                      {assignment.church}
                    </td>
                    <td className="border border-gray-200 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900">
                      {formatTime(assignment.time)}
                    </td>
                    <td className="border border-gray-200 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900 hidden md:table-cell">
                      {assignment.minTatib}
                    </td>
                    <td className="border border-gray-200 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                      {assignment.assignedLingkungan.length === 0 ? (
                        <span className="text-gray-400">
                          Tidak ada lingkungan tersedia
                        </span>
                      ) : (
                        <div className="space-y-1">
                          {assignment.assignedLingkungan.map(
                            (ling, lingIdx) => (
                              <div key={lingIdx} className="text-gray-900">
                                {ling.name}
                                <span className="text-xs text-gray-500 ml-1 sm:ml-2">
                                  ({ling.tatib} tatib)
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-200 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          assignment.totalTatib >= assignment.minTatib
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {assignment.totalTatib} tatib
                        {assignment.totalTatib < assignment.minTatib && " ⚠️"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
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
    const month = months[date.getMonth()];
    return `${day} ${month}`;
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    return timeString;
  };

  const renderBlankForm = (holyDayKey: string) => {
    return (
      <div>
        {/* Date Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-500"
            placeholder="Pilih tanggal"
          />
        </div>

        {/* St. Yakobus */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            St. Yakobus
          </h3>

          {formData.stYakobus.map((mass, index) => (
            <div key={index} className="flex gap-3 items-start mb-3">
              <label className="text-sm font-medium text-gray-700 mt-3 min-w-[80px]">
                Misa {index + 1}:
              </label>
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="time"
                  value={mass.time}
                  onChange={(e) => {
                    const newMasses = [...formData.stYakobus];
                    newMasses[index].time = e.target.value;
                    setFormData({ ...formData, stYakobus: newMasses });
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-500"
                  placeholder="Pilih waktu"
                />
                <div className="flex gap-2 items-center">
                  <label className="text-sm font-medium text-gray-700">
                    Min Tatib:
                  </label>
                  <input
                    type="number"
                    value={mass.minTatib}
                    onChange={(e) => {
                      const newMasses = [...formData.stYakobus];
                      newMasses[index].minTatib = e.target.value;
                      setFormData({ ...formData, stYakobus: newMasses });
                    }}
                    min="0"
                    placeholder="0"
                    className="w-24 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-500"
                  />
                </div>

                {/* Lingkungan Assignment */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Lingkungan yang Bertugas:
                  </label>
                  <div className="flex gap-2">
                    <select
                      value=""
                      onChange={(e) => {
                        if (
                          e.target.value &&
                          !mass.assignedLingkungan.includes(e.target.value)
                        ) {
                          const newMasses = [...formData.stYakobus];
                          newMasses[index].assignedLingkungan = [
                            ...newMasses[index].assignedLingkungan,
                            e.target.value,
                          ];
                          setFormData({ ...formData, stYakobus: newMasses });
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900"
                    >
                      <option value="">-- Pilih Lingkungan --</option>
                      {lingkunganData.map((ling) => (
                        <option key={ling.id} value={ling.namaLingkungan}>
                          {ling.namaLingkungan} ({ling.jumlahTatib} tatib)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Lingkungan */}
                  {mass.assignedLingkungan.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {mass.assignedLingkungan.map((lingName, lingIndex) => {
                        const lingData = lingkunganData.find(
                          (l) => l.namaLingkungan === lingName
                        );
                        return (
                          <div
                            key={lingIndex}
                            className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            <span>
                              {lingName} ({lingData?.jumlahTatib || 0} tatib)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newMasses = [...formData.stYakobus];
                                newMasses[index].assignedLingkungan = newMasses[
                                  index
                                ].assignedLingkungan.filter(
                                  (_, i) => i !== lingIndex
                                );
                                setFormData({
                                  ...formData,
                                  stYakobus: newMasses,
                                });
                              }}
                              className="text-blue-600 hover:text-blue-800 font-bold"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Total Tatib Display */}
                  {mass.assignedLingkungan.length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      Total Tatib:{" "}
                      {mass.assignedLingkungan.reduce((sum, lingName) => {
                        const lingData = lingkunganData.find(
                          (l) => l.namaLingkungan === lingName
                        );
                        return sum + parseInt(lingData?.jumlahTatib || "0");
                      }, 0)}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (formData.stYakobus.length > 1) {
                    const newMasses = formData.stYakobus.filter(
                      (_, i) => i !== index
                    );
                    setFormData({ ...formData, stYakobus: newMasses });
                  }
                }}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors mt-3"
                disabled={formData.stYakobus.length === 1}
              >
                Hapus
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              setFormData({
                ...formData,
                stYakobus: [
                  ...formData.stYakobus,
                  { time: "", minTatib: "", assignedLingkungan: [] },
                ],
              });
            }}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
          >
            + Tambah Waktu Misa
          </button>
        </div>

        {/* Pegangsaan 2 */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Pegangsaan 2
          </h3>

          {formData.pegangsaan2.map((mass, index) => (
            <div key={index} className="flex gap-3 items-start mb-3">
              <label className="text-sm font-medium text-gray-700 mt-3 min-w-[80px]">
                Misa {index + 1}:
              </label>
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="time"
                  value={mass.time}
                  onChange={(e) => {
                    const newMasses = [...formData.pegangsaan2];
                    newMasses[index].time = e.target.value;
                    setFormData({ ...formData, pegangsaan2: newMasses });
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-500"
                  placeholder="Pilih waktu"
                />
                <div className="flex gap-2 items-center">
                  <label className="text-sm font-medium text-gray-700">
                    Min Tatib:
                  </label>
                  <input
                    type="number"
                    value={mass.minTatib}
                    onChange={(e) => {
                      const newMasses = [...formData.pegangsaan2];
                      newMasses[index].minTatib = e.target.value;
                      setFormData({ ...formData, pegangsaan2: newMasses });
                    }}
                    min="0"
                    placeholder="0"
                    className="w-24 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-500"
                  />
                </div>

                {/* Lingkungan Assignment */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Lingkungan yang Bertugas:
                  </label>
                  <div className="flex gap-2">
                    <select
                      value=""
                      onChange={(e) => {
                        if (
                          e.target.value &&
                          !mass.assignedLingkungan.includes(e.target.value)
                        ) {
                          const newMasses = [...formData.pegangsaan2];
                          newMasses[index].assignedLingkungan = [
                            ...newMasses[index].assignedLingkungan,
                            e.target.value,
                          ];
                          setFormData({ ...formData, pegangsaan2: newMasses });
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900"
                    >
                      <option value="">-- Pilih Lingkungan --</option>
                      {lingkunganData.map((ling) => (
                        <option key={ling.id} value={ling.namaLingkungan}>
                          {ling.namaLingkungan} ({ling.jumlahTatib} tatib)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Lingkungan */}
                  {mass.assignedLingkungan.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {mass.assignedLingkungan.map((lingName, lingIndex) => {
                        const lingData = lingkunganData.find(
                          (l) => l.namaLingkungan === lingName
                        );
                        return (
                          <div
                            key={lingIndex}
                            className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            <span>
                              {lingName} ({lingData?.jumlahTatib || 0} tatib)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newMasses = [...formData.pegangsaan2];
                                newMasses[index].assignedLingkungan = newMasses[
                                  index
                                ].assignedLingkungan.filter(
                                  (_, i) => i !== lingIndex
                                );
                                setFormData({
                                  ...formData,
                                  pegangsaan2: newMasses,
                                });
                              }}
                              className="text-blue-600 hover:text-blue-800 font-bold"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Total Tatib Display */}
                  {mass.assignedLingkungan.length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      Total Tatib:{" "}
                      {mass.assignedLingkungan.reduce((sum, lingName) => {
                        const lingData = lingkunganData.find(
                          (l) => l.namaLingkungan === lingName
                        );
                        return sum + parseInt(lingData?.jumlahTatib || "0");
                      }, 0)}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (formData.pegangsaan2.length > 1) {
                    const newMasses = formData.pegangsaan2.filter(
                      (_, i) => i !== index
                    );
                    setFormData({ ...formData, pegangsaan2: newMasses });
                  }
                }}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors mt-3"
                disabled={formData.pegangsaan2.length === 1}
              >
                Hapus
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              setFormData({
                ...formData,
                pegangsaan2: [
                  ...formData.pegangsaan2,
                  { time: "", minTatib: "", assignedLingkungan: [] },
                ],
              });
            }}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
          >
            + Tambah Waktu Misa
          </button>
        </div>
      </div>
    );
  };

  const renderHolyDaySection = (
    title: string,
    holyDayKey: string,
    holyDay: HolyDaySchedule
  ) => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>

        {/* Date Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal
          </label>
          <input
            type="date"
            value={holyDay.date}
            onChange={(e) => handleDateChange(holyDayKey, e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-500"
            required
          />
        </div>

        {/* Church Schedules */}
        {holyDay.churches.map((church, churchIndex) => (
          <div key={churchIndex} className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              {church.church}
            </h3>

            {/* Mass Times */}
            {church.masses.map((mass, massIndex) => (
              <div key={massIndex} className="flex gap-3 items-start">
                <label className="text-sm font-medium text-gray-700 mt-3 min-w-[80px]">
                  Misa {massIndex + 1}:
                </label>
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="time"
                    value={mass.time}
                    onChange={(e) =>
                      handleTimeChange(
                        holyDayKey,
                        churchIndex,
                        massIndex,
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-500"
                    required
                  />
                  <div className="flex gap-2 items-center">
                    <label className="text-sm font-medium text-gray-700">
                      Min Tatib:
                    </label>
                    <input
                      type="number"
                      value={mass.minTatib}
                      onChange={(e) =>
                        handleMinTatibChange(
                          holyDayKey,
                          churchIndex,
                          massIndex,
                          e.target.value
                        )
                      }
                      min="0"
                      placeholder="0"
                      className="w-24 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    removeMassTime(holyDayKey, churchIndex, massIndex)
                  }
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors mt-3"
                  disabled={church.masses.length === 1}
                >
                  Hapus
                </button>
              </div>
            ))}

            {/* Add Mass Time Button */}
            <button
              type="button"
              onClick={() => addMassTime(holyDayKey, churchIndex)}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              + Tambah Waktu Misa
            </button>
          </div>
        ))}

        {/* Save Button for this Holy Day */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => handleSaveHolyDay(holyDayKey)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Simpan {title}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
            className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium"
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
              A
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Admin</div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-56">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="ml-12 lg:ml-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Paskah
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Kegiatan dan perayaan Paskah
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-gray-400 hover:text-gray-600">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    Welcome back, Admin!
                  </span>
                  <Link
                    href="/login"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Logout
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
              Jadwal Perayaan Paskah
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Rabu Abu */}
              {editingHolyDays.rabuAbu
                ? renderHolyDaySection(
                    "Rabu Abu",
                    "rabuAbu",
                    paskahSchedule.rabuAbu
                  )
                : renderAssignmentTable("rabuAbu", "Rabu Abu")}

              {/* Minggu Palma */}
              {editingHolyDays.mingguPalma
                ? renderHolyDaySection(
                    "Minggu Palma",
                    "mingguPalma",
                    paskahSchedule.mingguPalma
                  )
                : renderAssignmentTable("mingguPalma", "Minggu Palma")}

              {/* Kamis Putih */}
              {editingHolyDays.kamisPutih
                ? renderHolyDaySection(
                    "Kamis Putih",
                    "kamisPutih",
                    paskahSchedule.kamisPutih
                  )
                : renderAssignmentTable("kamisPutih", "Kamis Putih")}

              {/* Jumat Agung */}
              {editingHolyDays.jumatAgung
                ? renderHolyDaySection(
                    "Jumat Agung",
                    "jumatAgung",
                    paskahSchedule.jumatAgung
                  )
                : renderAssignmentTable("jumatAgung", "Jumat Agung")}

              {/* Sabtu Suci */}
              {editingHolyDays.sabtuSuci
                ? renderHolyDaySection(
                    "Sabtu Suci",
                    "sabtuSuci",
                    paskahSchedule.sabtuSuci
                  )
                : renderAssignmentTable("sabtuSuci", "Sabtu Suci")}

              {/* Minggu Paskah */}
              {editingHolyDays.mingguPaskah
                ? renderHolyDaySection(
                    "Minggu Paskah",
                    "mingguPaskah",
                    paskahSchedule.mingguPaskah
                  )
                : renderAssignmentTable("mingguPaskah", "Minggu Paskah")}
            </form>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showFormFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {holyDayNames[showFormFor as keyof typeof holyDayNames]} - Form
              </h2>
              <button
                onClick={() => {
                  setShowFormFor(null);
                  // Reset form data
                  setFormData({
                    date: "",
                    stYakobus: [
                      { time: "", minTatib: "", assignedLingkungan: [] },
                    ],
                    pegangsaan2: [
                      { time: "", minTatib: "", assignedLingkungan: [] },
                    ],
                  });
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {renderBlankForm(showFormFor)}

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowFormFor(null);
                    // Reset form data
                    setFormData({
                      date: "",
                      stYakobus: [
                        { time: "", minTatib: "", assignedLingkungan: [] },
                      ],
                      pegangsaan2: [
                        { time: "", minTatib: "", assignedLingkungan: [] },
                      ],
                    });
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Update paskahSchedule with form data
                    const updatedSchedule = {
                      date: formData.date,
                      churches: [
                        {
                          church: "St. Yakobus",
                          masses: formData.stYakobus.map((m) => ({
                            time: m.time,
                            minTatib: m.minTatib || "0",
                            lingkungan: m.assignedLingkungan || [],
                          })),
                        },
                        {
                          church: "Pegangsaan 2",
                          masses: formData.pegangsaan2.map((m) => ({
                            time: m.time,
                            minTatib: m.minTatib || "0",
                            lingkungan: m.assignedLingkungan || [],
                          })),
                        },
                      ],
                    };

                    setPaskahSchedule((prev) => ({
                      ...prev,
                      [showFormFor]: updatedSchedule,
                    }));

                    // Update savedSchedules
                    const updatedSchedules = {
                      ...savedSchedules,
                      [showFormFor]: updatedSchedule,
                    };
                    setSavedSchedules(updatedSchedules);

                    // Regenerate ALL assignments to maintain global uniqueness
                    const allAssignments =
                      generateAllAssignments(updatedSchedules);
                    setMassAssignments(allAssignments);

                    // Save to database
                    savePaskahData(updatedSchedules, allAssignments);

                    setToast({
                      message: `Jadwal ${
                        holyDayNames[showFormFor as keyof typeof holyDayNames]
                      } berhasil disimpan!`,
                      type: "success",
                    });

                    setShowFormFor(null);
                    // Reset form data
                    setFormData({
                      date: "",
                      stYakobus: [
                        { time: "", minTatib: "", assignedLingkungan: [] },
                      ],
                      pegangsaan2: [
                        { time: "", minTatib: "", assignedLingkungan: [] },
                      ],
                    });
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
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
