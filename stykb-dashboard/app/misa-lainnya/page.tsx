"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function MisaLainnyaPage() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    namaMisa: "",
    tanggalEvent: "",
    jamSlot: "07.00, 10.00, 11.00, 12.00",
    jumlahTatibPerSlot: "40",
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
    console.log("Penugasan Misa Lainnya:", formData);
    alert("Penugasan berhasil dibuat!");

    // Reset form if needed
    // setFormData({
    //   namaMisa: '',
    //   tanggalEvent: '',
    //   jamSlot: '07.00, 10.00, 11.00, 12.00',
    //   jumlahTatibPerSlot: '40'
    // });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar activeMenu="Misa Lainnya" onLogout={handleLogout} />

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Penugasan Khusus (Misa Lainnya)
          </h1>

          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama Misa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Misa
                </label>
                <input
                  type="text"
                  name="namaMisa"
                  value={formData.namaMisa}
                  onChange={handleInputChange}
                  placeholder="e.g. Misa Natal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  required
                />
              </div>

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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jam Slot */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Slot (pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  name="jamSlot"
                  value={formData.jamSlot}
                  onChange={handleInputChange}
                  placeholder="07.00, 10.00, 11.00, 12.00"
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
