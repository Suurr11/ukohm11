"use client";
import Link from "next/link";
import Header from "../components/header";
import React, { useEffect, useState } from "react";
import { Trash2, Plus, Minus } from "lucide-react";
import api from "../api/api";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast"; // + toast

interface CartItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    nama_product: string;
    harga: number;
    foto: string;
  };
}
interface Address {
  id: number;
  name: string;
  phone: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  is_primary?: boolean;
}
interface Kurir {
  id: number;
  nama: string;
  kode: string;
  ongkir: number;
  aktif?: boolean;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [addrError, setAddrError] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [kurirList, setKurirList] = useState<Kurir[]>([]);
  const [selectedKurirId, setSelectedKurirId] = useState<number | null>(null);
  const router = useRouter();

  // Modal alamat
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [tempSelectedAddressId, setTempSelectedAddressId] = useState<number | null>(null);
  // + Modal kurir
  const [kurirModalOpen, setKurirModalOpen] = useState(false);
  const [tempSelectedKurirId, setTempSelectedKurirId] = useState<number | null>(null);

  // 🔹 Ambil data cart dari backend
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await api.get("/cart");
        setCartItems(response.data);
      } catch (error) {
        console.error("Gagal mengambil data cart:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  // 🔹 Ambil saved addresses user
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setAddrLoading(true);
        const res = await api.get("/addresses");
        const list: Address[] = res.data?.data ?? [];
        setAddresses(list);
        const primary = list.find((a) => a.is_primary);
        const initial = primary ? primary.id : list[0]?.id ?? null;
        setSelectedAddressId(initial);
      } catch (err) {
        console.error("Gagal memuat alamat:", err);
        setAddrError("Gagal memuat alamat");
      } finally {
        setAddrLoading(false);
      }
    };
    fetchAddresses();
  }, []);

  // Ambil daftar kurir
  useEffect(() => {
    const fetchKurir = async () => {
      try {
        const res = await api.get("/kurir");
        const list: Kurir[] = res.data || [];
        setKurirList(list);
        if (list.length > 0) setSelectedKurirId(list[0].id);
      } catch (e) {
        console.error("Gagal memuat kurir:", e);
      }
    };
    fetchKurir();
  }, []);

  // 🔹 Hapus item
  const handleRemove = async (id: number) => {
    try {
      await api.delete(`/cart/${id}`);
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Gagal menghapus item:", error);
    }
  };

  // 🔹 Ubah jumlah item (sinkron stok + batas stok)
  const handleQuantityChange = async (id: number, newQty: number) => {
    if (newQty < 1) return;
    const before = cartItems.find((c) => c.id === id)?.quantity;
    if (before === undefined) return;
    try {
      await api.put(`/cart/${id}`, { quantity: newQty });
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity: newQty } : item
        )
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Gagal memperbarui quantity.";
      toast.error(msg, { duration: 3000 });
      // qty tetap (tidak diubah)
    }
  };

  // Hitung subtotal, ongkir (sebagai number), dan total akhir
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.harga * item.quantity,
    0
  );
  const ongkir = Number(
    kurirList.find((k) => k.id === selectedKurirId)?.ongkir ?? 0
  ); // pastikan number
  const grandTotal = subtotal + ongkir; // number + number

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || null;
  const selectedKurir = kurirList.find((k) => k.id === selectedKurirId) || null;

  if (loading)
    return <p className="text-center mt-20 text-gray-600">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Toaster position="top-right" /> {/* + toaster */}
      <main className="max-w-6xl mx-auto mt-[100px] px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* 🔹 Kiri: Daftar Produk */}
        <section className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Keranjang Belanja
          </h2>

          {cartItems.length === 0 ? (
            <p className="text-gray-500">
              Keranjang kamu masih kosong.{" "}
              <Link href="/products" className="text-red-600 hover:underline">
                Lanjutkan belanja
              </Link>
            </p>
          ) : (
            <div className="space-y-5">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-gray-200 pb-4"
                >
                  {/* 📸 Gambar + Nama */}
                  <div className="flex items-center gap-4">
                    <img
                      src={`http://localhost:8000/storage/images/${item.product.foto}`}
                      alt={item.product.nama_product}
                      className="w-20 h-20 rounded-lg object-contain bg-gray-100"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {item.product.nama_product}
                      </p>
                      <p className="text-sm text-gray-500">
                        Rp {item.product.harga.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* 🔸 Quantity + Subtotal + Delete */}
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1">
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                        className="p-1 hover:text-red-600"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-semibold text-gray-700 w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                        className="p-1 hover:text-green-600"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <p className="font-semibold text-gray-800">
                      Rp {(item.product.harga * item.quantity).toLocaleString(
                        "id-ID"
                      )}
                    </p>

                    <button
                      onClick={() => handleRemove(item.id)}
                      title="Hapus produk"
                      className="p-2 rounded-full hover:bg-gray-200 transition"
                    >
                      <Trash2 className="text-red-600" size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 🔹 Kanan: Pilih Alamat + Kurir + Total dan Checkout */}
        <aside className="bg-white p-6 rounded-2xl shadow-md h-fit sticky top-28">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Ringkasan Belanja
          </h3>

          {/* 📍 Ringkasan & tombol pilih alamat (modal) */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-black">Alamat Pengiriman</span>
              <Link
                href="/accountsettings"
                className="text-sm text-blue-600 hover:underline"
              >
                Kelola Alamat
              </Link>
            </div>

            {/* Ringkasan alamat terpilih */}
            {addrLoading ? (
              <p className="text-sm text-black mt-2">Memuat alamat...</p>
            ) : addresses.length === 0 ? (
              <p className="text-sm text-black mt-2">
                Belum ada alamat. Tambahkan di Account Settings.
              </p>
            ) : selectedAddress ? (
              <div className="mt-2 p-3 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700">
                <div className="font-semibold text-gray-800">
                  {selectedAddress.name}{" "}
                  {selectedAddress.is_primary && <span className="text-green-600">(Primary)</span>}
                </div>
                <div>{selectedAddress.phone}</div>
                <div>
                  {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.postal_code},{" "}
                  {selectedAddress.country}
                </div>
              </div>
            ) : (
              <p className="text-sm text-black mt-2">Pilih alamat pengiriman.</p>
            )}
            {addrError && <p className="text-sm text-red-600 mt-2">{addrError}</p>}

            {/* Tombol buka modal */}
            <button
              onClick={() => {
                setTempSelectedAddressId(selectedAddressId);
                setAddressModalOpen(true);
              }}
              disabled={addrLoading || addresses.length === 0}
              className="mt-3 w-full inline-flex items-center justify-center px-3 py-2 rounded-md text-sm font-semibold bg-black text-white hover:bg-gray-800 disabled:bg-gray-300"
            >
              Pilih Alamat
            </button>
          </div>

          {/* 🚚 Kurir: tampilkan hanya yang terpilih + tombol modal bila > 1 */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-black">Kurir</span>
              {kurirList.length > 1 && (
                <button
                  onClick={() => {
                    setTempSelectedKurirId(selectedKurirId);
                    setKurirModalOpen(true);
                  }}
                  className="cursor-pointer text-sm text-blue-600 hover:underline"
                >
                  Pilih Kurir
                </button>
              )}
            </div>

            {kurirList.length === 0 ? (
              <p className="text-sm text-black mt-2">Kurir belum tersedia.</p>
            ) : selectedKurir ? (
              <div className="mt-2 p-3 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700">
                <div className="font-semibold text-gray-800">{selectedKurir.nama}</div>
                <div className="text-gray-600">Kode: {selectedKurir.kode}</div>
                <div className="text-gray-800 font-semibold">
                  Rp {Number(selectedKurir.ongkir).toLocaleString("id-ID")}
                </div>
              </div>
            ) : (
              <p className="text-sm text-black mt-2">Pilih kurir pengiriman.</p>
            )}
          </div>

          <div className="flex justify-between text-black mb-2">
            <span>Subtotal</span>
            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-black mb-2">
            <span>Ongkir</span>
            <span>Rp {ongkir.toLocaleString("id-ID")}</span>
          </div>

          <div className="border-t border-gray-300 pt-3 mb-6 flex justify-between text-lg font-semibold text-black">
            <span>Total</span>
            <span>Rp {grandTotal.toLocaleString("id-ID")}</span>
          </div>

          <button
            onClick={() => {
              if (!selectedAddressId || !selectedKurirId) return;
              router.push(
                `/checkout?address_id=${selectedAddressId}&kurir_id=${selectedKurirId}`
              );
            }}
            disabled={
              cartItems.length === 0 ||
              !selectedAddressId ||
              !selectedKurirId
            }
            className={`w-full text-center font-semibold py-3 rounded-lg transition ${
              cartItems.length === 0 ||
              !selectedAddressId ||
              !selectedKurirId
                ? "bg-gray-400 text-white"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            Checkout →
          </button>

          {/* Modal Pilih Alamat */}
          {addressModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setAddressModalOpen(false)}
              />
              <div className="relative bg-white rounded-xl shadow-2xl w-[520px] max-w-[95vw] p-6 text-black">
                <h4 className="text-lg font-semibold mb-3">Pilih Alamat Pengiriman</h4>
                <div className="max-h-[50vh] overflow-y-auto space-y-2">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-2 rounded-lg border cursor-pointer ${
                        tempSelectedAddressId === addr.id ? "border-black bg-gray-50" : "border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address-modal"
                        className="mt-1"
                        checked={tempSelectedAddressId === addr.id}
                        onChange={() => setTempSelectedAddressId(addr.id)}
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-gray-800">
                          {addr.name} {addr.is_primary && <span className="text-green-600">(Primary)</span>}
                        </div>
                        <div className="text-gray-600">{addr.phone}</div>
                        <div className="text-gray-700">
                          {addr.street}, {addr.city}, {addr.postal_code}, {addr.country}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setAddressModalOpen(false)}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAddressId(tempSelectedAddressId);
                      setAddressModalOpen(false);
                    }}
                    disabled={tempSelectedAddressId === null}
                    className="px-4 py-2 rounded bg-black hover:bg-gray-800 text-white text-sm disabled:bg-gray-300"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Pilih Kurir */}
          {kurirModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setKurirModalOpen(false)} />
              <div className="relative bg-white rounded-xl shadow-2xl w-[520px] max-w-[95vw] p-6 text-black">
                <h4 className="text-lg font-semibold mb-3">Pilih Kurir</h4>
                <div className="max-h-[50vh] overflow-y-auto space-y-2">
                  {kurirList.map((k) => (
                    <label
                      key={k.id}
                      className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer ${
                        tempSelectedKurirId === k.id ? "border-black bg-gray-50" : "border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="kurir-modal"
                        checked={tempSelectedKurirId === k.id}
                        onChange={() => setTempSelectedKurirId(k.id)}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-black">{k.nama}</div>
                        <div className="text-xs text-gray-600">{k.kode}</div>
                      </div>
                      <div className="text-sm font-semibold text-black">
                        Rp {Number(k.ongkir).toLocaleString("id-ID")}
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setKurirModalOpen(false)}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      setSelectedKurirId(tempSelectedKurirId);
                      setKurirModalOpen(false);
                    }}
                    disabled={tempSelectedKurirId === null}
                    className="px-4 py-2 rounded bg-black hover:bg-gray-800 text-white text-sm disabled:bg-gray-300"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
