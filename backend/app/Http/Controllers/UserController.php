<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use App\Mail\LoginOtpMail;
use App\Models\User;
use Exception;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Http; // + pastikan import ada
use Illuminate\Support\Facades\Cache; // + cache

class UserController extends Controller
{
    /**
     * =====================================================
     * 🧩 REGISTER — Buat akun baru & kirim OTP ke email
     * =====================================================
     */
    public function register(Request $request)
    {
        $request->validate([
            'name'            => 'required|string|max:255|regex:/^[\pL\s]+$/u',
            'email'           => 'required|email|unique:users,email',
            'password'        => 'required|string|min:6',
            'captcha_id'      => 'nullable|string',
            'captcha_answer'  => 'nullable|string',
            'captcha'         => 'nullable|string', // reCAPTCHA lama
        ]);

        // Jika ada captcha_id → gunakan image captcha
        if ($request->filled('captcha_id')) {
            $expected = Cache::get('captcha:' . $request->captcha_id);
            if (!$expected || strtoupper(trim($request->captcha_answer)) !== $expected) {
                return response()->json(['message' => 'Captcha salah atau kadaluarsa'], 422);
            }
        } else {
            // Fallback ke Google reCAPTCHA jika field captcha dikirim
            if ($request->filled('captcha')) {
                $captchaResponse = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                    'secret'   => env('RECAPTCHA_SECRET_KEY'),
                    'response' => $request->input('captcha'),
                ])->json();
                if (empty($captchaResponse['success'])) {
                    return response()->json(['message' => 'Invalid CAPTCHA. Try again.'], 422);
                }
            } else {
                return response()->json(['message' => 'Captcha wajib diisi'], 422);
            }
        }

        // { changed code } SIMPAN PENDING REGISTRASI DI CACHE, JANGAN INSERT KE TABEL users
        $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $pendingKey = 'pending_reg:' . strtolower($request->email);

        $pendingPayload = [
            'name'       => $request->name,
            'email'      => $request->email,
            'password'   => \Illuminate\Support\Facades\Hash::make($request->password), // hash sekarang
            'otp'        => $otp,
            'created_at' => now()->toDateTimeString(),
        ];

        Cache::put($pendingKey, $pendingPayload, now()->addMinutes(15)); // TTL 15 menit

        try {
            Mail::to($request->email)->send(new LoginOtpMail($otp));
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Gagal mengirim email OTP saat registrasi',
                'error'   => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'Akun hampir siap! OTP telah dikirim ke email. Silakan verifikasi.',
            'email'   => $request->email,
        ]);
    }

    /**
     * =====================================================
     * 🔐 LOGIN — Kirim OTP (untuk user biasa) / langsung login (admin)
     * =====================================================
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'           => 'required|email',
            'password'        => 'required|string',
            'captcha_id'      => 'nullable|string',
            'captcha_answer'  => 'nullable|string',
            'captcha'         => 'nullable|string',
        ]);

        if ($request->filled('captcha_id')) {
            $expected = Cache::get('captcha:' . $request->captcha_id);
            if (!$expected || strtoupper(trim($request->captcha_answer)) !== $expected) {
                return response()->json(['message' => 'Captcha salah atau kadaluarsa'], 422);
            }
        } else {
            if ($request->filled('captcha')) {
                $captcha = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                    'secret'   => env('RECAPTCHA_SECRET_KEY'),
                    'response' => $request->input('captcha'),
                ])->json();
                if (empty($captcha['success'])) {
                    return response()->json(['message' => 'Invalid CAPTCHA. Try again.'], 422);
                }
            } else {
                return response()->json(['message' => 'Captcha wajib diisi'], 422);
            }
        }

        $user = User::where('email', $request->email)->first();

        // { changed code } jika user belum ada tapi pending registrasi ada, minta verifikasi OTP dulu
        if (!$user) {
            if (Cache::has('pending_reg:' . strtolower($request->email))) {
                return response()->json(['message' => 'Akun belum terverifikasi. Silakan verifikasi OTP dari email Anda.'], 422);
            }
            return response()->json(['message' => 'Email atau password salah'], 401);
        }

        if (!\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email atau password salah'], 401);
        }

        // 🚀 Admin langsung login tanpa OTP
        if ($user->role === 'admin') {
            $token = $user->createToken('admin_token')->plainTextToken;

            return response()->json([
                'message' => 'Login admin berhasil',
                'token'   => $token,
                'user'    => $user,
            ]);
        }

        // 👤 User biasa: selalu kirim OTP saat login
        $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->otp = $otp;
        $user->save();

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\LoginOtpMail($otp));
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengirim OTP',
                'error'   => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'OTP dikirim ke email Anda.',
            'email'   => $user->email,
        ]);
    }

    /**
     * =====================================================
     * 📨 VERIFY OTP — Aktivasi akun via kode OTP
     * =====================================================
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|string',
        ]);

        // { changed code } PRIORITASKAN CEK PENDING REGISTRASI DI CACHE
        $pendingKey = 'pending_reg:' . strtolower($request->email);
        $pending = Cache::get($pendingKey);

        if ($pending) {
            $inputOtp  = substr(preg_replace('/\D/', '', (string) ($request->otp ?? '')), 0, 6);
            $storedOtp = substr(preg_replace('/\D/', '', (string) ($pending['otp'] ?? '')), 0, 6);

            if (!$storedOtp) {
                return response()->json(['message' => 'OTP kadaluarsa atau tidak tersedia. Silakan kirim ulang OTP.'], 400);
            }
            if (!hash_equals($storedOtp, $inputOtp)) {
                return response()->json(['message' => 'Kode OTP salah!'], 400);
            }

            // Buat user sekarang karena OTP benar
            $user = User::create([
                'name'         => $pending['name'],
                'email'        => $pending['email'],
                'password'     => $pending['password'], // sudah hashed
                'otp'          => null,
                'otp_verified' => true,
                'role'         => 'user',
            ]);

            // hapus pending
            Cache::forget($pendingKey);

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Verifikasi OTP berhasil',
                'token'   => $token,
                'user'    => $user,
            ]);
        }

        // ...existing legacy flow (untuk akun lama yang sudah terlanjur dibuat sebelum perubahan)...
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        // + Normalisasi OTP lama
        $inputOtp  = substr(preg_replace('/\D/', '', (string) ($request->otp ?? '')), 0, 6);
        $storedOtp = substr(preg_replace('/\D/', '', (string) ($user->otp ?? '')), 0, 6);

        if (!$storedOtp) {
            return response()->json(['message' => 'OTP kadaluarsa atau tidak tersedia. Silakan kirim ulang OTP.'], 400);
        }
        if (!hash_equals($storedOtp, $inputOtp)) {
            return response()->json(['message' => 'Kode OTP salah!'], 400);
        }

        $user->otp_verified = true;
        $user->otp = null;
        $user->save();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Verifikasi OTP berhasil',
            'token'   => $token,
            'user'    => $user,
        ]);
    }

    /**
     * =====================================================
     * 👤 PROFILE — Ambil data user login
     * =====================================================
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user->photo_url = $user->photo_path
            ? asset('storage/' . $user->photo_path)
            : null;

        return response()->json(['user' => $user]);
    }

    /**
     * =====================================================
     * ✏️ UPDATE PROFILE
     * =====================================================
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // { changed code } make fields optional and accept partial updates
        $validated = $request->validate([
            'name'            => 'sometimes|string|max:255|regex:/^[\pL\s]+$/u',
            'email'           => 'sometimes|email|unique:users,email,' . $user->id,
            'place_of_birth'  => 'sometimes|nullable|string|max:255',
            'date_of_birth'   => 'sometimes|nullable|date',
        ]);

        if (array_key_exists('name', $validated)) {
            $user->name = $validated['name'];
        }
        if (array_key_exists('email', $validated)) {
            $user->email = $validated['email'];
        }

        // simpan TTL bila kolom tersedia (hanya jika dikirim di request)
        if (Schema::hasColumn('users', 'place_of_birth') && array_key_exists('place_of_birth', $validated)) {
            $user->place_of_birth = $validated['place_of_birth'];
        }
        if (Schema::hasColumn('users', 'date_of_birth') && array_key_exists('date_of_birth', $validated)) {
            $user->date_of_birth = $validated['date_of_birth'];
        }

        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user'    => $user,
        ]);
    }

    /**
     * =====================================================
     * 🖼️ UPDATE PHOTO
     * =====================================================
     */
    public function updatePhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        try {
            if ($user->photo_path && Storage::disk('public')->exists($user->photo_path)) {
                Storage::disk('public')->delete($user->photo_path);
            }

            $file = $request->file('photo');
            $original = $file->getClientOriginalName();
            $ext = $file->getClientOriginalExtension();
            $nameOnly = pathinfo($original, PATHINFO_FILENAME);
            $clean = preg_replace('/[^\pL\pN\-\._]+/u', '_', $nameOnly) ?: 'file';
            $filename = $clean . '.' . strtolower($ext);
            Storage::disk('public')->putFileAs('images', $file, $filename);

            $path = 'images/' . $filename;
            $user->photo_path = $path;
            $user->save();

            return response()->json([
                'message'   => 'Foto profil berhasil diperbarui',
                'photo_url' => asset('storage/' . $path),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Gagal upload foto',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * =====================================================
     * 📋 INDEX USERS — Hanya admin yang boleh akses
     * =====================================================
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // pastikan hanya admin bisa lihat semua user
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        // { changed code } hanya tampilkan akun yang sudah verifikasi OTP
        $users = User::where('otp_verified', true)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($u) {
                $u->photo_url = $u->photo_path ? asset('storage/' . $u->photo_path) : null;
                return $u;
            });

        return response()->json($users);
    }

    // Admin: tambah user
    public function adminStore(Request $request)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $validated = $request->validate([
            'name'     => 'required|string|max:255|regex:/^[\pL\s]+$/u',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role'     => ['required', Rule::in(['user', 'admin'])],
            'photo'    => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $u = new User();
        $u->name         = $validated['name'];
        $u->email        = $validated['email'];
        $u->password     = \Illuminate\Support\Facades\Hash::make($validated['password']);
        $u->role         = $validated['role'];
        $u->otp_verified = true;

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $original = $file->getClientOriginalName();
            $ext = $file->getClientOriginalExtension();
            $nameOnly = pathinfo($original, PATHINFO_FILENAME);
            $clean = preg_replace('/[^\pL\pN\-\._]+/u', '_', $nameOnly) ?: 'file';
            $filename = $clean . '.' . strtolower($ext);
            Storage::disk('public')->putFileAs('images', $file, $filename);
            $u->photo_path = 'images/' . $filename;
        }

        $u->save();
        $u->photo_url = $u->photo_path ? asset('storage/' . $u->photo_path) : null;

        return response()->json(['message' => 'User dibuat', 'data' => $u]);
    }

    // Admin: edit user
    public function adminUpdate(Request $request, $id)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $u = User::find($id);
        if (!$u) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'name'     => 'required|string|max:255|regex:/^[\pL\s]+$/u',
            'email'    => ['required','email', Rule::unique('users','email')->ignore($u->id)],
            'password' => 'nullable|string|min:6',
            'role'     => ['required', Rule::in(['user', 'admin'])],
            'photo'    => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $u->name  = $validated['name'];
        $u->email = $validated['email'];
        $u->role  = $validated['role'];

        if (!empty($validated['password'])) {
            $u->password = \Illuminate\Support\Facades\Hash::make($validated['password']);
        }

        if ($request->hasFile('photo')) {
            if ($u->photo_path && Storage::disk('public')->exists($u->photo_path)) {
                Storage::disk('public')->delete($u->photo_path);
            }
            $file = $request->file('photo');
            $original = $file->getClientOriginalName();
            $ext = $file->getClientOriginalExtension();
            $nameOnly = pathinfo($original, PATHINFO_FILENAME);
            $clean = preg_replace('/[^\pL\pN\-\._]+/u', '_', $nameOnly) ?: 'file';
            $filename = $clean . '.' . strtolower($ext);
            Storage::disk('public')->putFileAs('images', $file, $filename);
            $u->photo_path = 'images/' . $filename;
        }

        $u->save();
        $u->photo_url = $u->photo_path ? asset('storage/' . $u->photo_path) : null;

        return response()->json(['message' => 'User diperbarui', 'data' => $u]);
    }

    // Admin: hapus user
    public function adminDestroy(Request $request, $id)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $u = User::find($id);
        if (!$u) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        if ($admin->id === $u->id) {
            return response()->json(['message' => 'Tidak bisa menghapus akun sendiri'], 422);
        }

        if ($u->photo_path && Storage::disk('public')->exists($u->photo_path)) {
            Storage::disk('public')->delete($u->photo_path);
        }

        $u->delete();

        return response()->json(['message' => 'User dihapus']);
    }

    /**
     * =====================================================
     * 🔁 RESEND OTP — Kirim ulang kode OTP ke email
     * =====================================================
     */
    public function resendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // { changed code } dukung pending registrasi di cache
        $pendingKey = 'pending_reg:' . strtolower($request->email);
        $pending = Cache::get($pendingKey);

        if ($pending) {
            $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $pending['otp'] = $otp;
            Cache::put($pendingKey, $pending, now()->addMinutes(15));

            try {
                Mail::to($request->email)->send(new LoginOtpMail($otp));
            } catch (Exception $e) {
                return response()->json([
                    'message' => 'Gagal mengirim OTP',
                    'error'   => $e->getMessage(),
                ], 500);
            }

            return response()->json([
                'message' => 'OTP telah dikirim ulang ke email Anda.',
                'email'   => $request->email,
            ]);
        }

        // ...existing code... (fallback untuk akun lama yang sudah ada di DB)
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        // jika sudah terverifikasi, tidak perlu resend
        if ($user->otp_verified) {
            return response()->json(['message' => 'Akun sudah terverifikasi'], 422);
        }

        $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->otp = $otp;
        $user->save();

        try {
            Mail::to($user->email)->send(new LoginOtpMail($otp));
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Gagal mengirim OTP',
                'error'   => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'OTP telah dikirim ulang ke email Anda.',
            'email'   => $user->email,
        ]);
    }
}
