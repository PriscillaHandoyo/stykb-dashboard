"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function FormLingkunganPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    namaLingkungan: "",
    namaKetua: "",
    nomorTelepon: "",
    jumlahTatib: "",
    availability: {
      "Gereja St. Yakobus": {
        Minggu: [] as string[],
        Sabtu: [] as string[],
      },
      "Pegangsaan 2": {
        Minggu: [] as string[],
      },
    },
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (
    church: string,
    day: string,
    time: string,
    checked: boolean
  ) => {
    setFormData((prev) => {
      const newAvailability = { ...prev.availability };
      const churchData =
        newAvailability[church as keyof typeof newAvailability];
      const dayArray = churchData[day as keyof typeof churchData] as string[];

      if (checked) {
        return {
          ...prev,
          availability: {
            ...newAvailability,
            [church]: {
              ...churchData,
              [day]: [...dayArray, time],
            },
          },
        };
      } else {
        return {
          ...prev,
          availability: {
            ...newAvailability,
            [church]: {
              ...churchData,
              [day]: dayArray.filter((t) => t !== time),
            },
          },
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Transform data to match the JSON structure
      const dataToSave = {
        namaLingkungan: formData.namaLingkungan,
        namaKetua: formData.namaKetua,
        nomorTelepon: formData.nomorTelepon,
        jumlahTatib: formData.jumlahTatib,
        availability: {
          "St. Yakobus": {
            Minggu: formData.availability["Gereja St. Yakobus"].Minggu,
            Sabtu: formData.availability["Gereja St. Yakobus"].Sabtu,
          },
          "Pegangsaan 2": {
            Minggu: formData.availability["Pegangsaan 2"].Minggu,
          },
        },
      };

      const response = await fetch("/api/lingkungan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      });

      if (response.ok) {
        alert("Data berhasil disimpan!");
        router.push("/data-lingkungan");
      } else {
        alert("Gagal menyimpan data");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setSaving(false);
    }
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
            className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium"
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
                Form Lingkungan
              </h1>
              <p className="text-sm text-gray-500">
                Formulir untuk data lingkungan paroki
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

        {/* Form Content */}
        <div className="p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Form Lingkungan
            </h2>
            <p className="text-gray-600 mb-8">
              Formulir untuk mendaftarkan lingkungan baru dalam paroki.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Form Fields Row 1 */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lingkungan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.namaLingkungan}
                    onChange={(e) =>
                      handleInputChange("namaLingkungan", e.target.value)
                    }
                    placeholder="Masukkan nama lingkungan"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Ketua Lingkungan{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.namaKetua}
                    onChange={(e) =>
                      handleInputChange("namaKetua", e.target.value)
                    }
                    placeholder="Masukkan nama ketua lingkungan"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Form Fields Row 2 */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Telepon Ketua Lingkungan{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nomorTelepon}
                    onChange={(e) =>
                      handleInputChange("nomorTelepon", e.target.value)
                    }
                    placeholder="Contoh: 08123456789"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Tatib <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.jumlahTatib}
                    onChange={(e) =>
                      handleInputChange("jumlahTatib", e.target.value)
                    }
                    placeholder="Masukkan jumlah tatib"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Availability Section */}
              <div className="mb-8">
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  Availability <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Pilih jadwal ketersediaan lingkungan untuk melayani di gereja
                </p>

                {/* Gereja St. Yakobus */}
                <div className="border border-gray-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                    </svg>
                    <h4 className="font-semibold text-gray-900">
                      Gereja St. Yakobus
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {/* Minggu */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3">
                        Minggu
                      </h5>
                      <div className="space-y-2">
                        {["08:00", "11:00", "17:00"].map((time) => (
                          <label
                            key={time}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              onChange={(e) =>
                                handleCheckboxChange(
                                  "Gereja St. Yakobus",
                                  "Minggu",
                                  time,
                                  e.target.checked
                                )
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {time}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Sabtu */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3">
                        Sabtu
                      </h5>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            onChange={(e) =>
                              handleCheckboxChange(
                                "Gereja St. Yakobus",
                                "Sabtu",
                                "17:00",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">17:00</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pegangsaan 2 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                    </svg>
                    <h4 className="font-semibold text-gray-900">
                      Pegangsaan 2
                    </h4>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Minggu
                    </h5>
                    <div className="space-y-2">
                      {["07:30", "10:30"].map((time) => (
                        <label
                          key={time}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            onChange={(e) =>
                              handleCheckboxChange(
                                "Pegangsaan 2",
                                "Minggu",
                                time,
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{time}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {saving ? "Menyimpan..." : "Simpan Data Lingkungan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
