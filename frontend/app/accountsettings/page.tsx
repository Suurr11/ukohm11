"use client";
import React, { useState, useEffect } from "react";
import Header from "../components/header";
import { motion, AnimatePresence } from "framer-motion";
import { User, MapPin, BookMarked } from "lucide-react";
import api from "@/app/api/api";

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

export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [account, setAccount] = useState({
    name: "",
    email: "",
    place_of_birth: "",
    date_of_birth: "",
  });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    postal_code: "",
    country: "",
  });
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrError, setAddrError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // NEW: editing state untuk saved addresses
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<Address>>({});
  const [editSaving, setEditSaving] = useState(false);

  // NEW: state untuk foto profil
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // + keys untuk localStorage
  const DRAFT_KEY = "account_draft_v1";
  const EDIT_KEY = "account_editing";
  const TAB_KEY = "account_active_tab";

  // + Pulihkan tab aktif dari localStorage saat mount
  useEffect(() => {
    const savedTab =
      typeof window !== "undefined" ? localStorage.getItem(TAB_KEY) : null;
    if (savedTab) setActiveTab(savedTab);
  }, []);
  // + Simpan tab aktif saat berubah
  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem(TAB_KEY, activeTab);
  }, [activeTab]);

  // ============================= FETCH USER & ADDRESSES =============================
  useEffect(() => {
    let mounted = true;
    const fetchUserAndAddresses = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const userRes = await api.get("/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const u = userRes.data?.user;

        // + Pulihkan draft jika ada, prioritaskan nilai draft
        const draftRaw = localStorage.getItem(DRAFT_KEY);
        const draft = draftRaw ? JSON.parse(draftRaw) : null;
        const editingFlag = localStorage.getItem(EDIT_KEY) === "true";

        if (mounted && u) {
          // { changed code } selalu ambil name & email dari server; draft hanya dipakai untuk field yang bisa diedit dan tidak kosong
          const server = {
            name: u.name || "",
            email: u.email || "",
            place_of_birth: u.place_of_birth || "",
            date_of_birth: u.date_of_birth || "",
          };
          const nonEmpty = (v: any) =>
            typeof v === "string" ? v.trim() !== "" : v !== undefined && v !== null;

          // opsional: bersihkan draft name/email lama
          if (draft && (draft.name !== undefined || draft.email !== undefined)) {
            const cleaned = { ...draft };
            delete (cleaned as any).name;
            delete (cleaned as any).email;
            localStorage.setItem(DRAFT_KEY, JSON.stringify(cleaned));
          }

          const merged = editingFlag && draft
            ? {
                ...server,
                place_of_birth: nonEmpty(draft.place_of_birth) ? draft.place_of_birth : server.place_of_birth,
                date_of_birth: nonEmpty(draft.date_of_birth) ? draft.date_of_birth : server.date_of_birth,
              }
            : server;

          setAccount(merged);
          setIsEditing(editingFlag);
          setPhotoUrl(u.photo_url || null);
        }

        setAddrLoading(true);
        const res = await api.get("/addresses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = res.data?.data ?? [];
        if (mounted) setAddresses(list);
      } catch (err) {
        console.error("Failed to fetch user/addresses", err);
        if (mounted) setAddrError("Gagal memuat data pengguna atau alamat");
      } finally {
        if (mounted) setAddrLoading(false);
      }
    };

    fetchUserAndAddresses();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") fetchUserAndAddresses();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // + Simpan draft saat sedang edit dan field berubah
  useEffect(() => {
    if (isEditing) {
      // { changed code } hanya simpan field yang bisa diedit agar tidak menimpa name/email dari server
      const draftOnly = {
        place_of_birth: account.place_of_birth,
        date_of_birth: account.date_of_birth,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftOnly));
      localStorage.setItem(EDIT_KEY, "true");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.place_of_birth, account.date_of_birth, isEditing]);

  // ============================= ACCOUNT HANDLERS =============================
  const handleEditToggle = async () => {
    if (!isEditing) {
      setIsEditing(true);
      localStorage.setItem(EDIT_KEY, "true");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Token tidak ditemukan, silakan login kembali.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      // { changed code } ambil user yang diupdate dari response untuk sinkron local state
      const updateRes = await api.put(
        "/user",
        {
          place_of_birth: account.place_of_birth || null,
          date_of_birth: account.date_of_birth || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = updateRes.data?.user;
      if (updatedUser) {
        setAccount((prev) => ({
          ...prev,
          name: updatedUser.name || prev.name,
          email: updatedUser.email || prev.email,
          place_of_birth: updatedUser.place_of_birth || "",
          date_of_birth: updatedUser.date_of_birth || "",
        }));
      }
      setMessage("✅ Data berhasil disimpan!");
      setIsEditing(false);
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(EDIT_KEY);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // hanya huruf dan spasi untuk nama (unicode)
    if (name === "name") {
      const v = value.replace(/[^\p{L}\s]/gu, "");
      setAccount({ ...account, name: v });
    } else {
      setAccount({ ...account, [name]: value });
    }
  };

  // ============================= ADDRESS HANDLERS =============================
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
  };

  const handleSaveAddress = async () => {
    setAddrError("");
    setMessage("");
    const token = localStorage.getItem("token");
    if (!token) {
      setAddrError("Token tidak ditemukan, silakan login kembali.");
      return;
    }

    if (
      !newAddress.name ||
      !newAddress.phone ||
      !newAddress.street ||
      !newAddress.city ||
      !newAddress.postal_code ||
      !newAddress.country
    ) {
      setAddrError("Harap isi semua field alamat");
      return;
    }

    try {
      setAddrLoading(true);
      const res = await api.post(
        "/addresses",
        {
          name: newAddress.name,
          phone: newAddress.phone,
          street: newAddress.street,
          city: newAddress.city,
          postal_code: newAddress.postal_code,
          country: newAddress.country,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const created = res.data?.data ?? null;
      if (created) setAddresses((prev) => [...prev, created]);

      setNewAddress({
        name: "",
        phone: "",
        street: "",
        city: "",
        postal_code: "",
        country: "",
      });
      setMessage("✅ Alamat berhasil disimpan!");
    } catch (err: any) {
      console.error("Error saving address:", err.response || err);
      setAddrError(err.response?.data?.message || "Gagal menyimpan alamat");
    } finally {
      setAddrLoading(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAddrError("Token tidak ditemukan, silakan login kembali.");
      return;
    }

    try {
      setAddrLoading(true);
      await api.delete(`/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete address", err);
      setAddrError("Gagal menghapus alamat");
    } finally {
      setAddrLoading(false);
    }
  };

  // ============================= SET PRIMARY ADDRESS =============================
  const handleSetPrimary = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAddrError("Token tidak ditemukan, silakan login kembali.");
      return;
    }

    try {
      await api.put(
        `/addresses/${id}/primary`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_primary: a.id === id }))
      );
      setMessage("✅ Alamat utama berhasil diatur!");
    } catch (err) {
      console.error("Gagal mengatur alamat utama", err);
      setAddrError("Gagal mengatur alamat utama");
    }
  };

  // NEW: mulai edit baris alamat
  const startEdit = (a: Address) => {
    setEditingId(a.id);
    setEditingData({
      name: a.name,
      phone: a.phone,
      street: a.street,
      city: a.city,
      postal_code: a.postal_code,
      country: a.country,
    });
  };

  // NEW: ubah field saat edit
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingData({ ...editingData, [e.target.name]: e.target.value });
  };

  // NEW: simpan perubahan alamat ke server
  const handleSaveEdit = async (id: number) => {
    setAddrError("");
    setEditSaving(true);
    try {
      const res = await api.put(`/addresses/${id}`, editingData);
      const updated = res.data?.data ?? res.data ?? null;
      if (updated) {
        setAddresses((prev) => prev.map((a) => (a.id === id ? updated : a)));
      } else {
        // fallback: update local state with editingData
        setAddresses((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...(editingData as Address) } : a))
        );
      }
      setEditingId(null);
      setEditingData({});
      setMessage("✅ Alamat diperbarui");
    } catch (err: any) {
      console.error("Gagal menyimpan edit alamat:", err);
      setAddrError(err.response?.data?.message || "Gagal menyimpan alamat");
    } finally {
      setEditSaving(false);
    }
  };

  // NEW: batalkan edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  // ============================= UPLOAD FOTO PROFIL =============================
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Token tidak ditemukan, silakan login kembali.");
      return;
    }
    try {
      setUploadingPhoto(true);
      const fd = new FormData();
      fd.append("photo", file);
      const res = await api.post("/user/photo", fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.photo_url || null;
      if (url) setPhotoUrl(url);
      setMessage("✅ Foto profil berhasil diperbarui!");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Gagal mengunggah foto profil");
    } finally {
      setUploadingPhoto(false);
      // reset file input
      e.currentTarget.value = "";
    }
  };

  // ============================= UI =============================
  const menuItems = [
    { name: "Account Details", icon: <User size={20} />, id: "details" },
    { name: "Delivery Addresses", icon: <MapPin size={20} />, id: "address" },
    { name: "Saved Addresses", icon: <BookMarked size={20} />, id: "saved" },
  ];

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-black">
      <Header />
      <div className="pt-24 px-6 md:px-16 pb-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10">
          {/* Sidebar Menu */}
          <aside className="w-full md:w-1/4 bg-white rounded-2xl shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            <nav className="flex flex-col gap-4 text-base">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 py-2 px-3 rounded-lg transition text-left cursor-pointer ${
                    activeTab === item.id
                      ? "bg-black text-white shadow-md"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-2xl shadow p-8">
            <AnimatePresence mode="wait">
              {/* ACCOUNT DETAILS */}
              {activeTab === "details" && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold mb-6">Account Details</h2>

                  {/* Grid: Form kiri, Foto profil kanan */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {/* Form Akun */}
                    <div className="md:col-span-2 flex flex-col gap-6 max-w-2xl">
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={account.name}
                          readOnly
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-black cursor-default"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">
                          Email
                        </label>
                        <input
                          type="text"
                          name="email"
                          value={account.email}
                          readOnly
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-black cursor-default"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-500 mb-1">
                          Place of Birth
                        </label>
                        <input
                          type="text"
                          name="place_of_birth"
                          value={account.place_of_birth}
                          onChange={handleChange}
                          readOnly={!isEditing}
                          placeholder="Kota/Kabupaten"
                          className={`w-full border border-gray-300 rounded-lg px-4 py-2 text-black ${
                            isEditing
                              ? "focus:ring-2 focus:ring-black outline-none bg-white"
                              : "bg-gray-50 cursor-default"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-500 mb-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          name="date_of_birth"
                          value={account.date_of_birth || ""}
                          onChange={handleChange}
                          readOnly={!isEditing}
                          className={`w-full border border-gray-300 rounded-lg px-4 py-2 text-black ${
                            isEditing
                              ? "focus:ring-2 focus:ring-black outline-none bg-white"
                              : "bg-gray-50 cursor-default"
                          }`}
                        />
                      </div>

                      <button
                        onClick={handleEditToggle}
                        className="mt-2 bg-black text-white px-6 py-2 rounded-lg hover:bg-[#E50914] transition font-semibold w-fit"
                        disabled={loading}
                      >
                        {isEditing
                          ? loading
                            ? "Saving..."
                            : "Save Changes"
                          : "Edit"}
                      </button>
                      {message && <p className="text-sm mt-2">{message}</p>}
                    </div>

                    {/* Foto Profil (kanan) */}
                    <div className="md:col-span-1">
                      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col items-center">
                        <div className="w-28 h-28 rounded-full bg-gray-200 overflow-hidden ring-1 ring-gray-300">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                              No Photo
                            </div>
                          )}
                        </div>
                        <p className="mt-3 text-sm text-gray-700 font-medium">
                          Profile Photo
                        </p>
                        <label className="mt-3 inline-flex items-center justify-center px-3 py-2 rounded-md text-sm font-semibold bg-black text-white hover:bg-gray-800 cursor-pointer">
                          {uploadingPhoto ? "Uploading..." : "Change Photo"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoFileChange}
                            disabled={uploadingPhoto}
                          />
                        </label>
                        <p className="mt-2 text-xs text-gray-500 text-center">
                          Max 2MB. jpg, jpeg, png.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* DELIVERY ADDRESS INPUT */}
              {activeTab === "address" && (
                <motion.div
                  key="address"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold mb-6">
                    Delivery Addresses
                  </h2>
                  <div className="flex flex-col gap-6 max-w-lg">
                    {[
                      { label: "Full Name", name: "name" },
                      { label: "Phone Number", name: "phone" },
                      { label: "Street Address", name: "street" },
                      { label: "City", name: "city" },
                      { label: "Postal Code", name: "postal_code" },
                      { label: "Country", name: "country" },
                    ].map((f) => (
                      <div key={f.name}>
                        <label className="block text-sm text-gray-500 mb-1">
                          {f.label}
                        </label>
                        <input
                          type="text"
                          name={f.name}
                          value={(newAddress as any)[f.name]}
                          onChange={handleAddressChange}
                          placeholder={`Enter your ${f.label.toLowerCase()}`}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black bg-gray-50 focus:ring-2 focus:ring-black outline-none"
                        />
                      </div>
                    ))}
                    <button
                      onClick={handleSaveAddress}
                      className="cursor-pointer mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-[#E50914] transition font-semibold w-fit"
                    >
                      {addrLoading ? "Saving..." : "Save Address"}
                    </button>
                    {addrError && (
                      <p className="text-sm text-red-500 mt-2">{addrError}</p>
                    )}
                    {message && (
                      <p className="text-sm mt-2 text-gray-700">{message}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* SAVED ADDRESSES */}
              {activeTab === "saved" && (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold mb-6">
                    Saved Addresses
                  </h2>
                  {addrError && (
                    <p className="text-red-500 text-sm mb-2">{addrError}</p>
                  )}
                  {addrLoading ? (
                    <p>Loading...</p>
                  ) : addresses.length === 0 ? (
                    <p className="text-gray-600">
                      You have no saved addresses yet.
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {addresses.map((a) => (
                        <div
                          key={a.id}
                          className={`border border-gray-300 rounded-lg p-4 bg-gray-50 flex justify-between items-start ${
                            a.is_primary ? "border-black" : ""
                          }`}
                        >
                          <div className="w-full">
                            {editingId === a.id ? (
                              <div className="space-y-2">
                                <input
                                  name="name"
                                  value={(editingData.name as string) || ""}
                                  onChange={handleEditChange}
                                  className="w-full border rounded px-3 py-2"
                                />
                                <input
                                  name="phone"
                                  value={(editingData.phone as string) || ""}
                                  onChange={handleEditChange}
                                  className="w-full border rounded px-3 py-2"
                                />
                                <input
                                  name="street"
                                  value={(editingData.street as string) || ""}
                                  onChange={handleEditChange}
                                  className="w-full border rounded px-3 py-2"
                                />
                                <div className="flex gap-2">
                                  <input
                                    name="city"
                                    value={(editingData.city as string) || ""}
                                    onChange={handleEditChange}
                                    className="flex-1 border rounded px-3 py-2"
                                  />
                                  <input
                                    name="postal_code"
                                    value={(editingData.postal_code as string) || ""}
                                    onChange={handleEditChange}
                                    className="w-36 border rounded px-3 py-2"
                                  />
                                </div>
                                <input
                                  name="country"
                                  value={(editingData.country as string) || ""}
                                  onChange={handleEditChange}
                                  className="w-full border rounded px-3 py-2"
                                />
                              </div>
                            ) : (
                              <div>
                                <p className="font-semibold text-black-500">
                                  {a.name}{" "}
                                  {a.is_primary && (
                                    <span className="text-sm text-green-600 ml-1">
                                      (Primary)
                                    </span>
                                  )}
                                </p>
                                <p className="text-gray-600 text-sm"> {a.phone}</p>
                                <p className="text-gray-600 text-sm">
                                  {a.street}, {a.city}, {a.postal_code}
                                </p>
                                <p className="text-gray-600 text-sm">{a.country}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {editingId === a.id ? (
                              <>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveEdit(a.id)}
                                    disabled={editSaving}
                                    className="text-sm bg-black text-white px-3 py-1 rounded"
                                  >
                                    {editSaving ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="text-sm text-gray-600 px-3 py-1 rounded border"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                {!a.is_primary && (
                                  <button
                                    onClick={() => handleSetPrimary(a.id)}
                                    className="cursor-pointer text-sm text-blue-600 hover:underline"
                                  >
                                    Atur Sebagai Utama
                                  </button>
                                )}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => startEdit(a)}
                                    className="text-sm text-gray-800 px-3 py-1 rounded border"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAddress(a.id)}
                                    className="cursor-pointer text-sm text-red-500 hover:underline"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
