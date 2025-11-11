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

interface CelebrationSchedule {
  name: string;
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

interface CelebrationWithAssignments {
  name: string;
  date: string;
  churches: ChurchSchedule[];
  assignments: MassAssignment[];
}

export default function MisaLainnyaPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedCelebrations, setSavedCelebrations] = useState<
    CelebrationWithAssignments[]
  >([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [lingkunganData, setLingkunganData] = useState<LingkunganData[]>([]);
  const [newCelebration, setNewCelebration] = useState<CelebrationSchedule>({
    name: "",
    date: "",
    churches: [
      {
        church: "St. Yakobus",
        masses: [{ time: "", minTatib: "", lingkungan: [] }],
      },
      {
        church: "Pegangsaan 2",
        masses: [{ time: "", minTatib: "", lingkungan: [] }],
      },
    ],
  });
  const [editingCelebration, setEditingCelebration] =
    useState<CelebrationSchedule>({
      name: "",
      date: "",
      churches: [
        {
          church: "St. Yakobus",
          masses: [{ time: "", minTatib: "", lingkungan: [] }],
        },
        {
          church: "Pegangsaan 2",
          masses: [{ time: "", minTatib: "", lingkungan: [] }],
        },
      ],
    });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  useEffect(() => {
    loadLingkunganData();
    loadMisaLainnyaData();
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

  const loadMisaLainnyaData = async () => {
    try {
      const response = await fetch("/api/misa-lainnya");
      const data = await response.json();
      if (data.celebrations && data.celebrations.length > 0) {
        setSavedCelebrations(data.celebrations);
      }
    } catch (error) {
      console.error("Error loading misa lainnya data:", error);
    }
  };

  const saveMisaLainnyaData = async (
    celebrations: CelebrationWithAssignments[]
  ) => {
    try {
      await fetch("/api/misa-lainnya", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ celebrations }),
      });
    } catch (error) {
      console.error("Error saving misa lainnya data:", error);
    }
  };

  const generateAllAssignments = (
    celebrationsToUse?: CelebrationWithAssignments[]
  ) => {
    // Use provided celebrations or fall back to state
    const celebrations = celebrationsToUse || savedCelebrations;

    // Track which lingkungan have been assigned across all celebrations
    const usedLingkungan = new Set<string>();
    const allCelebrations: CelebrationWithAssignments[] = [];

    celebrations.forEach((celebration) => {
      const assignments: MassAssignment[] = [];

      celebration.churches.forEach((church) => {
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

      allCelebrations.push({
        name: celebration.name,
        date: celebration.date,
        churches: celebration.churches,
        assignments,
      });
    });

    return allCelebrations;
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

  const handleCelebrationNameChange = (name: string) => {
    setNewCelebration((prev) => ({ ...prev, name }));
  };

  const handleDateChange = (date: string) => {
    setNewCelebration((prev) => ({ ...prev, date }));
  };

  const handleMassTimeChange = (
    churchIndex: number,
    massIndex: number,
    time: string
  ) => {
    setNewCelebration((prev) => {
      const updated = { ...prev };
      const updatedChurches = updated.churches.map((church, cIdx) => {
        if (cIdx === churchIndex) {
          return {
            ...church,
            masses: church.masses.map((mass, mIdx) => {
              if (mIdx === massIndex) {
                return { ...mass, time };
              }
              return mass;
            }),
          };
        }
        return church;
      });

      return { ...updated, churches: updatedChurches };
    });
  };

  const handleMinTatibChange = (
    churchIndex: number,
    massIndex: number,
    minTatib: string
  ) => {
    setNewCelebration((prev) => {
      const updated = { ...prev };
      const updatedChurches = updated.churches.map((church, cIdx) => {
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

      return { ...updated, churches: updatedChurches };
    });
  };

  const addMassTime = (churchIndex: number) => {
    setNewCelebration((prev) => {
      const updated = { ...prev };
      const updatedChurches = updated.churches.map((church, idx) => {
        if (idx === churchIndex) {
          return {
            ...church,
            masses: [
              ...church.masses,
              { time: "", minTatib: "", lingkungan: [] },
            ],
          };
        }
        return church;
      });
      return { ...updated, churches: updatedChurches };
    });
  };

  const removeMassTime = (churchIndex: number, massIndex: number) => {
    setNewCelebration((prev) => {
      const updated = { ...prev };
      const updatedChurches = updated.churches.map((church, cIdx) => {
        if (cIdx === churchIndex) {
          if (church.masses.length > 1) {
            return {
              ...church,
              masses: church.masses.filter((_, mIdx) => mIdx !== massIndex),
            };
          }
        }
        return church;
      });
      return { ...updated, churches: updatedChurches };
    });
  };

  const handleSaveNewCelebration = () => {
    if (!newCelebration.name.trim()) {
      setToast({ message: "Mohon isi nama perayaan", type: "warning" });
      return;
    }

    if (!newCelebration.date) {
      setToast({ message: "Mohon isi tanggal perayaan", type: "warning" });
      return;
    }

    const hasAnyMass = newCelebration.churches.some((church) =>
      church.masses.some((mass) => mass.time)
    );

    if (!hasAnyMass) {
      setToast({
        message: "Mohon isi setidaknya satu waktu misa",
        type: "warning",
      });
      return;
    }

    // Add the new celebration to the list
    const updatedCelebrationsTemp = [
      ...savedCelebrations,
      {
        name: newCelebration.name,
        date: newCelebration.date,
        churches: newCelebration.churches,
        assignments: [], // Temporary empty assignments
      },
    ];

    // Regenerate ALL assignments to maintain global uniqueness
    const updatedCelebrations = generateAllAssignments(updatedCelebrationsTemp);

    setSavedCelebrations(updatedCelebrations);
    saveMisaLainnyaData(updatedCelebrations);

    // Reset form
    setNewCelebration({
      name: "",
      date: "",
      churches: [
        {
          church: "St. Yakobus",
          masses: [{ time: "", minTatib: "", lingkungan: [] }],
        },
        {
          church: "Pegangsaan 2",
          masses: [{ time: "", minTatib: "", lingkungan: [] }],
        },
      ],
    });
    setShowNewForm(false);

    setToast({
      message: `Jadwal ${newCelebration.name} berhasil disimpan!`,
      type: "success",
    });
  };

  const handleRegenerateCelebration = (index: number) => {
    const celebration = savedCelebrations[index];
    // Set editing state and populate form with existing data including lingkungan
    setEditingIndex(index);
    setEditingCelebration({
      name: celebration.name,
      date: celebration.date,
      churches: celebration.churches.map((church) => ({
        church: church.church,
        masses: church.masses.map((mass) => ({
          time: mass.time,
          minTatib: mass.minTatib,
          lingkungan: mass.lingkungan || [],
        })),
      })),
    });
  };

  const handleEditingCelebrationNameChange = (name: string) => {
    setEditingCelebration((prev) => ({ ...prev, name }));
  };

  const handleEditingDateChange = (date: string) => {
    setEditingCelebration((prev) => ({ ...prev, date }));
  };

  const handleEditingMassTimeChange = (
    churchIndex: number,
    massIndex: number,
    time: string
  ) => {
    setEditingCelebration((prev) => {
      const updated = { ...prev };
      const updatedChurches = updated.churches.map((church, cIdx) => {
        if (cIdx === churchIndex) {
          return {
            ...church,
            masses: church.masses.map((mass, mIdx) => {
              if (mIdx === massIndex) {
                return { ...mass, time };
              }
              return mass;
            }),
          };
        }
        return church;
      });

      return { ...updated, churches: updatedChurches };
    });
  };

  const handleEditingMinTatibChange = (
    churchIndex: number,
    massIndex: number,
    minTatib: string
  ) => {
    setEditingCelebration((prev) => {
      const updated = { ...prev };
      const updatedChurches = updated.churches.map((church, cIdx) => {
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

      return { ...updated, churches: updatedChurches };
    });
  };

  const addEditingMassTime = (churchIndex: number) => {
    setEditingCelebration((prev) => {
      const updated = { ...prev };
      const updatedChurches = updated.churches.map((church, idx) => {
        if (idx === churchIndex) {
          return {
            ...church,
            masses: [
              ...church.masses,
              { time: "", minTatib: "", lingkungan: [] },
            ],
          };
        }
        return church;
      });
      return { ...updated, churches: updatedChurches };
    });
  };

  const removeEditingMassTime = (churchIndex: number, massIndex: number) => {
    setEditingCelebration((prev) => {
      const updated = { ...prev };
      const updatedChurches = updated.churches.map((church, cIdx) => {
        if (cIdx === churchIndex) {
          if (church.masses.length > 1) {
            return {
              ...church,
              masses: church.masses.filter((_, mIdx) => mIdx !== massIndex),
            };
          }
        }
        return church;
      });
      return { ...updated, churches: updatedChurches };
    });
  };

  const handleSaveEditedCelebration = () => {
    if (editingIndex === null) return;

    if (!editingCelebration.name.trim()) {
      setToast({ message: "Mohon isi nama perayaan", type: "warning" });
      return;
    }

    if (!editingCelebration.date) {
      setToast({ message: "Mohon isi tanggal perayaan", type: "warning" });
      return;
    }

    const hasAnyMass = editingCelebration.churches.some((church) =>
      church.masses.some((mass) => mass.time)
    );

    if (!hasAnyMass) {
      setToast({
        message: "Mohon isi setidaknya satu waktu misa",
        type: "warning",
      });
      return;
    }

    // Update the celebration in the list
    const updatedCelebrationsTemp = savedCelebrations.map((cel, idx) => {
      if (idx === editingIndex) {
        return {
          name: editingCelebration.name,
          date: editingCelebration.date,
          churches: editingCelebration.churches,
          assignments: [], // Temporary empty assignments
        };
      }
      return cel;
    });

    // Regenerate ALL assignments to maintain global uniqueness
    const updatedCelebrations = generateAllAssignments(updatedCelebrationsTemp);

    setSavedCelebrations(updatedCelebrations);
    saveMisaLainnyaData(updatedCelebrations);

    // Reset editing state
    setEditingIndex(null);
    setEditingCelebration({
      name: "",
      date: "",
      churches: [
        { church: "St. Yakobus", masses: [{ time: "", minTatib: "" }] },
        { church: "Pegangsaan 2", masses: [{ time: "", minTatib: "" }] },
      ],
    });

    setToast({
      message: `Jadwal ${editingCelebration.name} berhasil diupdate!`,
      type: "success",
    });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingCelebration({
      name: "",
      date: "",
      churches: [
        { church: "St. Yakobus", masses: [{ time: "", minTatib: "" }] },
        { church: "Pegangsaan 2", masses: [{ time: "", minTatib: "" }] },
      ],
    });
  };

  const handleDeleteCelebration = (index: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus perayaan ini?")) {
      const updatedCelebrations = savedCelebrations.filter(
        (_, idx) => idx !== index
      );
      setSavedCelebrations(updatedCelebrations);
      saveMisaLainnyaData(updatedCelebrations);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Misa Lainnya
          </Link>
        </nav>

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
      <main className="flex-1 lg:ml-56">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex items-center justify-between">
              <div className="ml-12 lg:ml-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Misa Lainnya
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Kelola perayaan khusus dan penugasan tatib
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-gray-400 hover:text-gray-600">
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
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Display all saved celebrations */}
          {savedCelebrations.map((celebration, celebrationIndex) => (
            <div
              key={celebrationIndex}
              className="mb-8 bg-white rounded-lg shadow-md overflow-hidden"
            >
              {editingIndex === celebrationIndex ? (
                // Edit Form
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Edit {celebration.name}
                  </h2>

                  <form onSubmit={handleSubmit}>
                    {/* Celebration Name */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nama Perayaan
                      </label>
                      <input
                        type="text"
                        value={editingCelebration.name}
                        onChange={(e) =>
                          handleEditingCelebrationNameChange(e.target.value)
                        }
                        placeholder="Contoh: Pesta Santo Petrus dan Paulus"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-500"
                        required
                      />
                    </div>

                    {/* Date */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tanggal
                      </label>
                      <input
                        type="date"
                        value={editingCelebration.date}
                        onChange={(e) =>
                          handleEditingDateChange(e.target.value)
                        }
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900"
                        required
                      />
                    </div>

                    {/* Churches and Masses */}
                    {editingCelebration.churches.map((church, churchIndex) => (
                      <div
                        key={churchIndex}
                        className="mb-6 p-4 bg-gray-50 rounded-lg"
                      >
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                          {church.church}
                        </h3>
                        {church.masses.map((mass, massIndex) => (
                          <div
                            key={massIndex}
                            className="flex gap-3 items-start"
                          >
                            <label className="text-sm font-medium text-gray-700 mt-3 min-w-[80px]">
                              Misa {massIndex + 1}:
                            </label>
                            <div className="flex-1 flex flex-col gap-2">
                              <input
                                type="time"
                                value={mass.time}
                                onChange={(e) =>
                                  handleEditingMassTimeChange(
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
                                    handleEditingMinTatibChange(
                                      churchIndex,
                                      massIndex,
                                      e.target.value
                                    )
                                  }
                                  min="0"
                                  step="1"
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
                                    onChange={(e) => {
                                      if (
                                        e.target.value &&
                                        !(mass.lingkungan || []).includes(
                                          e.target.value
                                        )
                                      ) {
                                        setEditingCelebration((prev) => {
                                          const updated = { ...prev };
                                          const updatedChurches =
                                            updated.churches.map((ch, cIdx) => {
                                              if (cIdx === churchIndex) {
                                                return {
                                                  ...ch,
                                                  masses: ch.masses.map(
                                                    (m, mIdx) => {
                                                      if (mIdx === massIndex) {
                                                        return {
                                                          ...m,
                                                          lingkungan: [
                                                            ...(m.lingkungan ||
                                                              []),
                                                            e.target.value,
                                                          ],
                                                        };
                                                      }
                                                      return m;
                                                    }
                                                  ),
                                                };
                                              }
                                              return ch;
                                            });
                                          return {
                                            ...updated,
                                            churches: updatedChurches,
                                          };
                                        });
                                        e.target.value = "";
                                      }
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900"
                                  >
                                    <option value="">
                                      -- Pilih Lingkungan --
                                    </option>
                                    {lingkunganData.map((ling) => (
                                      <option
                                        key={ling.id}
                                        value={ling.namaLingkungan}
                                      >
                                        {ling.namaLingkungan} (
                                        {ling.jumlahTatib} tatib)
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Selected Lingkungan */}
                                {mass.lingkungan &&
                                  mass.lingkungan.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {mass.lingkungan.map(
                                        (lingName, lingIndex) => {
                                          const lingData = lingkunganData.find(
                                            (l) => l.namaLingkungan === lingName
                                          );
                                          return (
                                            <div
                                              key={lingIndex}
                                              className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                            >
                                              <span>
                                                {lingName} (
                                                {lingData?.jumlahTatib || 0}{" "}
                                                tatib)
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditingCelebration(
                                                    (prev) => {
                                                      const updated = {
                                                        ...prev,
                                                      };
                                                      const updatedChurches =
                                                        updated.churches.map(
                                                          (ch, cIdx) => {
                                                            if (
                                                              cIdx ===
                                                              churchIndex
                                                            ) {
                                                              return {
                                                                ...ch,
                                                                masses:
                                                                  ch.masses.map(
                                                                    (
                                                                      m,
                                                                      mIdx
                                                                    ) => {
                                                                      if (
                                                                        mIdx ===
                                                                        massIndex
                                                                      ) {
                                                                        return {
                                                                          ...m,
                                                                          lingkungan:
                                                                            (
                                                                              m.lingkungan ||
                                                                              []
                                                                            ).filter(
                                                                              (
                                                                                _,
                                                                                i
                                                                              ) =>
                                                                                i !==
                                                                                lingIndex
                                                                            ),
                                                                        };
                                                                      }
                                                                      return m;
                                                                    }
                                                                  ),
                                                              };
                                                            }
                                                            return ch;
                                                          }
                                                        );
                                                      return {
                                                        ...updated,
                                                        churches:
                                                          updatedChurches,
                                                      };
                                                    }
                                                  );
                                                }}
                                                className="text-blue-600 hover:text-blue-800 font-bold"
                                              >
                                                ×
                                              </button>
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  )}

                                {/* Total Tatib Display */}
                                {mass.lingkungan &&
                                  mass.lingkungan.length > 0 && (
                                    <div className="text-sm text-gray-600 mt-1">
                                      Total Tatib:{" "}
                                      {mass.lingkungan.reduce(
                                        (sum, lingName) => {
                                          const lingData = lingkunganData.find(
                                            (l) => l.namaLingkungan === lingName
                                          );
                                          return (
                                            sum +
                                            parseInt(
                                              lingData?.jumlahTatib || "0"
                                            )
                                          );
                                        },
                                        0
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                removeEditingMassTime(churchIndex, massIndex)
                              }
                              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors mt-3"
                              disabled={church.masses.length === 1}
                            >
                              Hapus
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addEditingMassTime(churchIndex)}
                          className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                        >
                          + Tambah Waktu Misa
                        </button>
                      </div>
                    ))}

                    {/* Save/Cancel Buttons */}
                    <div className="mt-6 flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEditedCelebration}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                // Display Table
                <>
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                          {celebration.name}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Tanggal:{" "}
                          {celebration.date &&
                            new Date(celebration.date).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            handleRegenerateCelebration(celebrationIndex)
                          }
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteCelebration(celebrationIndex)
                          }
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus perayaan"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 py-3 px-4 text-left text-sm font-semibold text-gray-700">
                            Gereja
                          </th>
                          <th className="border border-gray-200 py-3 px-4 text-left text-sm font-semibold text-gray-700">
                            Waktu
                          </th>
                          <th className="border border-gray-200 py-3 px-4 text-left text-sm font-semibold text-gray-700">
                            Min Tatib
                          </th>
                          <th className="border border-gray-200 py-3 px-4 text-left text-sm font-semibold text-gray-700">
                            Lingkungan
                          </th>
                          <th className="border border-gray-200 py-3 px-4 text-left text-sm font-semibold text-gray-700">
                            Total Tatib
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {celebration.assignments.map((assignment, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-200 py-3 px-4 text-sm text-gray-900">
                              {assignment.church}
                            </td>
                            <td className="border border-gray-200 py-3 px-4 text-sm text-gray-900">
                              {assignment.time}
                            </td>
                            <td className="border border-gray-200 py-3 px-4 text-sm text-gray-900">
                              {assignment.minTatib}
                            </td>
                            <td className="border border-gray-200 py-3 px-4 text-sm">
                              {assignment.assignedLingkungan.length === 0 ? (
                                <span className="text-gray-400">
                                  Tidak ada lingkungan tersedia
                                </span>
                              ) : (
                                <div className="space-y-1">
                                  {assignment.assignedLingkungan.map(
                                    (ling, idx) => (
                                      <div key={idx} className="text-gray-900">
                                        {ling.name}
                                        <span className="text-xs text-gray-500 ml-2">
                                          ({ling.tatib} tatib)
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-200 py-3 px-4 text-sm">
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  assignment.totalTatib >= assignment.minTatib
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {assignment.totalTatib} tatib
                                {assignment.totalTatib < assignment.minTatib &&
                                  " ⚠️"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* New celebration form */}
          {showNewForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Tambah Perayaan Baru
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Celebration Name */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Perayaan
                  </label>
                  <input
                    type="text"
                    value={newCelebration.name}
                    onChange={(e) =>
                      handleCelebrationNameChange(e.target.value)
                    }
                    placeholder="Contoh: Pesta Santo Petrus dan Paulus"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-500"
                    required
                  />
                </div>

                {/* Date */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={newCelebration.date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900"
                    required
                  />
                </div>

                {/* Churches and Masses */}
                {newCelebration.churches.map((church, churchIndex) => (
                  <div
                    key={churchIndex}
                    className="mb-6 p-4 bg-gray-50 rounded-lg"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      {church.church}
                    </h3>
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
                              handleMassTimeChange(
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
                                  churchIndex,
                                  massIndex,
                                  e.target.value
                                )
                              }
                              min="0"
                              step="1"
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
                                onChange={(e) => {
                                  if (
                                    e.target.value &&
                                    !(mass.lingkungan || []).includes(
                                      e.target.value
                                    )
                                  ) {
                                    setNewCelebration((prev) => {
                                      const updated = { ...prev };
                                      const updatedChurches =
                                        updated.churches.map((ch, cIdx) => {
                                          if (cIdx === churchIndex) {
                                            return {
                                              ...ch,
                                              masses: ch.masses.map(
                                                (m, mIdx) => {
                                                  if (mIdx === massIndex) {
                                                    return {
                                                      ...m,
                                                      lingkungan: [
                                                        ...(m.lingkungan || []),
                                                        e.target.value,
                                                      ],
                                                    };
                                                  }
                                                  return m;
                                                }
                                              ),
                                            };
                                          }
                                          return ch;
                                        });
                                      return {
                                        ...updated,
                                        churches: updatedChurches,
                                      };
                                    });
                                    e.target.value = "";
                                  }
                                }}
                                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900"
                              >
                                <option value="">-- Pilih Lingkungan --</option>
                                {lingkunganData.map((ling) => (
                                  <option
                                    key={ling.id}
                                    value={ling.namaLingkungan}
                                  >
                                    {ling.namaLingkungan} ({ling.jumlahTatib}{" "}
                                    tatib)
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Selected Lingkungan */}
                            {mass.lingkungan && mass.lingkungan.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {mass.lingkungan.map((lingName, lingIndex) => {
                                  const lingData = lingkunganData.find(
                                    (l) => l.namaLingkungan === lingName
                                  );
                                  return (
                                    <div
                                      key={lingIndex}
                                      className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                    >
                                      <span>
                                        {lingName} ({lingData?.jumlahTatib || 0}{" "}
                                        tatib)
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNewCelebration((prev) => {
                                            const updated = { ...prev };
                                            const updatedChurches =
                                              updated.churches.map(
                                                (ch, cIdx) => {
                                                  if (cIdx === churchIndex) {
                                                    return {
                                                      ...ch,
                                                      masses: ch.masses.map(
                                                        (m, mIdx) => {
                                                          if (
                                                            mIdx === massIndex
                                                          ) {
                                                            return {
                                                              ...m,
                                                              lingkungan: (
                                                                m.lingkungan ||
                                                                []
                                                              ).filter(
                                                                (_, i) =>
                                                                  i !==
                                                                  lingIndex
                                                              ),
                                                            };
                                                          }
                                                          return m;
                                                        }
                                                      ),
                                                    };
                                                  }
                                                  return ch;
                                                }
                                              );
                                            return {
                                              ...updated,
                                              churches: updatedChurches,
                                            };
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
                            {mass.lingkungan && mass.lingkungan.length > 0 && (
                              <div className="text-sm text-gray-600 mt-1">
                                Total Tatib:{" "}
                                {mass.lingkungan.reduce((sum, lingName) => {
                                  const lingData = lingkunganData.find(
                                    (l) => l.namaLingkungan === lingName
                                  );
                                  return (
                                    sum + parseInt(lingData?.jumlahTatib || "0")
                                  );
                                }, 0)}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMassTime(churchIndex, massIndex)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors mt-3"
                          disabled={church.masses.length === 1}
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addMassTime(churchIndex)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      + Tambah Waktu Misa
                    </button>
                  </div>
                ))}

                {/* Save Button */}
                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowNewForm(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewCelebration}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Simpan Jadwal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tambah Perayaan Button */}
          {!showNewForm && (
            <div className="mt-6 mb-8 flex justify-center">
              <button
                onClick={() => setShowNewForm(true)}
                className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                + Tambah Perayaan
              </button>
            </div>
          )}
        </div>
      </main>

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
