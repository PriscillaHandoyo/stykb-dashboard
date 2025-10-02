"use client";

import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";

export default function MisaLainnyaPage() {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activeMenu="Misa Lainnya" onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Misa Lainnya
          </h1>

          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700 text-lg">
              Halaman Misa Lainnya akan diimplementasikan di sini.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
