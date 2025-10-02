"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function PaskahPage() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    tanggalEvent: "",
    jumlahTatibPerSlot: "40",
    jamSlotKamisPutih: "06.00, 09.00, 11.00",
    jamSlotJumatAgung: "06.00, 09.00, 11.00",
    jamSlotSabtuSuci: "06.00, 09.00, 11.00",
  });

  const handleLogout = () => {
    router.push("/");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Penugasan Tri-Hari Suci:", formData);
    alert("Penugasan berhasil dibuat!");

    // Reset form if needed
    // setFormData({ ... });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar activeMenu="Paskah" onLogout={handleLogout} />

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Penugasan Khusus (Tri-Hari Suci)
          </h1>

          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tanggal Event */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Event
                </label>
                <input
                  type="date"
                  name="tanggalEvent"
                  value={formData.tanggalEvent}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  required
                />
              </div>

              {/* Jumlah Tatib per Slot */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Tatib per Slot
                </label>
                <input
                  type="number"
                  name="jumlahTatibPerSlot"
                  value={formData.jumlahTatibPerSlot}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  required
                />
              </div>
            </div>

            {/* Jam Slot */}
            <div className="space-y-4">
              {/* Jam Slot: Kamis Putih */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Slot: Kamis Putih (pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  name="jamSlotKamisPutih"
                  value={formData.jamSlotKamisPutih}
                  onChange={handleInputChange}
                  placeholder="06.00, 09.00, 11.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  required
                />
              </div>

              {/* Jam Slot: Jumat Agung */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Slot: Jumat Agung (pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  name="jamSlotJumatAgung"
                  value={formData.jamSlotJumatAgung}
                  onChange={handleInputChange}
                  placeholder="06.00, 09.00, 11.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  required
                />
              </div>

              {/* Jam Slot: Sabtu Suci */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Slot: Sabtu Suci (pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  name="jamSlotSabtuSuci"
                  value={formData.jamSlotSabtuSuci}
                  onChange={handleInputChange}
                  placeholder="06.00, 09.00, 11.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white py-3 px-8 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium"
              >
                Buat Penugasan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
