"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [totalLingkungan, setTotalLingkungan] = useState(0);
  const [monthlyActivities, setMonthlyActivities] = useState(0);
  const [totalPaskahActivities, setTotalPaskahActivities] = useState(0);
  const [totalMisaLainnyaActivities, setTotalMisaLainnyaActivities] =
    useState(0);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    // Set current date
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    setCurrentDate(today.toLocaleDateString("id-ID", options));
  }, []);

  useEffect(() => {
    // Fetch lingkungan data
    fetch("/api/lingkungan")
      .then((response) => response.json())
      .then((data) => {
        setTotalLingkungan(data.length);
      })
      .catch((error) => {
        console.error("Error loading lingkungan data:", error);
      });

    // Fetch kalendar penugasan data and count current month's assignments
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Count assignments from regular weekend masses
    const saturdays = [];
    const sundays = [];
    const year = currentYear;
    const month = currentMonth;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 6) {
        saturdays.push(new Date(d));
      } else if (dayOfWeek === 0) {
        sundays.push(new Date(d));
      }
    }

    // Each Saturday has 2 masses (St. Yakobus 17:00, Pegangsaan 2 19:00)
    // Each Sunday has 4 masses (St. Yakobus 08:00, 11:00, 17:00, Pegangsaan 2 10:30)
    const regularMasses = saturdays.length * 2 + sundays.length * 4;

    // Count Paskah assignments for current month
    fetch("/api/paskah")
      .then((response) => response.json())
      .then((data) => {
        let paskahCount = 0;
        const holyDays = [
          "rabuAbu",
          "mingguPalma",
          "kamisPutih",
          "jumatAgung",
          "sabtuSuci",
          "mingguPaskah",
        ];

        holyDays.forEach((holyDay) => {
          if (data.schedules[holyDay] && data.schedules[holyDay].date) {
            const holyDayDate = new Date(data.schedules[holyDay].date);
            if (
              holyDayDate.getMonth() === currentMonth &&
              holyDayDate.getFullYear() === currentYear
            ) {
              if (data.assignments[holyDay]) {
                paskahCount += data.assignments[holyDay].length;
              }
            }
          }
        });

        // Count Misa Lainnya assignments for current month
        fetch("/api/misa-lainnya")
          .then((response) => response.json())
          .then((misaData) => {
            let misaLainnyaCount = 0;
            if (misaData.celebrations && misaData.celebrations.length > 0) {
              misaData.celebrations.forEach((celebration: any) => {
                if (celebration.date) {
                  const celebrationDate = new Date(celebration.date);
                  if (
                    celebrationDate.getMonth() === currentMonth &&
                    celebrationDate.getFullYear() === currentYear
                  ) {
                    if (
                      celebration.assignments &&
                      celebration.assignments.length > 0
                    ) {
                      misaLainnyaCount += celebration.assignments.length;
                    }
                  }
                }
              });
            }

            // Total = regular weekend masses + paskah + misa lainnya
            setMonthlyActivities(
              regularMasses + paskahCount + misaLainnyaCount
            );
          })
          .catch((error) => {
            console.error("Error loading misa lainnya data:", error);
            setMonthlyActivities(regularMasses + paskahCount);
          });
      })
      .catch((error) => {
        console.error("Error loading paskah data:", error);
        setMonthlyActivities(regularMasses);
      });
  }, []);

  useEffect(() => {
    // Fetch total Paskah activities
    fetch("/api/paskah")
      .then((response) => response.json())
      .then((data) => {
        let totalCount = 0;

        // Count all assignments across all holy days
        if (data.assignments) {
          Object.keys(data.assignments).forEach((holyDay) => {
            const assignments = data.assignments[holyDay];
            if (Array.isArray(assignments)) {
              totalCount += assignments.length;
            }
          });
        }

        setTotalPaskahActivities(totalCount);
      })
      .catch((error) => {
        console.error("Error loading paskah data:", error);
      });
  }, []);

  useEffect(() => {
    // Fetch total Misa Lainnya activities
    fetch("/api/misa-lainnya")
      .then((response) => response.json())
      .then((data) => {
        let totalCount = 0;

        // Count all assignments across all celebrations
        if (data.celebrations && Array.isArray(data.celebrations)) {
          data.celebrations.forEach((celebration: any) => {
            if (
              celebration.assignments &&
              Array.isArray(celebration.assignments)
            ) {
              totalCount += celebration.assignments.length;
            }
          });
        }

        setTotalMisaLainnyaActivities(totalCount);
      })
      .catch((error) => {
        console.error("Error loading misa lainnya data:", error);
      });
  }, []);

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
          <h2 className="text-xl font-bold text-gray-900">St. Yakobus</h2>
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-1">
          <a
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium"
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
      <main className="ml-56">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">
                Overview of your parish activities
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
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  Logout
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Current Date */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700">
              {currentDate}
            </h2>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* Total Lingkungan */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Lingkungan</p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {totalLingkungan}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Monthly Activities */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Monthly Activities
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {monthlyActivities}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Paskah Activities */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Total Paskah Activities
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {totalPaskahActivities}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Misa Lainnya Activities */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Total Misa Lainnya Activities
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {totalMisaLainnyaActivities}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions and Recent Activity */}
          <div className="grid grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-6">
                <Link href="/form-lingkungan">
                  <div className="group p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:shadow-md cursor-pointer transition-all duration-200 border border-blue-200 hover:border-blue-300">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Form Lingkungan
                        </h3>
                        <p className="text-sm text-gray-600">
                          Tambah lingkungan baru
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link href="/kalendar-penugasan">
                  <div className="group p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:shadow-md cursor-pointer transition-all duration-200 border border-green-200 hover:border-green-300">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Kalender Penugasan
                        </h3>
                        <p className="text-sm text-gray-600">
                          Penugasan setiap minggu
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link href="/misa-lainnya">
                  <div className="group p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:shadow-md cursor-pointer transition-all duration-200 border border-purple-200 hover:border-purple-300">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Misa Lainnya
                        </h3>
                        <p className="text-sm text-gray-600">
                          Penugasan misa lainnya
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-900 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      Incoming Assignment
                    </h4>
                    <p className="text-sm text-gray-600">
                      Misa Minggu - St. Yakobus, 09 Nov 2025
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-900 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      Incoming Assignment
                    </h4>
                    <p className="text-sm text-gray-600">
                      Misa Sabtu - Pegangsaan 2, 15 Nov 2025
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-900 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      Incoming Assignment
                    </h4>
                    <p className="text-sm text-gray-600">
                      Misa Minggu - St. Yakobus, 17 Nov 2025
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-900 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      Incoming Assignment
                    </h4>
                    <p className="text-sm text-gray-600">
                      Misa Minggu - Pegangsaan 2, 24 Nov 2025
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
