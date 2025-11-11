"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/app/api/api";
import toast, { Toaster } from "react-hot-toast";
import Header from "@/app/components/header"; // + import header

interface Order {
  id: number;
  user_name: string;
  total_items: number;
  total_harga: number;
  tanggal: string;
  status: "pending" | "shipping" | "done" | "cancelled" | string;
  cancel_requested_by?: "user" | "admin" | null;
  cancel_approved?: boolean;
  order_code?: string; // + added
}

interface OrderItem {
  id: number;
  product_name: string;
  qty: number;
  price: number;
  subtotal: number;
  product_image?: string;
  product_code?: string; // + product code
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  // warna berdasarkan status
  const statusColors: Record<string, string> = {
    done: "bg-green-600 text-white",
    shipping: "bg-blue-600 text-white",
    cancelled: "bg-red-600 text-white",
    pending: "bg-yellow-500 text-white",
  };

  const statusLabels: Record<string, string> = {
    done: "Selesai",
    shipping: "Sedang Dikirim",
    cancelled: "Dibatalkan",
    pending: "Pending",
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/admin/orders");
      const data = res.data?.data ?? res.data ?? [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast("Gagal memuat data order", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: number) => {
    setLoadingItems(true);
    try {
      const res = await api.get(`/admin/orders/${orderId}/items`);
      setOrderItems(res.data?.items || []);
    } catch {
      showToast("Gagal memuat produk di order ini", "error");
    } finally {
      setLoadingItems(false);
    }
  };

  // notifikasi tengah + clean
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const palette =
      type === "success"
        ? { border: "border-green-200", text: "text-green-800", dot: "bg-green-500" }
        : type === "error"
        ? { border: "border-red-200", text: "text-red-800", dot: "bg-red-500" }
        : { border: "border-gray-200", text: "text-gray-800", dot: "bg-gray-500" };

    toast.custom(
      (t) => (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            className={`pointer-events-auto bg-white rounded-xl shadow-xl border ${palette.border} px-4 py-3 flex items-center gap-3`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${palette.dot}`} />
            <p className={`text-sm ${palette.text}`}>{message}</p>
          </motion.div>
        </div>
      ),
      { duration: 2200 }
    );
  };

  // konfirmasi tengah + pop-up
  const confirmAction = (message: string) =>
    new Promise<boolean>((resolve) => {
      toast.custom(
        (t) => (
          <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 12 }}
              className="relative bg-white text-gray-800 rounded-xl shadow-2xl p-5 w-[320px]"
            >
              <p className="text-sm">{message}</p>
              <div className="mt-4 flex justify-end gap-2">
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
            </motion.div>
          </div>
        ),
        { duration: Infinity }
      );
    });

  const updateStatus = async (id: number, status: Order["status"]) => {
    try {
      if (status === "cancelled") {
        const ok = await confirmAction("Kirim permintaan pembatalan ke user untuk order ini?");
        if (!ok) return;
        await api.put(`/admin/orders/${id}/request-cancel`);
        showToast(`Permintaan pembatalan dikirim ke user untuk order #${id}`, "success");
      } else {
        await api.put(`/admin/orders/${id}`, { status });
        showToast(`Status order #${id} diubah ke ${statusLabels[status] || status}`, "success");
      }
      fetchOrders();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Gagal memperbarui status order", "error");
    }
  };

  const acceptUserCancel = async (id: number) => {
    const ok = await confirmAction("Terima pembatalan dari user untuk order ini?");
    if (!ok) return;
    try {
      await api.put(`/admin/orders/${id}/accept-cancel`);
      showToast(`Order #${id} dibatalkan`, "success");
      fetchOrders();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Gagal menerima pembatalan", "error");
    }
  };

  const formatRupiah = (n: number) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`;

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderItems(order.id);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setOrderItems([]);
  };

  return (
    <motion.div
      className="flex-1 p-8 bg-gray-100 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Toaster />
      <h2 className="text-3xl font-bold text-black mb-6">Daftar Order Pengguna</h2>
      {loading ? (
        <p className="text-gray-600">Memuat data...</p>
      ) : (
        <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-300">
            <table className="w-full table-auto text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs">Order ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs">Order Code</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs">Items</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs">Tanggal</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs">Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs">Cancel</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => openOrderDetail(o)}
                    className="border-b last:border-b-0 border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">#{o.id}</td>
                    <td className="px-4 py-3 text-gray-700">{o.order_code || <span className="text-gray-400">-</span>}</td>
                    <td className="px-4 py-3 text-gray-700 truncate max-w-[140px]">{o.user_name}</td>
                    <td className="px-4 py-3 text-gray-600">{o.total_items}</td>
                    <td className="px-4 py-3 text-gray-600">{o.tanggal}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatRupiah(o.total_harga)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          o.status === "done"
                            ? "bg-green-100 text-green-700"
                            : o.status === "shipping"
                            ? "bg-blue-100 text-blue-700"
                            : o.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {statusLabels[o.status] || o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {o.status === "pending" && !o.cancel_requested_by && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(o.id, "cancelled"); }}
                          className="cursor-pointer text-xs font-medium px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 shadow-sm"
                        >
                          Request
                        </button>
                      )}
                      {o.status === "pending" && o.cancel_requested_by === "user" && !o.cancel_approved && (
                        <button
                          onClick={(e) => { e.stopPropagation(); acceptUserCancel(o.id); }}
                          className="cursor-pointer text-xs font-medium px-3 py-1.5 rounded-md bg-black text-white hover:bg-gray-800 shadow-sm"
                        >
                          Accept
                        </button>
                      )}
                      {o.status === "pending" && o.cancel_requested_by === "admin" && !o.cancel_approved && (
                        <span className="inline-block text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-700 font-medium">
                          Waiting user
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-pointer w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="shipping">Shipping</option>
                        <option value="done">Done</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                      Tidak ada data order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detail Order */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl w-[600px] max-h-[80vh] overflow-y-auto p-6 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                Detail Order #{selectedOrder.id}
              </h3>

              {loadingItems ? (
                <p>Memuat item...</p>
              ) : orderItems.length > 0 ? (
                <table className="w-full border-collapse text-sm text-gray-800">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-2 text-left">Produk</th>
                      <th className="p-2 text-left">Qty</th>
                      <th className="p-2 text-left">Harga</th>
                      <th className="p-2 text-left">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-100">
                        <td className="p-2">
                          <div className="flex items-start gap-2">
                            {item.product_image && (
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="w-10 h-10 object-cover rounded-md mt-0.5"
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.product_name}</p>
                              {item.product_code && (
                                <p className="text-[11px] text-gray-500">
                                  Code: {item.product_code}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">{item.qty}</td>
                        <td className="p-2">{formatRupiah(item.price)}</td>
                        <td className="p-2 font-semibold">
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Tidak ada item untuk order ini.</p>
              )}

              <button
                className="mt-5 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-900"
                onClick={closeModal}
              >
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
