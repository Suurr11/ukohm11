"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/app/api/api";
import toast, { Toaster } from "react-hot-toast";

type Kurir = { id: number; nama: string; kode: string; ongkir: number; aktif?: boolean | number; /* logo_url dihapus */ };

export default function AdminKurirPage() {
  const [items, setItems] = useState<Kurir[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Kurir | null>(null);
  const [form, setForm] = useState<{ nama: string; kode: string; ongkir: string; aktif: boolean }>({
    nama: "", kode: "", ongkir: "0", aktif: true,
  });

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    const palette =
      type === "success"
        ? { border: "border-green-200", text: "text-green-800", dot: "bg-green-500" }
        : type === "error"
        ? { border: "border-red-200", text: "text-red-800", dot: "bg-red-500" }
        : { border: "border-gray-200", text: "text-gray-800", dot: "bg-gray-500" };

    toast.custom(
      () => (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            className={`pointer-events-auto bg-white rounded-xl shadow-xl border ${palette.border} px-4 py-3 flex items-center gap-3`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${palette.dot}`} />
            <p className={`text-sm ${palette.text}`}>{msg}</p>
          </motion.div>
        </div>
      ),
      { duration: 2000 }
    );
  };

  const confirmAction = (message: string) =>
    new Promise<boolean>((resolve) => {
      toast.custom(
        (t) => (
          <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => { toast.dismiss(t.id); resolve(false); }} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 12 }}
              className="relative bg-white text-gray-800 rounded-xl shadow-2xl p-5 w-[380px]"
            >
              <p className="text-sm">{message}</p>
              <div className="mt-4 flex justify-end gap-2">
                <button className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300" onClick={() => { toast.dismiss(t.id); resolve(false); }}>
                  Batal
                </button>
                <button className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700" onClick={() => { toast.dismiss(t.id); resolve(true); }}>
                  Ya
                </button>
              </div>
            </motion.div>
          </div>
        ),
        { duration: Infinity }
      );
    });

  const openAdd = () => {
    setEditing(null);
    setForm({ nama: "", kode: "", ongkir: "0", aktif: true });
    setModalOpen(true);
  };

  const openEdit = (row: Kurir) => {
    setEditing(row);
    setForm({
      nama: row.nama,
      kode: row.kode,
      ongkir: String(row.ongkir ?? 0),
      aktif: Boolean(row.aktif ?? true),
    });
    setModalOpen(true);
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/kurir");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast("Gagal memuat kurir", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("nama", form.nama.trim());
    fd.append("kode", form.kode.trim().toUpperCase());
    fd.append("ongkir", String(Number(form.ongkir) || 0));
    fd.append("aktif", form.aktif ? "1" : "0");
    // tidak kirim logo

    try {
      if (editing) {
        await api.put(`/admin/kurir/${editing.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        showToast("Kurir diperbarui", "success");
      } else {
        await api.post(`/admin/kurir`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        showToast("Kurir dibuat", "success");
      }
      setModalOpen(false);
      fetchList();
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Gagal menyimpan kurir", "error");
    }
  };

  const deleteRow = async (row: Kurir) => {
    const ok = await confirmAction(`Hapus kurir ${row.nama}?`);
    if (!ok) return;
    try {
      await api.delete(`/admin/kurir/${row.id}`);
      showToast("Kurir dihapus", "success");
      fetchList();
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Gagal menghapus kurir", "error");
    }
  };

  return (
    <motion.div className="flex-1 p-8 bg-gray-50 min-h-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Toaster />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manajemen Kurir</h2>
        <button onClick={openAdd} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
          + Tambah Kurir
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Memuat...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded-lg shadow bg-white">
            <thead className="bg-gray-800 text-white">
              <tr>
                {/* Kolom Logo dihapus */}
                <th className="p-3 text-left">Nama</th>
                <th className="p-3 text-left">Kode</th>
                <th className="p-3 text-left">Ongkir</th>
                <th className="p-3 text-left">Aktif</th>
                <th className="p-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((k, idx) => (
                <tr key={k.id} className={idx % 2 ? "bg-gray-50" : "bg-white"}>
                  {/* Kolom Logo dihapus */}
                  <td className="p-3 font-medium text-gray-800">{k.nama}</td>
                  <td className="p-3 text-gray-700">{k.kode}</td>
                  <td className="p-3 text-gray-700">Rp {Number(k.ongkir || 0).toLocaleString("id-ID")}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs rounded ${k.aktif ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                      {k.aktif ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="p-3 space-x-2">
                    <button onClick={() => openEdit(k)} className="px-3 py-1 text-sm rounded bg-yellow-500 text-white hover:bg-yellow-600">
                      Edit
                    </button>
                    <button onClick={() => deleteRow(k)} className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-500" colSpan={5}>
                    Belum ada kurir.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah/Edit */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
            <motion.div
              className="relative bg-white rounded-xl shadow-2xl w-[520px] max-w-[95vw] p-6"
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
            >
              <h3 className="text-xl font-semibold mb-4">{editing ? "Edit Kurir" : "Tambah Kurir"}</h3>
              <form onSubmit={submitForm} className="space-y-4">
                {/* Bagian upload logo dihapus */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Nama</label>
                    <input
                      type="text"
                      value={form.nama}
                      onChange={(e) => setForm({ ...form, nama: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Kode</label>
                    <input
                      type="text"
                      value={form.kode}
                      onChange={(e) => setForm({ ...form, kode: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Ongkir (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.ongkir}
                      onChange={(e) => setForm({ ...form, ongkir: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.aktif}
                        onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                      />
                      Aktif
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm">
                    Batal
                  </button>
                  <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm">
                    {editing ? "Simpan" : "Buat"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
