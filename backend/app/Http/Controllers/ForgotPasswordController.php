<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Models\User;
use Exception;

class ForgotPasswordController extends Controller
{
    /**
     * 📩 Kirim kode reset password (6 digit random)
     */
    public function sendResetLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Email not found'], 404);
        }

        try {
            // 🔐 Generate token acak 6 huruf/angka
            $token = strtoupper(Str::random(6));
            $user->reset_token = $token;
            $user->save();

            // ✉️ Kirim email dengan error handling
            Mail::send([], [], function ($message) use ($user, $token) {
                $message->to($user->email)
                    ->subject('Password Reset Code')
                    ->setBody("
                        <p>Hi <b>{$user->name}</b>,</p>
                        <p>Your password reset code is:</p>
                        <h2 style='color:#333'>{$token}</h2>
                        <p>Enter this code in the app to reset your password.</p>
                        <p>— Motasera Support Team</p>
                    ", 'text/html');
            });

            return response()->json([
                'success' => true,
                'message' => 'Reset code sent to your email.'
            ]);
        } catch (Exception $e) {
            // 🧯 Tangkap error pengiriman email
            return response()->json([
                'success' => false,
                'message' => 'Failed to send reset email.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔑 Reset password berdasarkan token
     */
    public function resetPassword(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'otp' => 'required|string',
        'password' => 'required|min:6|confirmed'
    ]);

    $cacheKey = 'reset-otp:' . $request->email;
    $cachedOtp = Cache::get($cacheKey);

    if (!$cachedOtp || $cachedOtp != $request->otp) {
        return response()->json(['message' => 'Invalid OTP or expired'], 400);
    }

    $user = User::where('email', $request->email)->firstOrFail();
    $user->password = Hash::make($request->password);
    $user->save();

    Cache::forget($cacheKey);

    return response()->json(['message' => 'Password successfully reset']);
}



    public function sendResetOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email'
        ]);

        $user = User::where('email', $validated['email'])->first();
        if (! $user) {
            // Do not reveal whether email exists — but for UX we'll return 200 with message
            return response()->json(['message' => 'If the email is registered, an OTP has been sent.'], 200);
        }

        $otp = random_int(100000, 999999);
        $cacheKey = 'reset-otp:' . $user->email;
        Cache::put($cacheKey, $otp, now()->addMinutes(5));

        $html = '<!doctype html><html><head><meta charset="utf-8"></head><body style="font-family:Arial, sans-serif"><div style="max-width:600px;margin:auto;padding:24px;border-radius:8px;background:#fff"><h3 style="margin:0 0 12px;color:#111">Reset Password — Motasera</h3><p style="color:#333;margin:0 0 12px">Gunakan kode berikut untuk mereset password Anda. Kode berlaku 5 menit.</p><div style="font-weight:700;font-size:28px;letter-spacing:4px;padding:16px;border-radius:8px;background:#f7fafc;border:1px solid #e6eef7;text-align:center">' . $otp . '</div></div></body></html>';

        try {
            Mail::html($html, function ($message) use ($user) {
                $message->to($user->email)
                    ->subject('Reset Password OTP')
                    ->from(config('mail.from.address', env('MAIL_FROM_ADDRESS')), config('mail.from.name', env('MAIL_FROM_NAME', 'BukuKu')));
            });
        } catch (\Throwable $e) {
            Log::error('Gagal mengirim OTP', [
                'email' => $user->email,
                'error' => $e->getMessage()
            ]);
            Cache::forget($cacheKey);
            return response()->json(['message' => 'Gagal mengirim OTP.'], 500);
        }

        return response()->json(['message' => 'If the email is registered, an OTP has been sent.'], 200);
    }
}
