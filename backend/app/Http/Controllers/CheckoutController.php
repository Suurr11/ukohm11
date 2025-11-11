<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;

class CheckoutController extends Controller
{
    public function createTransaction(Request $request)
    {
        // validasi total
        $total = (int) round((float) $request->input('total', 0));
        if ($total <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Total transaksi tidak valid'
            ], 422);
        }

        $orderId = 'ORDER-' . time();

        // Ambil user terautentikasi dengan benar
        $authUser = $request->user();

        $params = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $total,
            ],
            'customer_details' => [
                'first_name' => $authUser ? $authUser->name : 'Guest',
                'email' => $authUser ? $authUser->email : 'guest@example.com',
            ],
        ];

        // cek Midtrans SDK
        if (! class_exists('\Midtrans\Config') || ! class_exists('\Midtrans\Snap')) {
            return response()->json([
                'success' => false,
                'message' => 'Midtrans PHP SDK tidak ditemukan. Jalankan: composer require midtrans/midtrans-php',
            ], 500);
        }

        // cek server key
        $serverKey = env('MIDTRANS_SERVER_KEY', '');
        if (empty($serverKey)) {
            return response()->json([
                'success' => false,
                'message' => 'MIDTRANS_SERVER_KEY belum diatur di .env',
            ], 500);
        }

        // konfigurasi Midtrans
        \Midtrans\Config::$serverKey    = $serverKey;
        \Midtrans\Config::$isProduction = filter_var(env('MIDTRANS_IS_PRODUCTION', false), FILTER_VALIDATE_BOOLEAN);
        \Midtrans\Config::$isSanitized  = filter_var(env('MIDTRANS_IS_SANITIZED', true), FILTER_VALIDATE_BOOLEAN);
        \Midtrans\Config::$is3ds        = filter_var(env('MIDTRANS_IS_3DS', true), FILTER_VALIDATE_BOOLEAN);

        try {
            $snapToken = \Midtrans\Snap::getSnapToken($params);
            return response()->json([
                'success'    => true,
                'order_id'   => $orderId,
                'snap_token' => $snapToken,
                'client_key' => env('MIDTRANS_CLIENT_KEY', ''),
            ]);
        } catch (\Throwable $e) {
            Log::error('Midtrans error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat snap token',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // NEW: konfirmasi pembayaran sukses -> pindahkan cart ke orders & order_items
    public function confirm(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $txStatus = strtolower((string) $request->input('transaction_status', ''));
        $isSuccess = in_array($txStatus, ['settlement', 'capture', 'success'], true);
        if (!$isSuccess) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi belum sukses',
                'transaction_status' => $txStatus,
            ], 400);
        }

        $cart = Cart::firstOrCreate(['user_id' => $user->id]);
        $cart->load('items.product');

        if ($cart->items->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Cart kosong'], 400);
        }

        // hitung total
        $total = 0;
        foreach ($cart->items as $it) {
            $price = (float) ($it->product->harga ?? 0);
            $qty = (int) ($it->quantity ?? 1);
            $total += ($price * $qty);
        }

        $orderCode = 'ORD-' . date('YmdHis') . '-' . random_int(1000, 9999);

        try {
            DB::beginTransaction();

            // buat order minimal
            $order = new Order();
            $order->user_id = $user->id;
            $order->order_code = $orderCode;
            $order->total_price = $total;
            $order->status = 'pending'; // masuk menu "Sedang Dikemas"
            $order->save();

            // insert order_items
            $itemsRows = [];
            $now = now();
            foreach ($cart->items as $it) {
                $itemsRows[] = [
                    'order_id' => $order->id,
                    'product_id' => $it->product_id,
                    'qty' => (int) $it->quantity,
                    'price' => (float) ($it->product->harga ?? 0),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            if (!empty($itemsRows)) {
                DB::table('order_items')->insert($itemsRows);
            }

            // kosongkan cart
            CartItem::where('cart_id', $cart->id)->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order dibuat dan cart dikosongkan',
                'data' => [
                    'order_id' => $order->id,
                    'order_code' => $order->order_code,
                    'total_price' => $order->total_price,
                    'status' => $order->status,
                ],
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Checkout confirm failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat order',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
