<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CartController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ForgotPasswordController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\CheckoutController; // <-- tambahkan use
use App\Http\Controllers\KurirController; // tambah controller kurir
use App\Http\Controllers\UlasanController; // + tambah use
use App\Http\Controllers\CaptchaController; // + import
use Illuminate\Support\Facades\DB; // + tambahkan DB

// ==================== 🔐 AUTH SECTION ====================
Route::post('/register', [UserController::class, 'register']);
Route::post('/login', [UserController::class, 'login']);
Route::post('/verify-otp', [UserController::class, 'verifyOtp']);
// + resend otp (public)
Route::post('/resend-otp', [UserController::class, 'resendOtp']);

// google login
Route::post('/auth/google', [GoogleAuthController::class, 'googleLogin']);
Route::get('/auth/google', [GoogleAuthController::class, 'googleLogin']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'handleGoogleCallback']);

// -------------------- PUBLIC: Forgot password --------------------
// Move forgot/reset password to public (no auth required)
// Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink']);
Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);
Route::post('forgot-password', [ForgotPasswordController::class, 'sendResetOtp']);

// ==================== 🧑‍💼 PUBLIC USER ROUTE ====================
    Route::get('/users', [UserController::class, 'index']); // ✅ untuk admin dashboard (aktif tanpa login)

// ==================== 🔐 AUTHENTICATED SECTION ====================
    Route::middleware('auth:sanctum')->group(function () {

    // -------------------- USER --------------------
    Route::get('/user', [UserController::class, 'me']);
    Route::put('/user', [UserController::class, 'updateProfile']);
    Route::post('/user/photo', [UserController::class, 'updatePhoto']);


    // -------------------- ADDRESSES --------------------
    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::put('/addresses/{id}', [AddressController::class, 'update']);
    Route::delete('/addresses/{id}', [AddressController::class, 'destroy']);
    Route::put('/addresses/{id}/primary', [AddressController::class, 'setPrimary']);
    Route::get('/addresses/primary', [AddressController::class, 'getPrimary']);
    // + detail alamat by id (hindari 405)
    Route::get('/addresses/{id}', function (Request $request, $id) {
        $user = $request->user();
        $row = DB::table('addresses')
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (! $row) {
            return response()->json(['message' => 'Alamat tidak ditemukan'], 404);
        }

        return response()->json(['data' => $row]);
    });

    // -------------------- CART --------------------
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::put('/cart/{id}', [CartController::class, 'update']);
    Route::delete('/cart/{id}', [CartController::class, 'destroy']);

    // -------------------- ORDERS --------------------
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']); // request cancel by user (tetap dipakai)
    Route::post('/orders/{id}/accept-cancel', [OrderController::class, 'acceptCancel']); // user accept admin request
    Route::post('/orders/{id}/confirm-done', [OrderController::class, 'confirmDone']); // <- user konfirmasi selesai

    // -------------------- ADMIN --------------------
    Route::get('/admin/stats', [AdminController::class, 'stats']);
    Route::get('/admin/orders', [AdminController::class, 'orders']); // list semua order (admin)
    Route::get('/admin/orders/{id}/items', [AdminController::class, 'orderItems']);
    Route::put('/admin/orders/{id}', [AdminController::class, 'updateOrderStatus']); // update status order (non-cancel)
    Route::put('/admin/orders/{id}/request-cancel', [AdminController::class, 'requestCancel']); // admin minta pembatalan
    Route::put('/admin/orders/{id}/accept-cancel', [AdminController::class, 'acceptCancel']);   // admin terima pembatalan user

    // -------------------- ADMIN: USERS CRUD --------------------
    Route::get('/admin/users', [UserController::class, 'index']);            // list users (admin only)
    Route::post('/admin/users', [UserController::class, 'adminStore']);      // create user
    Route::put('/admin/users/{id}', [UserController::class, 'adminUpdate']); // update user
    Route::delete('/admin/users/{id}', [UserController::class, 'adminDestroy']); // delete user

    // -------------------- ADMIN: KURIR CRUD --------------------
    Route::get('/admin/kurir', [KurirController::class, 'adminIndex']);
    Route::post('/admin/kurir', [KurirController::class, 'adminStore']);
    Route::put('/admin/kurir/{id}', [KurirController::class, 'adminUpdate']);
    Route::delete('/admin/kurir/{id}', [KurirController::class, 'adminDestroy']);

    // Checkout (Midtrans)
    Route::post('/checkout', [CheckoutController::class, 'createTransaction']);
    Route::post('/checkout/confirm', [CheckoutController::class, 'confirm']);

    // + Kirim ulasan (auth)
    Route::post('/ulasan', [UlasanController::class, 'store']);
    // + Update ulasan (auth)
    Route::put('/ulasan/{id}', [UlasanController::class, 'update']);
});

// ==================== 🛒 PRODUCT SECTION ====================
Route::get('/products', [ProductController::class, 'index']);
Route::post('/products', [ProductController::class, 'store']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::put('/products/{id}', [ProductController::class, 'update']);
Route::delete('/products/{id}', [ProductController::class, 'destroy']);
Route::post('/products/{id}/add-to-cart', [ProductController::class, 'addToCart']);

// Daftar kurir (publik)
Route::get('/kurir', [KurirController::class, 'index']);

// + Publik: daftar ulasan produk
Route::get('/products/{id}/reviews', [UlasanController::class, 'index']);

// + image captcha
Route::get('/captcha', [CaptchaController::class, 'generate']);
