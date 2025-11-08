"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface MassTime {
  time: string;
  minTatib: string;
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

export default function MisaLainnyaPage() {
  const [savedSchedule, setSavedSchedule] =
    useState<CelebrationSchedule | null>(null);
  const [massAssignments, setMassAssignments] = useState<MassAssignment[]>([]);
  const [editing, setEditing] = useState(true);
  const [lingkunganData, setLingkunganData] = useState<LingkunganData[]>([]);
  const [celebrationSchedule, setCelebrationSchedule] =
    useState<CelebrationSchedule>({
      name: "",
      date: "",
      churches: [
        { church: "St. Yakobus", masses: [{ time: "", minTatib: "" }] },
        { church: "Pegangsaan 2", masses: [{ time: "", minTatib: "" }] },
      ],
    });

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
      if (data.schedule && data.schedule.name) {
        setSavedSchedule(data.schedule);
        setCelebrationSchedule(data.schedule);
        setEditing(false);
      }
      if (data.assignments && data.assignments.length > 0) {
        setMassAssignments(data.assignments);
      }
    } catch (error) {
      console.error("Error loading misa lainnya data:", error);
    }
  };

  const saveMisaLainnyaData = async (
    schedule: CelebrationSchedule,
    assignments: MassAssignment[]
  ) => {
    try {
      await fetch("/api/misa-lainnya", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schedule, assignments }),
      });
    } catch (error) {
      console.error("Error saving misa lainnya data:", error);
    }
  };

  const generateAssignments = (schedule: CelebrationSchedule) => {
    const usedLingkungan = new Set<string>();
    const assignments: MassAssignment[] = [];

    schedule.churches.forEach((church) => {
      church.masses.forEach((mass) => {
        if (mass.time) {
          const minTatib = parseInt(mass.minTatib) || 0;
          const assignedLingkungan = assignLingkunganToMass(
            church.church,
            minTatib,
            usedLingkungan
          );

          // Mark these lingkungan as used
          assignedLingkungan.forEach((ling) => usedLingkungan.add(ling.name));

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

    return assignments;
  };

  const assignLingkunganToMass = (
    church: string,
    minTatib: number,
    usedLingkungan: Set<string>
  ): AssignedLingkungan[] => {
    if (!minTatib || minTatib === 0) return [];

    const assigned: AssignedLingkungan[] = [];
    let currentTotal = 0;

    // Sort lingkungan by tatib count (descending) for greedy assignment
    const sortedLingkungan = [...lingkunganData].sort((a, b) => {
      return parseInt(b.jumlahTatib) - parseInt(a.jumlahTatib);
    });

    for (const ling of sortedLingkungan) {
      // Skip if already used
      if (usedLingkungan.has(ling.namaLingkungan)) continue;

      // Check if available for this church (any day)
      const availability = ling.availability[church];
      if (!availability) continue;

      // Check if available for any day (Sabtu or Minggu)
      const hasAvailability =
        (availability.Sabtu && availability.Sabtu.length > 0) ||
        (availability.Minggu && availability.Minggu.length > 0);

      if (!hasAvailability) continue;

      // Add this lingkungan
      assigned.push({
        name: ling.namaLingkungan,
        tatib: parseInt(ling.jumlahTatib),
      });
      currentTotal += parseInt(ling.jumlahTatib);

      // Stop if we've met the minimum
      if (currentTotal >= minTatib) break;
    }

    return assigned;
  };

  const handleCelebrationNameChange = (name: string) => {
    setCelebrationSchedule((prev) => ({ ...prev, name }));
  };

  const handleDateChange = (date: string) => {
    setCelebrationSchedule((prev) => ({ ...prev, date }));
  };

  const handleMassTimeChange = (
    churchIndex: number,
    massIndex: number,
    time: string
  ) => {
    setCelebrationSchedule((prev) => {
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
    setCelebrationSchedule((prev) => {
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
    setCelebrationSchedule((prev) => {
      const updated = { ...prev };
      const updatedChurches = updated.churches.map((church, idx) => {
        if (idx === churchIndex) {
          return {
            ...church,
            masses: [...church.masses, { time: "", minTatib: "" }],
          };
        }
        return church;
      });
      return { ...updated, churches: updatedChurches };
    });
  };

  const removeMassTime = (churchIndex: number, massIndex: number) => {
    setCelebrationSchedule((prev) => {
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

  const handleSave = () => {
    // Validate celebration name
    if (!celebrationSchedule.name.trim()) {
      alert("Mohon isi nama perayaan");
      return;
    }

    // Validate date
    if (!celebrationSchedule.date) {
      alert("Mohon isi tanggal perayaan");
      return;
    }

    // Validate that at least one mass has a time
    const hasAnyMass = celebrationSchedule.churches.some((church) =>
      church.masses.some((mass) => mass.time)
    );

    if (!hasAnyMass) {
      alert("Mohon isi setidaknya satu waktu misa");
      return;
    }

    // Save the schedule
    setSavedSchedule(celebrationSchedule);

    // Generate assignments
    const assignments = generateAssignments(celebrationSchedule);
    setMassAssignments(assignments);

    // Save to JSON file
    saveMisaLainnyaData(celebrationSchedule, assignments);

    // Set editing to false to show the table
    setEditing(false);

    alert(`Jadwal ${celebrationSchedule.name} berhasil disimpan!`);
  };

  const handleRegenerate = () => {
    if (!savedSchedule) return;

    // Regenerate assignments with fresh data
    const newAssignments = generateAssignments(savedSchedule);
    setMassAssignments(newAssignments);

    // Save to JSON file
    saveMisaLainnyaData(savedSchedule, newAssignments);

    alert("Penugasan berhasil digenerate ulang!");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" />
            </svg>
            Data Lingkungan
          </a>
          <a
            href="/kalendar-penugasan"
            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
            </svg>
            Kalendar Penugasan
          </a>
          <a
            href="/paskah"
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
            href="/misa-lainnya"
            className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium"
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
      <main className="ml-56">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Misa Lainnya</h1>
              <p className="text-sm text-gray-500">
                Kelola perayaan khusus dan penugasan tatib
              </p>
            </div>
            <div className="flex items-center gap-4">
              {!editing && savedSchedule && (
                <button
                  onClick={() => {
                    setCelebrationSchedule({
                      name: "",
                      date: "",
                      churches: [
                        {
                          church: "St. Yakobus",
                          masses: [{ time: "", minTatib: "" }],
                        },
                        {
                          church: "Pegangsaan 2",
                          masses: [{ time: "", minTatib: "" }],
                        },
                      ],
                    });
                    setEditing(true);
                  }}
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  + Tambah Perayaan
                </button>
              )}
              <Link
                href="/kalendar-penugasan"
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300"
              >
                Kembali ke Kalendar
              </Link>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {editing ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {savedSchedule ? "Edit Perayaan" : "Tambah Perayaan Baru"}
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Celebration Name */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Perayaan
                  </label>
                  <input
                    type="text"
                    value={celebrationSchedule.name}
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
                    value={celebrationSchedule.date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900"
                    required
                  />
                </div>

                {/* Churches and Masses */}
                {celebrationSchedule.churches.map((church, churchIndex) => (
                  <div key={churchIndex} className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      {church.church}
                    </h3>

                    {church.masses.map((mass, massIndex) => (
                      <div
                        key={massIndex}
                        className="mb-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex gap-4 items-end">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Misa {massIndex + 1}:
                            </label>
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
                            <div className="flex gap-2 items-center mt-2">
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
                                placeholder="0"
                                className="w-24 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-500"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              removeMassTime(churchIndex, massIndex)
                            }
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                            disabled={church.masses.length === 1}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Mass Time Button */}
                    <button
                      type="button"
                      onClick={() => addMassTime(churchIndex)}
                      className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      + Tambah Waktu Misa
                    </button>
                  </div>
                ))}

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Simpan Jadwal
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // Assignment Table
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {savedSchedule?.name}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Tanggal:{" "}
                      {savedSchedule?.date &&
                        new Date(savedSchedule.date).toLocaleDateString(
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
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleRegenerate}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Regenerate Misa
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Gereja
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Waktu
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Lingkungan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {massAssignments.map((assignment, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assignment.church}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assignment.time}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {assignment.assignedLingkungan.length === 0 ? (
                            <span className="text-gray-400">
                              Tidak ada assignment
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
                              <div className="mt-2 pt-1 border-t border-gray-200">
                                <span
                                  className={`text-xs font-medium ${
                                    assignment.totalTatib < assignment.minTatib
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  Total: {assignment.totalTatib} tatib
                                  {assignment.totalTatib <
                                    assignment.minTatib &&
                                    ` (Kurang dari ${assignment.minTatib})`}
                                </span>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
