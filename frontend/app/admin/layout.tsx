"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  User as UserIcon,
  Truck,
} from "lucide-react";
import api from "@/app/api/api";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const [verifying, setVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const token = localStorage.getItem("token_admin");
        if (!token) {
          router.replace("/admin/login");
          return;
        }

        // Biarkan Authorization manual; interceptor tidak akan menimpa
        const res = await api.get("/user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = res.data?.user;
        setUser(userData);

        if (userData?.role === "admin") {
          setIsAdmin(true);
        } else {
          // pastikan yang dihapus token_admin
          localStorage.removeItem("token_admin");
          router.replace("/admin/login");
        }
      } catch (err) {
        localStorage.removeItem("token_admin");
        router.replace("/admin/login");
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token_admin");
    router.replace("/admin/login");
  };

  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const navItems = [
    { href: "/admin", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { href: "/admin/products", icon: <Package size={18} />, label: "Products" },
    { href: "/admin/orders", icon: <ShoppingCart size={18} />, label: "Orders" },
    { href: "/admin/kurir", icon: <Truck size={18} />, label: "Kurir" },
    { href: "/admin/users", icon: <Users size={18} />, label: "Users" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200 text-center">
          <h1 className="text-xl font-extrabold tracking-wide text-gray-800">
            ADMIN PANEL
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 relative ${
                      active
                        ? "bg-red-50 text-red-600 border border-red-100"
                        : "text-gray-600 hover:bg-gray-100 hover:text-red-600"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-5 h-5 ${
                        active
                          ? "text-red-600"
                          : "text-gray-400 group-hover:text-red-500"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span>{item.label}</span>

                    {active && (
                      <span className="absolute left-0 top-0 h-full w-[3px] bg-red-600 rounded-r-md"></span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Profile & Logout Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 text-red-600 font-bold">
              <UserIcon size={20} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-[130px]">
                {user?.email || "-"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className=" cursor-pointer w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-all"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
