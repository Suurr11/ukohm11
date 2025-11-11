"use client";
import React from "react";
import Header from "@/app/components/header";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const orderCode = params.get("order") || params.get("order_code") || null;

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-3xl mx-auto pt-28 px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center"
        >
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Pembayaran Berhasil</h1>
          <p className="mt-2 text-gray-600">
            Terima kasih! Pesanan Anda sedang diproses. {orderCode ? `Kode pesanan: ${orderCode}.` : ""}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/orders"
              className="cursor-pointer inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-black text-white hover:bg-gray-800 transition"
            >
              Lihat Pesanan
            </Link>
            <Link
              href="/products"
              className="cursor-pointer inline-flex items-center justify-center px-5 py-2.5 rounded-md border border-gray-300 text-gray-800 hover:bg-gray-100 transition"
            >
              <ShoppingBag className="w-4 h-4 mr-2" /> Belanja Lagi
            </Link>
          </div>
        </motion.div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Bukti transaksi telah dikirim ke email Anda.
        </p>
      </div>
    </main>
  );
}
