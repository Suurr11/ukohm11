'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Product {
  id: number;
  product_code?: string; // + tambah
  nama_product: string;
  harga: number;
  scale_diecast: string;
  foto: string;
  stock: number;
  limited: number | boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [formData, setFormData] = useState({
    product_code: '', // + tambah
    nama_product: '',
    harga: '',
    scale_diecast: '',
    foto: null as File | null,
    stock: '',
    limited: false,
  });

  // 🔹 Ambil data produk saat pertama kali halaman dimuat
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/products');
      if (!res.ok) throw new Error('Gagal mengambil data produk');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
      toast.error('Tidak dapat mengambil data produk!');
    }
  };

  // 🔹 Preview gambar ketika user memilih file baru
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, foto: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // 🔹 Simpan (tambah / edit) produk
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formToSend = new FormData();
    formToSend.append('nama_product', formData.nama_product);
    if (formData.product_code.trim() !== '') formToSend.append('product_code', formData.product_code.trim()); // + kirim bila ada
    formToSend.append('harga', formData.harga);
    formToSend.append('scale_diecast', formData.scale_diecast);
    formToSend.append('stock', formData.stock);
    formToSend.append('limited', formData.limited ? '1' : '0');
    if (formData.foto) formToSend.append('foto', formData.foto);

    try {
      const url = editingProduct
        ? `http://127.0.0.1:8000/api/products/${editingProduct.id}`
        : 'http://127.0.0.1:8000/api/products';

      const method = editingProduct ? 'POST' : 'POST'; // Laravel pakai _method: PUT
      if (editingProduct) formToSend.append('_method', 'PUT');

      const res = await fetch(url, {
        method,
        body: formToSend,
      });

      if (!res.ok) throw new Error('Gagal menyimpan produk');

      toast.success(editingProduct ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!');
      await fetchProducts();
      closeForm();
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat menyimpan produk!');
    }
  };

  // 🔹 Hapus produk
  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus produk');
      toast.success('Produk berhasil dihapus!');
      await fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus produk!');
    }
  };

  // 🔹 Buka form (untuk tambah atau edit)
  const openForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        product_code: product.product_code || '', // + set
        nama_product: product.nama_product,
        harga: product.harga.toString(),
        scale_diecast: product.scale_diecast,
        foto: null,
        stock: product.stock.toString(),
        limited: product.limited === 1 || product.limited === true,
      });
      setPreviewImage(`http://127.0.0.1:8000/storage/images/${product.foto}`);
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  // 🔹 Tutup form & reset data
  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      product_code: '', // + reset
      nama_product: '',
      harga: '',
      scale_diecast: '',
      foto: null,
      stock: '',
      limited: false,
    });
    setPreviewImage('');
  };

  // 🔹 Format harga ke IDR
  const formatRupiah = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);

  return (
    <div className="p-6 text-black">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Produk</h1>
        <button
          onClick={() => openForm()}
          className=" cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Tambah Produk
        </button>
      </div>

      {/* FORM MODAL (mengganti form inline) */}
      {showForm && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/50" onClick={closeForm} />
          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h2>
                <button
                  onClick={closeForm}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Tutup"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Kode Produk (opsional / unik) */} {/* + input baru */}
                  <InputField
                    label="Kode Produk"
                    value={formData.product_code}
                    onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                  />

                  {/* Nama Produk */}
                  <InputField
                    label="Nama Produk"
                    value={formData.nama_product}
                    onChange={(e) => setFormData({ ...formData, nama_product: e.target.value })}
                    required
                  />

                  {/* Harga */}
                  <InputField
                    label="Harga (Rp)"
                    type="number"
                    value={formData.harga}
                    onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                    required
                  />

                  {/* Scale */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Scale Diecast</label>
                    <select
                      value={formData.scale_diecast}
                      onChange={(e) => setFormData({ ...formData, scale_diecast: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Pilih Scale</option>
                      {['1:64', '1:43', '1:24', '1:18', '1:12'].map((scale) => (
                        <option key={scale} value={scale}>
                          {scale}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stock */}
                  <InputField
                    label="Stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    min={0}
                  />

                  {/* Limited */}
                  <div className="md:col-span-2 flex items-center gap-3 mt-1">
                    <input
                      type="checkbox"
                      id="limited"
                      checked={formData.limited}
                      onChange={(e) => setFormData({ ...formData, limited: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="limited" className="text-sm font-medium cursor-pointer">
                      Produk Limited Edition
                    </label>
                  </div>

                  {/* Foto Produk */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Foto Produk</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    {previewImage && (
                      <div className="mt-3">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="w-40 h-40 object-contain rounded-lg border bg-gray-50"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            img.onerror = null;
                            if (previewImage.includes('/storage/images/')) {
                              img.src = previewImage.replace('/storage/images/', '/images/');
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="cursor-pointer px-5 py-2 rounded-lg border hover:bg-gray-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                  >
                    <Save size={18} />
                    {editingProduct ? 'Update Produk' : 'Simpan Produk'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* LIST PRODUK (tetap) */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Daftar Produk</h2>
          <span className="text-xs text-gray-500">
            Total: {products.length}
          </span>
        </div>
        {products.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">Belum ada produk.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {products.map((product) => (
              <li
                key={product.id}
                className="group flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition"
              >
                {/* Gambar */}
                <div className="w-16 h-16 flex items-center justify-center rounded-md border bg-gray-100 overflow-hidden">
                  <img
                    src={`http://127.0.0.1:8000/storage/images/${product.foto}`}
                    alt={product.nama_product}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.onerror = null;
                      img.src = `http://127.0.0.1:8000/images/${product.foto}`;
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-gray-800 truncate">
                      {product.nama_product}
                    </p>
                    {product.limited ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white">
                        LIMITED
                      </span>
                    ) : null}
                  </div>
                  {product.product_code && ( // + tampilkan kode
                    <p className="text-[10px] tracking-wide text-gray-500 mt-0.5">
                      Code: {product.product_code}
                    </p>
                  )}
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">
                    Rp {product.harga.toLocaleString('id-ID')}
                  </p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-600">
                    <span>Scale: {product.scale_diecast}</span>
                    <span>Stock: {product.stock}</span>
                  </div>
                </div>

                {/* Aksi */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openForm(product)}
                    className="px-3 py-1.5 text-xs rounded-md bg-yellow-500 text-white hover:bg-yellow-600 flex items-center gap-1"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// 🔹 Komponen input kecil agar tidak mengulang kode
function InputField({
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  min,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  min?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
