<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Exception;

class GoogleAuthController extends Controller
{
    /**
     * =====================================================
     * 🔗 Redirect user ke halaman login Google
     * =====================================================
     */
    public function googleLogin(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        // Verifikasi token Google (id_token)
        try {
            $response = @file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . $request->token);
            $googleUser = json_decode($response, true);
        } catch (\Throwable $e) {
            $googleUser = null;
        }

        if (!is_array($googleUser) || !isset($googleUser['email'])) {
            return response()->json(['message' => 'Token Google tidak valid'], 401);
        }

        $email = $googleUser['email'];

        // Jika user belum ada, buat otomatis (role customer)
        $user = \App\Models\User::where('email', $email)->first();
        if (! $user) {
            $name = $googleUser['name'] ?? explode('@', $email)[0];
            $user = \App\Models\User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make(Str::random(16)),
                'role' => 'customer',
                'profile_image' => null,
            ]);
        }

        // Buat dan kembalikan token Sanctum (client akan simpan dan redirect ke beranda)
        $token = $user->createToken('google-login')->plainTextToken;

        return response()->json([
            'message' => 'Login Google berhasil',
            'user' => $user,
            'token' => $token,
        ], 200);
    }

    /**
     * =====================================================
     * 🔁 Handle callback dari Google
     * =====================================================
     */
    public function handleGoogleCallback()
    {
        try {
            // Ambil data dari Google
            $googleUser = Socialite::driver('google')->stateless()->user();

            // Cek apakah user sudah terdaftar
            $user = User::where('email', $googleUser->getEmail())->first();

            if (!$user) {
                // Jika belum ada, buat user baru
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'password' => Hash::make(uniqid()), // password acak
                    'google_id' => $googleUser->getId(),
                ]);
            }

            // Login user
            Auth::login($user);

            // Redirect sesuai kebutuhan frontend-mu
            return redirect()->to('http://localhost:3000/dashboard');
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Google login failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
