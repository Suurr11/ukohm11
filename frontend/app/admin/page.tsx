"use client";

import { useEffect, useState } from "react";
import api from "@/app/api/api";
import { Package, Users, TrendingUp, Wallet } from "lucide-react"; // + icons

interface Stats {
  total_products: number;
  total_users: number;
  total_limited: number;
  total_stock: number;
  // + nilai baru
  total_keuntungan?: number;
  total_modal?: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatRupiah = (n?: number) =>
    `Rp ${(Number(n || 0)).toLocaleString("id-ID")}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Admin Dashboard</h1>
      <p className="text-gray-500 mb-10">
        Manage products, users, and statistics efficiently.
      </p>

      {/* Statistik utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats?.total_products}
          accent="bg-blue-100 text-blue-600"
          icon={<Package size={18} />} // + icon
        />
        <StatCard
          title="Total Users"
          value={stats?.total_users}
          accent="bg-green-100 text-green-600"
          icon={<Users size={18} />} // + icon
        />
        {/* + Ganti: Limited -> Total Keuntungan */}
        <StatCard
          title="Total Keuntungan"
          valueLabel={formatRupiah(stats?.total_keuntungan)}
          accent="bg-purple-100 text-purple-600"
          icon={<TrendingUp size={18} />} // + icon
        />
        {/* + Ganti: Total Stock -> Total Modal */}
        <StatCard
          title="Total Modal"
          valueLabel={formatRupiah(stats?.total_modal)}
          accent="bg-gray-100 text-gray-700"
          icon={<Wallet size={18} />} // + icon
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  valueLabel,
  accent,
  icon,
}: {
  title: string;
  value?: number;
  valueLabel?: string;
  accent: string;
  icon?: React.ReactNode; // + icon prop
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${accent} mb-4`}>
        {/* + render icon */}
        <span aria-hidden className="flex items-center justify-center">{icon}</span>
      </div>
      <h2 className="text-sm text-gray-500 font-medium">{title}</h2>
      <p className="text-3xl font-semibold text-gray-800 mt-1">
        {valueLabel ?? (value ?? "--")}
      </p>
    </div>
  );
}