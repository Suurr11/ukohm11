"use client";
import React, { useState, useEffect } from "react";
import api from "@/app/api/api";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import Header from "@/app/components/header";
import { Star } from "lucide-react"; // + import ikon bintang

interface OrderItem {
  product_id: number;
  qty: number;
  price: number;
  nama_product?: string;
  product_image?: string | null;
  // + data ulasan user
  review_id?: number | null;
  user_rating?: number | null;
  user_komentar?: string | null;
}

interface Order {
  id: number;
  order_code: string;
  status: string;
  total_price: number;
  created_at: string;
  items?: OrderItem[];
  cancel_requested_by?: "user" | "admin" | null;
  cancel_approved?: boolean;
}

const OrderPage = () => {
  const [activeTab, setActiveTab] = useState("cancelled");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<number | null>(null);
  const [reviewProductName, setReviewProductName] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [komentar, setKomentar] = useState<string>("");
  const [hoverRating, setHoverRating] = useState<number | null>(null); // + preview hover
  const [reviewId, setReviewId] = useState<number | null>(null); // + track id ulasan saat edit

  // 🔔 Konfirmasi aksi via toast (tanpa alert bawaan)
  const confirmAction = (message: string) =>
    new Promise<boolean>((resolve) => {
      toast.custom(
        (t) => (
          <div className="bg-white text-gray-800 shadow-md rounded-lg p-4 border w-[320px]">
            <p className="text-sm">{message}</p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
              >
                Batal
              </button>
              <button
                className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
              >
                Ya
              </button>
            </div>
          </div>
        ),
        { duration: Infinity }
      );
    });

  const fetchOrders = async (status: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/orders?status=${status}`);
      setOrders(res.data.data || []);
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  const handleCancelOrder = async (orderId: number) => {
    const ok = await confirmAction("Ajukan pembatalan pesanan ini? Admin harus menyetujui permintaan Anda.");
    if (!ok) return;
    try {
      await api.post(`/orders/${orderId}/cancel`);
      fetchOrders(activeTab);
      toast.success("Permintaan pembatalan dikirim. Menunggu persetujuan admin.", {
        style: { background: "#111", color: "#fff" },
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal mengajukan pembatalan.", {
        style: { background: "#111", color: "#fff" },
      });
    }
  };

  const handleAcceptAdminCancel = async (orderId: number) => {
    const ok = await confirmAction("Admin meminta pembatalan untuk pesanan ini. Setuju?");
    if (!ok) return;
    try {
      await api.post(`/orders/${orderId}/accept-cancel`);
      fetchOrders(activeTab);
      toast.success("Pembatalan disetujui. Order dibatalkan.", {
        style: { background: "#111", color: "#fff" },
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal menyetujui pembatalan.", {
        style: { background: "#111", color: "#fff" },
      });
    }
  };

  // ✅ Konfirmasi selesai terima pesanan
  const handleConfirmDone = async (orderId: number) => {
    const ok = await confirmAction("Apakah produk sudah sampai tujuan?");
    if (!ok) return;
    try {
      await api.post(`/orders/${orderId}/confirm-done`);
      fetchOrders(activeTab);
      toast.success("Terima kasih! Pesanan ditandai selesai.", {
        style: { background: "#111", color: "#fff" },
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal konfirmasi selesai.", {
        style: { background: "#111", color: "#fff" },
      });
    }
  };

  const openReview = (item: OrderItem) => {
    setReviewProductId(item.product_id);
    setReviewProductName(item.nama_product || "Produk");
    setReviewId(item.review_id ?? null);
    setRating(item.user_rating ?? 5);
    setKomentar(item.user_komentar ?? "");
    setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!reviewProductId) return;
    try {
      if (reviewId) {
        // + update ulasan
        await api.put(`/ulasan/${reviewId}`, { rating, komentar });
      } else {
        // + buat ulasan baru
        await api.post("/ulasan", { product_id: reviewProductId, rating, komentar });
      }
      setReviewOpen(false);
      // refresh list agar tombol berubah
      fetchOrders(activeTab);
      toast.success(reviewId ? "Ulasan diperbarui." : "Terima kasih! Ulasan terkirim.", {
        style: { background: "#111", color: "#fff" },
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal menyimpan ulasan.", {
        style: { background: "#111", color: "#fff" },
      });
    }
  };

  // 🔖 Tab hanya untuk status utama
  const tabs = [
    { key: "pending", label: "Sedang Dikemas" },
    { key: "shipping", label: "Sedang Dikirim" },
    { key: "done", label: "Selesai" },
    { key: "cancelled", label: "Dibatalkan" },
  ];

  const statusLabels: Record<string, string> = {
    pending: "Sedang Dikemas",
    shipping: "Sedang Dikirim",
    done: "Selesai",
    cancelled: "Dibatalkan",
    history: "Dibatalkan", // fallback untuk legacy
  };

  const formatRupiah = (n: number) =>
    `Rp ${Number(n || 0).toLocaleString("id-ID")}`;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 p-6 pt-[88px]">
        <Toaster position="top-right" containerStyle={{ top: 88 }} /> {/* + offset */}
        <h1 className="text-2xl font-semibold mb-6 text-gray-800">
          Pesanan Saya
        </h1>

        {/* 🔹 TAB MENU */}
        <div className="flex border-b border-gray-300 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`px-4 py-2 font-medium transition-all ${
                activeTab === tab.key
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Header khusus tab Dibatalkan */}
        {activeTab === "cancelled" && (
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Pesanan Dibatalkan</h2>
            <p className="text-sm text-gray-500">Daftar pesanan yang telah dibatalkan.</p>
          </div>
        )}

        {/* 🔹 LIST PESANAN */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {loading ? (
            <div className="text-gray-500 text-center py-10">
              Memuat pesanan...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-gray-500 text-center py-10">
              Belum ada pesanan di kategori ini.
            </div>
          ) : (
            orders.map((order) => {
              const tanggal = order.created_at
                ? new Date(order.created_at).toLocaleString("id-ID")
                : "-";

              return (
                <div
                  key={order.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="font-semibold text-gray-800">
                        {order.order_code}
                      </h2>
                      <p className="text-sm text-gray-500">Tanggal: {tanggal}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        Status: {statusLabels[order.status] || order.status}
                      </p>
                      {activeTab === "pending" && order.cancel_requested_by === "user" && !order.cancel_approved && (
                        <p className="text-xs text-yellow-700 mt-1">Menunggu persetujuan admin untuk pembatalan…</p>
                      )}
                      {activeTab === "pending" && order.cancel_requested_by === "admin" && !order.cancel_approved && (
                        <p className="text-xs text-red-700 mt-1">Admin meminta pembatalan. Mohon setujui bila berkenan.</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-blue-600 font-semibold">
                        {formatRupiah(order.total_price)}
                      </p>
                      {activeTab === "pending" && !order.cancel_requested_by && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="mt-2 px-3 py-1 rounded-md text-sm bg-red-600 text-white hover:bg-red-700"
                        >
                          Batalkan
                        </button>
                      )}
                      {activeTab === "pending" && order.cancel_requested_by === "admin" && !order.cancel_approved && (
                        <button
                          onClick={() => handleAcceptAdminCancel(order.id)}
                          className="mt-2 px-3 py-1 rounded-md text-sm bg-black text-white hover:bg-gray-800"
                        >
                          Terima Pembatalan
                        </button>
                      )}
                      {/* ✅ Tombol 'Selesai' saat Sedang Dikirim dan ada item */}
                      {activeTab === "shipping" && (order.items?.length || 0) > 0 && (
                        <button
                          onClick={() => handleConfirmDone(order.id)}
                          className="mt-2 px-3 py-1 rounded-md text-sm bg-green-600 text-white hover:bg-green-700"
                          title="Tandai pesanan selesai"
                        >
                          Selesai
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 🔸 LIST PRODUK DALAM ORDER */}
                  {order.items && order.items.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3 border-t pt-3">
                      {order.items.map((it, idx) => (
                        <div
                          key={`${order.id}-${it.product_id}-${idx}`}
                          className="flex items-center bg-gray-50 rounded-lg p-2"
                        >
                          <img
                            src={it.product_image || "/no-image.png"}
                            alt={it.nama_product || "Produk"}
                            className="w-16 h-16 object-cover rounded-md mr-3"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 line-clamp-1">
                              {it.nama_product || "Produk"}
                            </p>
                            <p className="text-xs text-gray-500">Qty: {it.qty}</p>
                            <p className="text-sm font-semibold text-gray-700">
                              {formatRupiah(it.price * it.qty)}
                            </p>
                            {/* + Beri Penilaian hanya di tab 'done' */}
                            {activeTab === "done" && (
                              <button
                                onClick={() => openReview(it)}
                                className="cursor-pointer mt-2 px-3 py-1 rounded-md text-xs bg-black text-white hover:bg-gray-800"
                              >
                                {it.review_id ? "Edit Ulasan" : "Beri Penilaian"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </motion.div>

        {/* + Modal Ulasan */}
        {reviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setReviewOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-[420px] max-w-[95vw] p-6 text-black">
              <h3 className="text-lg font-semibold mb-3">Beri Penilaian • {reviewProductName}</h3>
              <div className="space-y-3">
                {/* Ubah select menjadi bintang interaktif */}
                <div>
                  <label className="text-sm text-black">Rating</label>
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((r) => {
                      const active = (hoverRating ?? rating) >= r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onMouseEnter={() => setHoverRating(r)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRating(r)}
                          aria-label={`${r} bintang`}
                          className="p-1"
                        >
                          <Star
                            className={active ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                            size={22}
                          />
                          <span className="sr-only">{r} bintang</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-black">
                    Komentar (opsional)
                  </label>
                  <textarea
                    value={komentar}
                    onChange={(e) => setKomentar(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm text-black"
                    rows={4}
                    placeholder="Tulis pengalaman Anda..."
                  />
                </div>
              </div>
              <div className=" flex justify-end gap-2 mt-4">
                <button onClick={() => setReviewOpen(false)} className=" cursor-pointer px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm">
                  Batal
                </button>
                <button onClick={submitReview} className="cursor-pointer px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm">
                  Kirim
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderPage;
