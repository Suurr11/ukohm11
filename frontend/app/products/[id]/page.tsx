"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import api from "@/app/api/api";
import Header from "@/app/components/header";
import toast, { Toaster } from "react-hot-toast";
import { ShoppingCart, AlertTriangle, Star } from "lucide-react";

interface Product {
  id: number;
  product_code?: string; // + tambah
  nama_product: string;
  harga: number;
  scale_diecast: string;
  foto: string;
  deskripsi?: string;
  stok: number;
  sold_count?: number;   // + added
  rating_avg?: number;   // + added
  rating_count?: number; // + added
}

interface Review {
  id: number;
  user_name: string;
  rating: number;
  komentar: string;
}

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8000"; // + base URL

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // 🔹 Zoom lens
  const [zoomVisible, setZoomVisible] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      let raw = response.data;
      if (raw?.data) raw = raw.data;
      if (raw?.product) raw = raw.product;
      const stokRaw = raw?.stok ?? raw?.stock ?? 0; // sudah mendukung kedua kolom
      const stok = Number(stokRaw) || 0;
      setProduct({ ...raw, stok });
    } catch (err) {
      console.error(err);
      setError("Produk tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();

    const fetchReviews = async () => {
      try {
        const res = await api.get(`/products/${id}/reviews`);
        setReviews(res.data);
      } catch {
        console.warn("Ulasan gagal dimuat");
      }
    };

    fetchReviews();
  }, [id]);

  // 🔹 Add to Cart & fetch stok terbaru
  const handleAddToCart = async () => {
    if (!product || product.stok <= 0) return;
    setAdding(true);
    try {
      // Tambahkan ke cart
      const addRes = await api.post(`/cart`, { product_id: product.id, quantity: 1 });

      // Pakai stok terbaru dari response server (lebih cepat, tanpa fetch ulang)
      const returned = addRes.data?.product ?? addRes.data?.data ?? null;
      if (returned && (returned.stok !== undefined || returned.stock !== undefined)) {
        const newStock = Number(returned.stok ?? returned.stock ?? 0) || 0;
        setProduct((prev) => (prev ? { ...prev, stok: newStock } : prev));
      } else {
        // Fallback: fetch produk untuk memastikan stok sinkron
        const res = await api.get(`/products/${product.id}`);
        let updated = res.data;
        if (updated?.data) updated = updated.data;
        if (updated?.product) updated = updated.product;
        const updatedStok = Number(updated.stok ?? updated.stock ?? 0) || 0;
        setProduct((prev) => (prev ? { ...prev, stok: updatedStok } : prev));
      }

      toast.custom(
        (t) => (
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-md transition-all ${
              t.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
            } bg-black text-white`}
          >
            <ShoppingCart className="w-5 h-5 text-green-400" />
            <p className="text-sm font-medium">
              {product.nama_product} berhasil ditambahkan ke keranjang!
            </p>
          </div>
        ),
        { duration: 3000 }
      );
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 401) {
        toast.custom(
          (t) => (
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-md transition-all ${
                t.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
              } bg-[#E50914] text-white`}
            >
              <AlertTriangle className="w-5 h-5 text-yellow-300" />
              <p className="text-sm font-medium">
                Anda belum login. Silakan login untuk menambahkan ke keranjang.
              </p>
            </div>
          ),
          { duration: 3000 }
        );
        return;
      }
      toast.custom(
        (t) => (
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-md transition-all ${
              t.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
            } bg-[#E50914] text-white`}
          >
            <AlertTriangle className="w-5 h-5 text-yellow-300" />
            <p className="text-sm font-medium">
              {err.response?.data?.message || "Gagal menambahkan ke keranjang."}
            </p>
          </div>
        ),
        { duration: 3000 }
      );
    } finally {
      setAdding(false);
    }
  };

  // 🔹 Mouse move untuk lens
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();

    // Hitung posisi lens
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Batasi lens tidak keluar dari image
    const lensSize = 100; // ukuran lens 100x100px
    x = Math.max(lensSize / 2, Math.min(rect.width - lensSize / 2, x));
    y = Math.max(lensSize / 2, Math.min(rect.height - lensSize / 2, y));

    setLensPos({ x, y });
  };

  // Derived rating (fallback to compute from reviews if backend not provided)
  const computedAvg =
    reviews.length > 0
      ? reviews.reduce((a, b) => a + (b.rating || 0), 0) / reviews.length
      : 0;
  const ratingAvg = product?.rating_avg ?? computedAvg;
  const ratingCount = product?.rating_count ?? reviews.length;
  const rounded = Math.round(ratingAvg);
  const stars = Array.from({ length: 5 }).map((_, i) => (
    <span key={i} className={i < rounded ? "text-yellow-500" : "text-gray-300"}>
      ★
    </span>
  ));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-600">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full mb-4"
        />
        <p>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        <p>{error || "Produk tidak ditemukan."}</p>
      </div>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      <Toaster position="top-right" reverseOrder={false} containerStyle={{ top: 88 }} />
      <Header />

      <div className="max-w-6xl mx-auto py-24 px-6 flex flex-col lg:flex-row gap-10">
        {/* Gambar Produk dengan Lens Zoom */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 flex flex-col items-center"
        >
          <div
            ref={imageRef}
            className="relative w-full max-w-md h-[400px] rounded-2xl shadow-lg overflow-hidden cursor-zoom-in ring-1 ring-gray-200 bg-white"
            onMouseEnter={() => setZoomVisible(true)}
            onMouseLeave={() => setZoomVisible(false)}
            onMouseMove={handleMouseMove}
          >
            <img
              src={`${APP_BASE_URL}/storage/images/${product.foto}`}
              alt={product.nama_product}
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.onerror = null;
                img.src = "/no-image.png";
              }}
            />

            {/* Lens */}
            {zoomVisible && (
              <div
                className="absolute border-2 border-gray-300 rounded-full w-40 h-40 pointer-events-none"
                style={{
                  left: lensPos.x - 80,
                  top: lensPos.y - 80,
                  boxShadow: "0 0 0 10000px rgba(0,0,0,0.2)",
                  backgroundImage: `url(${APP_BASE_URL}/storage/images/${product.foto})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${imageRef.current?.offsetWidth! * 2}px ${imageRef.current?.offsetHeight! * 2}px`,
                  backgroundPosition: `-${lensPos.x * 2 - 48}px -${lensPos.y * 2 - 48}px`,
                }}
              />
            )}
          </div>
        </motion.div>

        {/* Detail Produk */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex-1 space-y-6"
        >
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            {product.nama_product}
          </h1>
          <p className="text-gray-600 text-lg">Scale: {product.scale_diecast}</p>

          {/* + Rating & Terjual */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="flex text-lg">{stars}</span>
              <span className="text-gray-700">{Number(ratingAvg || 0).toFixed(1)}{ratingCount ? ` (${ratingCount})` : ""}</span>
            </div>
            <div className="text-gray-700">
              Terjual {product.sold_count ?? 0}
            </div>
          </div>

          <p className="text-[#E50914] text-3xl font-bold">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(product.harga)}
          </p>

          <p
            className={`text-sm font-semibold ${
              product.stok > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {product.stok > 0
              ? `Stok tersedia: ${product.stok} unit`
              : "Stok habis"}
          </p>

          <motion.button
            whileTap={{ scale: product.stok > 0 ? 0.95 : 1 }}
            whileHover={{ scale: product.stok > 0 ? 1.03 : 1 }}
            disabled={adding || product.stok <= 0}
            className={`cursor-pointer w-full py-3 rounded-lg font-semibold transition ${
              adding
                ? "bg-gray-500 text-white"
                : product.stok > 0
                ? "bg-black hover:bg-gray-800 text-white"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
            onClick={handleAddToCart}
          >
            {product.stok > 0
              ? adding
                ? "Menambahkan..."
                : "Add to Cart"
              : "Stok Habis"}
          </motion.button>
        </motion.div>
      </div>

      {/* + DESKRIPSI PRODUK dipindah ke atas ulasan */}
      <section className="max-w-5xl mx-auto px-6 mt-2">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Deskripsi Produk</h2>
        {(() => {
          const fallback =
            "Produk ini memiliki detail realistis, kualitas tinggi, dan cocok untuk kolektor sejati.";
          // + pisahkan per paragraf (double line break), pertahankan line break di dalam paragraf
          const text = (product.deskripsi && String(product.deskripsi).trim()) || fallback;
          const paras = text.split(/\r?\n\r?\n/);
          return paras.map((p, idx) => (
            <p
              key={idx}
              className="text-gray-700 leading-relaxed text-base whitespace-pre-line mb-3 last:mb-0"
            >
              {p}
            </p>
          ));
        })()}
      </section>

      {/* Ulasan */}
      <section className="max-w-5xl mx-auto mt-8 px-6 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Ulasan Produk</h2>
        {reviews.length > 0 ? (
          <div className="space-y-5">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl shadow p-5 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {review.user_name}
                  </h4>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {review.komentar}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            Belum ada ulasan untuk produk ini.
          </p>
        )}
      </section>
    </main>
  );
}
