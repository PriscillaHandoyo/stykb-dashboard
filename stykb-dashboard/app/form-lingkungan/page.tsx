"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function FormLingkunganPage() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    namaLingkungan: "",
    namaKetua: "",
    jumlahTatib: "0",
    availability: {
      sabtu1700: false,
      minggu0800: false,
      minggu1100: false,
      minggu1700: false,
      minggu0730: false,
      minggu1030: false,
    },
  });

  const handleLogout = () => {
    router.push("/");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        availability: {
          ...prev.availability,
          [name]: checked,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Prepare data for submission
      const submissionData = {
        namaLingkungan: formData.namaLingkungan,
        namaKetua: formData.namaKetua,
        jumlahTatib: parseInt(formData.jumlahTatib),
        availability: formData.availability,
      };

      const response = await fetch("/api/lingkungan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        alert("Lingkungan berhasil ditambahkan!");

        // Reset form
        setFormData({
          namaLingkungan: "",
          namaKetua: "",
          jumlahTatib: "0",
          availability: {
            sabtu1700: false,
            minggu0800: false,
            minggu1100: false,
            minggu1700: false,
            minggu0730: false,
            minggu1030: false,
          },
        });
      } else {
        alert("Gagal menambahkan lingkungan. Silakan coba lagi.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Terjadi kesalahan. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar activeMenu="Form Lingkungan" onLogout={handleLogout} />

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Tambah Lingkungan Baru
          </h1>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
            {/* Nama Lingkungan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lingkungan
              </label>
              <input
                type="text"
                name="namaLingkungan"
                value={formData.namaLingkungan}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                required
              />
            </div>

            {/* Nama Ketua Lingkungan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Ketua Lingkungan
              </label>
              <input
                type="text"
                name="namaKetua"
                value={formData.namaKetua}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                required
              />
            </div>

            {/* Jumlah Tatib */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Tatib
              </label>
              <input
                type="number"
                name="jumlahTatib"
                value={formData.jumlahTatib}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                required
              />
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-large font-bold text-gray-700 mb-4">
                Availability
              </label>

              <div className="space-y-4">
                <div>
                  <p className="font-medium text-gray-700 mb-2">
                    Gereja St. Yakbus: Sabtu
                  </p>
                  <label className="flex items-center text-black">
                    <input
                      type="checkbox"
                      name="sabtu1700"
                      checked={formData.availability.sabtu1700}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    17.00
                  </label>
                </div>

                <div>
                  <p className="font-medium text-gray-700 mb-2">
                    Gereja St. Yakbus: Minggu
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center text-black">
                      <input
                        type="checkbox"
                        name="minggu0800"
                        checked={formData.availability.minggu0800}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      08.00
                    </label>
                    <label className="flex items-center text-black">
                      <input
                        type="checkbox"
                        name="minggu1100"
                        checked={formData.availability.minggu1100}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      11.00
                    </label>
                    <label className="flex items-center text-black">
                      <input
                        type="checkbox"
                        name="minggu1700"
                        checked={formData.availability.minggu1700}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      17.00
                    </label>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-gray-700 mb-2">
                    Pegangsaan 2: Minggu
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center text-black">
                      <input
                        type="checkbox"
                        name="minggu0730"
                        checked={formData.availability.minggu0730}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      07.30
                    </label>
                    <label className="flex items-center text-black">
                      <input
                        type="checkbox"
                        name="minggu1030"
                        checked={formData.availability.minggu1030}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      10.30
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium"
            >
              Tambah Lingkungan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
