"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/app/api/api";
import toast, { Toaster } from "react-hot-toast";

type Role = "admin" | "user";
interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  photo_url?: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<{ name: string; email: string; role: Role; password: string }>({
    name: "",
    email: "",
    role: "user",
    password: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const photoPreview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);

  // clean centered toast
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
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
            <p className={`text-sm ${palette.text}`}>{message}</p>
          </motion.div>
        </div>
      ),
      { duration: 2200 }
    );
  };

  // confirm popup
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
              className="relative bg-white text-gray-800 rounded-xl shadow-2xl p-5 w-[380px]"
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

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", email: "", role: "user", password: "" });
    setPhoto(null);
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };
  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, role: u.role, password: "" });
    setPhoto(null);
    setModalOpen(true);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast("Gagal memuat pengguna", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("role", form.role);
      if (form.password) fd.append("password", form.password);
      if (photo) fd.append("photo", photo);

      if (editing) {
        await api.put(`/admin/users/${editing.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        showToast("User diperbarui", "success");
      } else {
        if (!form.password) {
          showToast("Password wajib diisi saat membuat akun", "error");
          return;
        }
        await api.post(`/admin/users`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        showToast("User dibuat", "success");
      }
      setModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Gagal menyimpan user", "error");
    }
  };

  const deleteUser = async (u: AdminUser) => {
    const ok = await confirmAction(`Hapus pengguna ${u.name}?`);
    if (!ok) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      showToast("User dihapus", "success");
      fetchUsers();
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Gagal menghapus user", "error");
    }
  };

  return (
    <motion.div
      className="flex-1 p-8 bg-gray-100 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Toaster />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h2>
        <button onClick={openAdd} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
          + Tambah User
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Memuat...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded-lg shadow bg-white">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-3 text-left">Foto</th>
                <th className="p-3 text-left">Nama</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id} className={idx % 2 ? "bg-gray-50" : "bg-white"}>
                  <td className="p-3">
                    <img
                      src={u.photo_url || "/no-image.png"}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                  </td>
                  <td className="p-3 font-medium text-gray-800">{u.name}</td>
                  <td className="p-3 text-gray-700">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${u.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 space-x-2">
                    <button onClick={() => openEdit(u)} className="px-3 py-1 text-sm rounded bg-yellow-500 text-white hover:bg-yellow-600">
                      Edit
                    </button>
                    <button onClick={() => deleteUser(u)} className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-500" colSpan={5}>
                    Belum ada pengguna.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add/Edit */}
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
              <h3 className="text-xl font-semibold mb-4">{editing ? "Edit User" : "Tambah User"}</h3>
              <form onSubmit={submitForm} className="space-y-4">
                <div className="flex items-center gap-4">
                  <img src={photoPreview || editing?.photo_url || "/no-image.png"} className="w-16 h-16 rounded-full object-cover border" alt="Preview" />
                  <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="text-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Nama</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      required
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">{editing ? "Password (opsional)" : "Password"}</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder={editing ? "Biarkan kosong jika tidak diubah" : ""}
                      {...(editing ? {} : { required: true })}
                    />
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
