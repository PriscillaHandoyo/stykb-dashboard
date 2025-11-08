"use client";

import React, { useState } from "react";
import Link from "next/link";

interface MassTime {
  time: string;
}

interface ChurchSchedule {
  church: string;
  masses: MassTime[];
}

interface HolyDaySchedule {
  date: string;
  churches: ChurchSchedule[];
}

export default function PaskahPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [savedSchedule, setSavedSchedule] = useState<any>(null);
  const [paskahSchedule, setPaskahSchedule] = useState({
    mingguPalma: {
      date: "",
      churches: [
        { church: "St. Yakobus", masses: [{ time: "" }] },
        { church: "Pegangsaan 2", masses: [{ time: "" }] },
      ],
    },
    rabuAbu: {
      date: "",
      churches: [
        { church: "St. Yakobus", masses: [{ time: "" }] },
        { church: "Pegangsaan 2", masses: [{ time: "" }] },
      ],
    },
    kamisPutih: {
      date: "",
      churches: [
        { church: "St. Yakobus", masses: [{ time: "" }] },
        { church: "Pegangsaan 2", masses: [{ time: "" }] },
      ],
    },
    jumatAgung: {
      date: "",
      churches: [
        { church: "St. Yakobus", masses: [{ time: "" }] },
        { church: "Pegangsaan 2", masses: [{ time: "" }] },
      ],
    },
    sabtuSuci: {
      date: "",
      churches: [
        { church: "St. Yakobus", masses: [{ time: "" }] },
        { church: "Pegangsaan 2", masses: [{ time: "" }] },
      ],
    },
    mingguPaskah: {
      date: "",
      churches: [
        { church: "St. Yakobus", masses: [{ time: "" }] },
        { church: "Pegangsaan 2", masses: [{ time: "" }] },
      ],
    },
  });

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

  const addMassTime = (holyDay: string, churchIndex: number) => {
    setPaskahSchedule((prev) => {
      const updated = { ...prev };
      const day = updated[holyDay as keyof typeof updated];
      day.churches[churchIndex].masses.push({ time: "" });
      return updated;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSchedule(paskahSchedule);
    setIsEditing(false);
    alert("Jadwal Paskah berhasil disimpan!");
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (savedSchedule) {
      setPaskahSchedule(savedSchedule);
      setIsEditing(false);
    }
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
              <div key={massIndex} className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-gray-600 w-20">
                  Misa {massIndex + 1}:
                </label>
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
                <button
                  type="button"
                  onClick={() =>
                    removeMassTime(holyDayKey, churchIndex, massIndex)
                  }
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
      <div className="flex-1 ml-56">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Paskah</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Kegiatan dan perayaan Paskah
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
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!savedSchedule || isEditing ? (
            /* Form View */
            <form onSubmit={handleSubmit}>
              {/* Rabu Abu */}
              {renderHolyDaySection(
                "Rabu Abu",
                "rabuAbu",
                paskahSchedule.rabuAbu
              )}

              {/* Minggu Palma */}
              {renderHolyDaySection(
                "Minggu Palma",
                "mingguPalma",
                paskahSchedule.mingguPalma
              )}

              {/* Kamis Putih */}
              {renderHolyDaySection(
                "Kamis Putih",
                "kamisPutih",
                paskahSchedule.kamisPutih
              )}

              {/* Jumat Agung */}
              {renderHolyDaySection(
                "Jumat Agung",
                "jumatAgung",
                paskahSchedule.jumatAgung
              )}

              {/* Sabtu Suci */}
              {renderHolyDaySection(
                "Sabtu Suci",
                "sabtuSuci",
                paskahSchedule.sabtuSuci
              )}

              {/* Minggu Paskah */}
              {renderHolyDaySection(
                "Minggu Paskah",
                "mingguPaskah",
                paskahSchedule.mingguPaskah
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                {savedSchedule && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          ) : (
            /* Display View */
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Jadwal Perayaan Paskah
                </h2>
                <button
                  onClick={handleEdit}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Jadwal
                </button>
              </div>

              {/* Minggu Palma */}
              {savedSchedule.mingguPalma.date && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Minggu Palma ({formatDate(savedSchedule.mingguPalma.date)})
                  </h3>
                  {savedSchedule.mingguPalma.churches.map(
                    (church: ChurchSchedule, idx: number) => {
                      const times = church.masses
                        .filter((m) => m.time)
                        .map((m) => formatTime(m.time))
                        .join(" & ");
                      if (times) {
                        return (
                          <div
                            key={idx}
                            className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-2"
                          >
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">
                                {church.church}:
                              </span>
                            </p>
                            <p className="text-right text-gray-700">{times}</p>
                          </div>
                        );
                      }
                      return null;
                    }
                  )}
                </div>
              )}

              {/* Kamis Putih */}
              {savedSchedule.kamisPutih.date && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Kamis Putih ({formatDate(savedSchedule.kamisPutih.date)})
                  </h3>
                  {savedSchedule.kamisPutih.churches.map(
                    (church: ChurchSchedule, idx: number) => {
                      const times = church.masses
                        .filter((m) => m.time)
                        .map((m) => formatTime(m.time))
                        .join(" & ");
                      if (times) {
                        return (
                          <div
                            key={idx}
                            className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-2"
                          >
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">
                                {church.church}:
                              </span>
                            </p>
                            <p className="text-right text-gray-700">{times}</p>
                          </div>
                        );
                      }
                      return null;
                    }
                  )}
                </div>
              )}

              {/* Jumat Agung */}
              {savedSchedule.jumatAgung.date && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Jumat Agung ({formatDate(savedSchedule.jumatAgung.date)})
                  </h3>
                  {savedSchedule.jumatAgung.churches.map(
                    (church: ChurchSchedule, idx: number) => {
                      const times = church.masses
                        .filter((m) => m.time)
                        .map((m) => formatTime(m.time))
                        .join(" & ");
                      if (times) {
                        return (
                          <div
                            key={idx}
                            className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-2"
                          >
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">
                                {church.church}:
                              </span>
                            </p>
                            <p className="text-right text-gray-700">{times}</p>
                          </div>
                        );
                      }
                      return null;
                    }
                  )}
                </div>
              )}

              {/* Sabtu Suci */}
              {savedSchedule.sabtuSuci.date && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Sabtu Suci ({formatDate(savedSchedule.sabtuSuci.date)})
                  </h3>
                  {savedSchedule.sabtuSuci.churches.map(
                    (church: ChurchSchedule, idx: number) => {
                      const times = church.masses
                        .filter((m) => m.time)
                        .map((m) => formatTime(m.time))
                        .join(" & ");
                      if (times) {
                        return (
                          <div
                            key={idx}
                            className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-2"
                          >
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">
                                {church.church}:
                              </span>
                            </p>
                            <p className="text-right text-gray-700">{times}</p>
                          </div>
                        );
                      }
                      return null;
                    }
                  )}
                </div>
              )}

              {/* Minggu Paskah */}
              {savedSchedule.mingguPaskah.date && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Minggu Paskah ({formatDate(savedSchedule.mingguPaskah.date)}
                    )
                  </h3>
                  {savedSchedule.mingguPaskah.churches.map(
                    (church: ChurchSchedule, idx: number) => {
                      const times = church.masses
                        .filter((m) => m.time)
                        .map((m) => formatTime(m.time))
                        .join(" & ");
                      if (times) {
                        return (
                          <div
                            key={idx}
                            className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-2"
                          >
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">
                                {church.church}:
                              </span>
                            </p>
                            <p className="text-right text-gray-700">{times}</p>
                          </div>
                        );
                      }
                      return null;
                    }
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
