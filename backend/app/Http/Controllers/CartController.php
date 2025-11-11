<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Product;

class CartController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // ✅ Ambil atau buat cart berdasarkan user_id
        $cart = Cart::firstOrCreate(['user_id' => $user->id]);

        // ✅ Ambil item cart beserta produk
        $cart->load('items.product');

        return response()->json($cart->items);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'nullable|integer|min:1'
        ]);

        $qty = (int) ($request->quantity ?? 1);
        $user = Auth::user();
        $cart = Cart::firstOrCreate(['user_id' => $user->id]);

        try {
            DB::beginTransaction();

            // Lock row product untuk mencegah race condition
            $product = Product::lockForUpdate()->find($request->product_id);
            if (! $product) {
                DB::rollBack();
                return response()->json(['message' => 'Product not found'], 404);
            }

            // Dukungan kolom stok 'stok' atau 'stock'
            $stockField = Schema::hasColumn('products', 'stok')
                ? 'stok'
                : (Schema::hasColumn('products', 'stock') ? 'stock' : 'stok');

            $currentStock = (int) ($product->{$stockField} ?? 0);
            if ($currentStock <= 0) {
                DB::rollBack();
                return response()->json(['message' => 'Stok habis'], 400);
            }
            if ($currentStock < $qty) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Stok tidak mencukupi',
                    'available' => $currentStock
                ], 400);
            }

            // Kurangi stok
            $product->{$stockField} = $currentStock - $qty;
            $product->save();

            // Tambah/update item di cart
            $item = $cart->items()->where('product_id', $request->product_id)->first();
            if ($item) {
                $item->update(['quantity' => $item->quantity + $qty]);
            } else {
                $cart->items()->create([
                    'product_id' => $request->product_id,
                    'quantity' => $qty
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Produk berhasil ditambahkan ke cart',
                'product' => $product, // stok terbaru dikembalikan
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menambahkan ke cart',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1'
        ]);

        $user = Auth::user();

        $item = CartItem::whereHas('cart', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);

        try {
            DB::beginTransaction();

            $newQty = (int) $request->quantity;
            $oldQty = (int) $item->quantity;
            $delta  = $newQty - $oldQty;

            if ($delta === 0) {
                DB::commit();
                return response()->json(['message' => 'Quantity tidak berubah', 'item' => $item]);
            }

            // Lock product row
            $product = Product::lockForUpdate()->find($item->product_id);
            if (! $product) {
                DB::rollBack();
                return response()->json(['message' => 'Produk tidak ditemukan'], 404);
            }

            // Tentukan kolom stok (stok / stock)
            $stockField = Schema::hasColumn('products', 'stok')
                ? 'stok'
                : (Schema::hasColumn('products', 'stock') ? 'stock' : null);

            if (! $stockField) {
                DB::rollBack();
                return response()->json(['message' => 'Kolom stok tidak tersedia'], 500);
            }

            $currentStock = (int) ($product->{$stockField} ?? 0);

            // Jika menaikkan qty → pastikan stok cukup
            if ($delta > 0) {
                if ($currentStock < $delta) {
                    DB::rollBack();
                    return response()->json([
                        'message'   => 'Anda sudah mencapai batas stok produk dan tidak dapat menambahkan qty lagi',
                        'available' => $currentStock
                    ], 400);
                }
                $product->{$stockField} = $currentStock - $delta;
            } else {
                // Menurunkan qty → kembalikan stok
                $product->{$stockField} = $currentStock + abs($delta);
            }

            $product->save();
            $item->update(['quantity' => $newQty]);

            DB::commit();

            return response()->json([
                'message' => 'Quantity diperbarui',
                'item'    => $item,
                'remaining_stock' => (int) $product->{$stockField},
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal memperbarui quantity',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy($id)
    {
        $user = Auth::user();

        // Hanya bisa hapus item milik user sendiri
        $item = CartItem::whereHas('cart', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);

        try {
            DB::beginTransaction();

            // Kembalikan stok produk sesuai quantity item
            $product = Product::lockForUpdate()->find($item->product_id);
            if ($product) {
                $stockField = Schema::hasColumn('products', 'stok')
                    ? 'stok'
                    : (Schema::hasColumn('products', 'stock') ? 'stock' : null);

                if ($stockField) {
                    $currentStock = (int) ($product->{$stockField} ?? 0);
                    $product->{$stockField} = $currentStock + (int) $item->quantity;
                    $product->save();
                }
            }

            // Hapus item dari cart
            $item->delete();

            DB::commit();

            return response()->json([
                'message'         => 'Item dihapus dan stok dipulihkan',
                'restored_stock'  => isset($product, $stockField) && $stockField ? (int) $product->{$stockField} : null,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menghapus item',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
