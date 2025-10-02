"use client";

import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";

export default function DataLingkunganPage() {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activeMenu="Data Lingkungan" onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Data Lingkungan
          </h1>

          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700 text-lg">
              Halaman Data Lingkungan akan diimplementasikan di sini.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
