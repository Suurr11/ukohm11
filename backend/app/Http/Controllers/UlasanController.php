<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class UlasanController extends Controller
{
    // GET /api/products/{id}/reviews
    public function index($productId)
    {
        $rows = DB::table('ulasan')
            ->join('users', 'ulasan.user_id', '=', 'users.id')
            ->where('ulasan.product_id', $productId)
            ->orderBy('ulasan.created_at', 'desc')
            ->select(
                'ulasan.id',
                'users.name as user_name',
                'ulasan.rating',
                'ulasan.komentar'
            )
            ->get();

        return response()->json($rows);
    }

    // POST /api/ulasan
    public function store(Request $request)
    {
        $userId = Auth::id();

        $validated = $request->validate([
            'product_id' => 'required|integer',
            'rating'     => 'required|integer|min:1|max:5',
            'komentar'   => 'nullable|string|max:1000',
        ]);

        // Pastikan user pernah membeli produk ini dan status pesanan 'done'
        $eligible = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.user_id', $userId)
            ->where('orders.status', 'done')
            ->where('order_items.product_id', $validated['product_id'])
            ->exists();

        if (! $eligible) {
            return response()->json(['message' => 'Anda belum menyelesaikan pembelian produk ini'], 422);
        }

        $id = DB::table('ulasan')->insertGetId([
            'product_id' => $validated['product_id'],
            'user_id'    => $userId,
            'rating'     => $validated['rating'],
            'komentar'   => $validated['komentar'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $row = DB::table('ulasan')->where('id', $id)->first();

        return response()->json(['message' => 'Ulasan terkirim', 'data' => $row]);
    }

    // PUT /api/ulasan/{id}
    public function update(Request $request, $id)
    {
        $userId = Auth::id();

        $validated = $request->validate([
            'rating'   => 'required|integer|min:1|max:5',
            'komentar' => 'nullable|string|max:1000',
        ]);

        $row = DB::table('ulasan')->where('id', $id)->first();
        if (! $row) {
            return response()->json(['message' => 'Ulasan tidak ditemukan'], 404);
        }
        if ((int)$row->user_id !== (int)$userId) {
            return response()->json(['message' => 'Tidak diizinkan'], 403);
        }

        DB::table('ulasan')->where('id', $id)->update([
            'rating'     => $validated['rating'],
            'komentar'   => $validated['komentar'] ?? null,
            'updated_at' => now(),
        ]);

        $updated = DB::table('ulasan')->where('id', $id)->first();
        return response()->json(['message' => 'Ulasan diperbarui', 'data' => $updated]);
    }
}
