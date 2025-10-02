"use client";

import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar activeMenu="Dashboard" onLogout={handleLogout} />

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Admin Dashboard
          </h1>

          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700 text-lg">
              Selamat datang di dashboard, Admin!
            </p>

            {/* Dashboard Cards/Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">-</h3>
                <p className="text-gray-600">Content area 1</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">-</h3>
                <p className="text-gray-600">Content area 2</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">-</h3>
                <p className="text-gray-600">Content area 3</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
