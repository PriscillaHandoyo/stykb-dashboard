"use client";

import React, { useState } from "react";

interface PaskahEvent {
  id: string;
  name: string;
  date: string;
  times: string[];
}

export default function PaskahPage() {
  const [events, setEvents] = useState<PaskahEvent[]>([
    {
      id: "1",
      name: "Minggu Palma",
      date: "30 Maret",
      times: ["08:00 & 17:00"],
    },
    {
      id: "2",
      name: "Kamis Putih",
      date: "3 April",
      times: ["19:00"],
    },
    {
      id: "3",
      name: "Jumat Agung",
      date: "4 April",
      times: ["21:00 - 24:00"],
    },
    {
      id: "4",
      name: "Jumat Agung",
      date: "4 April",
      times: ["08:00"],
    },
    {
      id: "5",
      name: "Jumat Agung",
      date: "4 April",
      times: ["15:00"],
    },
    {
      id: "6",
      name: "Sabtu Suci",
      date: "5 April",
      times: ["20:00"],
    },
    {
      id: "7",
      name: "Minggu Paskah",
      date: "6 April",
      times: ["06:00"],
    },
    {
      id: "8",
      name: "Minggu Paskah",
      date: "6 April",
      times: ["08:00"],
    },
    {
      id: "9",
      name: "Minggu Paskah",
      date: "6 April",
      times: ["17:00"],
    },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedEvent, setEditedEvent] = useState<PaskahEvent | null>(null);

  const handleEdit = (event: PaskahEvent) => {
    setEditingId(event.id);
    setEditedEvent({ ...event });
  };

  const handleSave = () => {
    if (editedEvent) {
      setEvents(
        events.map((event) =>
          event.id === editedEvent.id ? editedEvent : event
        )
      );
      setEditingId(null);
      setEditedEvent(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedEvent(null);
  };

  const handleChange = (field: keyof PaskahEvent, value: string | string[]) => {
    if (editedEvent) {
      setEditedEvent({
        ...editedEvent,
        [field]: value,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              P
            </div>
            <span className="text-xl font-bold text-gray-900">Parish Hub</span>
          </div>

          <nav className="space-y-1">
            <a
              href="/dashboard"
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Dashboard
            </a>
            <a
              href="/form-lingkungan"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Form Lingkungan
            </a>
            <a
              href="/data-lingkungan"
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
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
              Data Lingkungan
            </a>
            <a
              href="/kalendar-penugasan"
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Kalendar Penugasan
            </a>
            <a
              href="/paskah"
              className="flex items-center gap-3 px-3 py-2.5 text-blue-600 bg-blue-50 rounded-lg"
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
              className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Misa Lainnya
            </a>
          </nav>
        </div>

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
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Paskah</h1>
              <p className="text-gray-600 mt-1">Kegiatan dan perayaan Paskah</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-900">
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
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  Welcome back, Admin!
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Events Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Jadwal Perayaan Paskah
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-6"
                  >
                    {editingId === event.id && editedEvent ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Perayaan
                          </label>
                          <input
                            type="text"
                            value={editedEvent.name}
                            onChange={(e) =>
                              handleChange("name", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tanggal
                          </label>
                          <input
                            type="text"
                            value={editedEvent.date}
                            onChange={(e) =>
                              handleChange("date", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="DD Bulan"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Waktu (pisahkan dengan koma untuk multiple waktu)
                          </label>
                          <input
                            type="text"
                            value={editedEvent.times.join(", ")}
                            onChange={(e) =>
                              handleChange(
                                "times",
                                e.target.value.split(",").map((t) => t.trim())
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="08:00, 17:00"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {event.name}{" "}
                              <span className="text-gray-600">
                                ({event.date})
                              </span>
                            </h3>
                          </div>
                          <button
                            onClick={() => handleEdit(event)}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="space-y-2">
                          {event.times.map((time, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-200"
                            >
                              <span className="text-gray-700">{time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
