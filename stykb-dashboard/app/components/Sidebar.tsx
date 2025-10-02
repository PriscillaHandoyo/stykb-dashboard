"use client";

import { useRouter } from "next/navigation";

interface SidebarProps {
  activeMenu: string;
  onLogout: () => void;
}

export default function Sidebar({ activeMenu, onLogout }: SidebarProps) {
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", icon: "🏠", href: "/dashboard" },
    { name: "Form Lingkungan", icon: "📝", href: "/form-lingkungan" },
    { name: "Kalender Penugasan", icon: "📅", href: "/kalender-penugasan" },
    { name: "Paskah", icon: "✝️", href: "/paskah" },
    { name: "Misa Lainnya", icon: "⛪", href: "/misa-lainnya" },
    { name: "Data Lingkungan", icon: "📊", href: "/data-lingkungan" },
  ];

  const handleMenuClick = (item: (typeof menuItems)[0]) => {
    router.push(item.href);
  };

  return (
    <div className="w-64 bg-gray-800 text-white relative">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-8">Menu</h2>

        {/* Menu Items */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleMenuClick(item)}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeMenu === item.name
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-8 left-6 right-6">
          <button
            onClick={onLogout}
            className="w-full flex items-center px-4 py-3 text-left rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <span className="mr-3">🚪</span>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
