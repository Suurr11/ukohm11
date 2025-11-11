"use client";
import React, { useEffect, useState } from "react";
import Header from "../components/header";
import api from "@/app/api/api";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

interface Product {
  id: number;
  nama_product: string;
  harga: number;
  foto: string;
}

interface CartItem {
  id: number;
  quantity: number;
  product: Product;
}

type Address = {
  id: number;
  name: string;
  phone: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  is_primary?: boolean;
};

type Kurir = { id: number; nama: string; kode: string; ongkir: number; logo_url?: string | null }; // + logo

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const addressId = params.get("address_id");
  const kurirIdParam = params.get("kurir_id"); // + baca kurir_id

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addrLoading, setAddrLoading] = useState(false);

  // + state kurir terpilih
  const [selectedKurir, setSelectedKurir] = useState<Kurir | null>(null);
  const [kurirLoading, setKurirLoading] = useState(false);

  // ⚙️ Pisahkan URL API dan URL Aset (storage)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8000";

  // 🔹 Ambil data keranjang dari backend via API
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await api.get("/cart");
        setCartItems(response.data);
      } catch (error) {
        console.error("Gagal mengambil cart:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  // 🔹 Ambil detail alamat terpilih berdasar address_id dari query
  useEffect(() => {
    const fetchAddress = async () => {
      if (!addressId) {
        setSelectedAddress(null);
        return;
      }
      try {
        setAddrLoading(true);
        const res = await api.get(`/addresses/${addressId}`);
        const a = res.data?.data ?? res.data?.address ?? null;
        setSelectedAddress(a || null);
      } catch (e) {
        // fallback: ambil dari list lalu cari berdasarkan id
        try {
          const listRes = await api.get("/addresses");
          const list = listRes.data?.data ?? [];
          const found = list.find((x: any) => String(x.id) === String(addressId)) || null;
          setSelectedAddress(found);
        } catch {
          setSelectedAddress(null);
        }
      } finally {
        setAddrLoading(false);
      }
    };
    fetchAddress();
  }, [addressId]);

  // + Ambil data kurir terpilih jika kurir_id tersedia
  useEffect(() => {
    const fetchKurir = async () => {
      if (!kurirIdParam) {
        setSelectedKurir(null);
        return;
      }
      try {
        setKurirLoading(true);
        const res = await api.get("/kurir");
        const list: Kurir[] = res.data || [];
        const found = list.find((k) => String(k.id) === String(kurirIdParam)) || null;
        setSelectedKurir(found);
      } catch (e) {
        setSelectedKurir(null);
      } finally {
        setKurirLoading(false);
      }
    };
    fetchKurir();
  }, [kurirIdParam]);

  // 💰 Hitung harga
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.harga * item.quantity,
    0
  );
  const ongkir = Number(selectedKurir?.ongkir ?? 0); // + pastikan number
  const grandTotal = subtotal + ongkir; // + sama seperti di cart

  // ✅ Helper: toast card di pojok kanan atas (clean + modern)
  const notify = (
    type: "success" | "error" | "info",
    title: string,
    desc?: string
  ) => {
    const palette =
      type === "success"
        ? { ring: "ring-green-200", dot: "bg-green-600", text: "text-green-800" }
        : type === "error"
        ? { ring: "ring-red-200", dot: "bg-red-600", text: "text-red-800" }
        : { ring: "ring-blue-200", dot: "bg-blue-600", text: "text-blue-800" };

    toast.custom(
      () => (
        <div className={`w-[320px] rounded-xl bg-white shadow-xl ring-1 ${palette.ring} p-4 flex gap-3`}>
          <div className={`h-8 w-8 rounded-full ${palette.dot} flex items-center justify-center text-white shrink-0`}>
            {type === "success" ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : type === "error" ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 19a7 7 0 110-14 7 7 0 010 14z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${palette.text}`}>{title}</p>
            {desc && <p className="text-xs text-gray-600 mt-0.5">{desc}</p>}
          </div>
        </div>
      ),
      { duration: 2200 }
    );
  };

  // 💳 Proses pembayaran Midtrans
  const handlePay = async () => {
    if (grandTotal <= 0) {
      notify("error", "Keranjang kosong");
      return;
    }
    if (!addressId) {
      notify("error", "Alamat belum dipilih", "Silakan kembali ke keranjang untuk memilih alamat.");
      return;
    }
    setProcessing(true);
    try {
      const res = await api.post("/checkout", { total: grandTotal });
      const snapToken = res.data?.snap_token;
      const clientKey = res.data?.client_key;

      if (!snapToken) throw new Error("Gagal membuat transaksi");

      // 🧩 Load Midtrans script
      const scriptId = "midtrans-snap";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src =
          clientKey && clientKey.startsWith("SB-")
            ? "https://app.sandbox.midtrans.com/snap/snap.js"
            : "https://app.midtrans.com/snap/snap.js";
        script.setAttribute("data-client-key", clientKey || "");
        document.body.appendChild(script);
        await new Promise<void>((resolve) => (script.onload = () => resolve()));
      }

      // @ts-ignore
      window.snap.pay(snapToken, {
        onSuccess: async (result: any) => {
          await api.post("/checkout/confirm", {
            order_id: res.data?.order_id,
            total: grandTotal,
            transaction_status: result?.transaction_status || "success",
            address_id: Number(addressId),
            kurir_id: kurirIdParam ? Number(kurirIdParam) : null,
          });
          notify("success", "Pembayaran Berhasil", "Terima kasih! Pesanan Anda sedang diproses.");
          router.push("/payment-success"); // redirect ke payment-success
        },
        onPending: () => {
          notify("info", "Pembayaran Pending", "Silakan cek email Anda untuk detailnya.");
          router.push("/");
        },
        onError: () => {
          notify("error", "Pembayaran gagal", "Terjadi kesalahan saat pembayaran.");
        },
      });
    } catch (err: any) {
      notify("error", "Gagal melakukan pembayaran", err?.response?.data?.message || err?.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return <p className="text-center mt-20 text-gray-600">Memuat data...</p>;

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <Header />
      <Toaster
        position="top-right"
        toastOptions={{
          // Biarkan card custom yang mengatur style
          style: { background: "transparent", boxShadow: "none", padding: 0 },
        }}
      />
      <main className="max-w-5xl mx-auto mt-[100px] px-6 py-12">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        {/* 📍 Alamat Pengiriman (dari saved addresses) */}
        <section className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Alamat Pengiriman</h2>
          {addrLoading ? (
            <p className="text-gray-600">Memuat alamat...</p>
          ) : !addressId ? (
            <p className="text-gray-600">
              Alamat belum dipilih. Silakan kembali ke keranjang dan pilih alamat.
            </p>
          ) : selectedAddress ? (
            <div className="text-sm">
              <div className="font-semibold text-black">
                {selectedAddress.name}{" "}
                {selectedAddress.is_primary && (
                  <span className="text-green-600">(Primary)</span>
                )}
              </div>
              <div className="text-gray-600">📞 {selectedAddress.phone}</div>
              <div className="text-gray-700">
                {selectedAddress.street}, {selectedAddress.city},{" "}
                {selectedAddress.postal_code}, {selectedAddress.country}
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Alamat tidak ditemukan.</p>
          )}
        </section>

        {/* 🛒 Daftar Produk */}
        <section className="bg-white rounded-2xl shadow-md p-6 mb-6">
          {cartItems.length === 0 ? (
            <p className="text-gray-600">Keranjang kosong.</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b border-gray-200 pb-3"
                >
                  <div className="flex items-center gap-4">
                    {/* 🖼️ Gambar produk langsung dari public/storage */}
                    <img
                      src={`${APP_BASE_URL}/storage/images/${item.product.foto}`}
                      alt={item.product.nama_product}
                      className="w-20 h-20 object-contain rounded-md border border-gray-300 bg-white"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.onerror = null;
                        img.src = `${APP_BASE_URL}/images/${item.product.foto}`;
                      }}
                    />
                    <div>
                      <p className="font-semibold">{item.product.nama_product}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} x Rp{" "}
                        {item.product.harga.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold">
                    Rp{" "}
                    {(item.product.harga * item.quantity).toLocaleString(
                      "id-ID"
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 🚚 Rincian Kurir */}
        <section className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Kurir</h2>
          {kurirLoading ? (
            <p className="text-gray-600">Memuat kurir...</p>
          ) : selectedKurir ? (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-semibold">{selectedKurir.nama}</p>
                  <p className="text-gray-600">Kode: {selectedKurir.kode}</p>
                </div>
              </div>
              <p className="font-semibold">
                Rp {Number(selectedKurir.ongkir).toLocaleString("id-ID")}
              </p>
            </div>
          ) : (
            <p className="text-gray-600">Kurir tidak dipilih.</p>
          )}
        </section>

        {/* 💰 Total dan Tombol Bayar */}
        <section className="bg-white rounded-2xl shadow-md p-6 flex justify-between items-center">
          <div>
            <p className="text-gray-600">Subtotal</p>
            <p className="font-semibold mb-2">
              Rp {subtotal.toLocaleString("id-ID")}
            </p>
            <p className="text-gray-600">Ongkir</p>
            <p className="font-semibold mb-2">
              Rp {ongkir.toLocaleString("id-ID")}
            </p>
            <p className="text-gray-600">Total Pembayaran</p>
            <p className="text-2xl font-bold">
              Rp {grandTotal.toLocaleString("id-ID")}
            </p>
          </div>
          <button
            onClick={handlePay}
            disabled={processing || cartItems.length === 0 || !addressId}
            className={`px-6 py-3 rounded-lg text-white font-semibold ${
              processing || !addressId ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {processing ? "Memproses..." : "Checkout"}
          </button>
        </section>
      </main>
    </div>
  );
}
