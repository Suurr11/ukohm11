<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str; // + import untuk generate code

class ProductController extends Controller
{
    /**
     * =====================================================
     * 📦 INDEX — Tampilkan semua produk
     * =====================================================
     */
    public function index()
    {
        $products = DB::table('products')
            ->leftJoin(DB::raw('(
                SELECT oi.product_id, SUM(oi.qty) AS sold_count
                FROM order_items oi
                JOIN orders o ON o.id = oi.order_id
                WHERE o.status = "done"
                GROUP BY oi.product_id
            ) s'), 's.product_id', '=', 'products.id')
            ->leftJoin(DB::raw('(
                SELECT product_id, AVG(rating) AS rating_avg, COUNT(*) AS rating_count
                FROM ulasan
                GROUP BY product_id
            ) r'), 'r.product_id', '=', 'products.id')
            ->select(
                'products.*',
                DB::raw('COALESCE(s.sold_count, 0) as sold_count'),
                DB::raw('COALESCE(r.rating_avg, 0) as rating_avg'),
                DB::raw('COALESCE(r.rating_count, 0) as rating_count')
            )
            ->get();

        return response()->json($products);
    }

    /**
     * =====================================================
     * 🧩 STORE — Tambahkan produk baru
     * =====================================================
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_product'   => 'required|string|max:255',
            'product_code'   => 'nullable|string|max:50|unique:products,product_code', // + tambah
            'harga'          => 'required|numeric',
            'scale_diecast'  => 'required|string',
            'stock'          => 'required|integer|min:0',
            'limited'        => 'required|boolean',
            'foto'           => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'deskripsi'      => 'nullable|string',
        ]);

        // 📸 Simpan ke storage/app/public/images -> akses via /storage/images
        $fileName = null;
        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $original = $file->getClientOriginalName();
            $ext = $file->getClientOriginalExtension();
            $nameOnly = pathinfo($original, PATHINFO_FILENAME);
            // sanitasi ringan: ganti karakter non-aman dengan underscore, pertahankan nama asli
            $clean = preg_replace('/[^\pL\pN\-\._]+/u', '_', $nameOnly) ?: 'file';
            $filename = $clean . '.' . strtolower($ext);
            Storage::disk('public')->putFileAs('images', $file, $filename);
            $fileName = $filename;
        }

        $code = $validated['product_code'] ?? ('PRD-' . strtoupper(Str::random(6))); // + generate bila kosong
        $product = Product::create([
            'product_code'   => $code, // + simpan
            'nama_product'   => $validated['nama_product'],
            'harga'          => $validated['harga'],
            'scale_diecast'  => $validated['scale_diecast'],
            'stock'          => $validated['stock'],
            'limited'        => $validated['limited'],
            'foto'           => $fileName,
            'deskripsi'      => $validated['deskripsi'] ?? null,
        ]);

        return response()->json([
            'message' => 'Produk berhasil ditambahkan',
            'product' => $product,
        ], 201);
    }

    /**
     * =====================================================
     * 🔍 SHOW — Detail produk berdasarkan ID
     * =====================================================
     */
    public function show($id)
    {
        $product = DB::table('products')
            ->leftJoin(DB::raw('(
                SELECT oi.product_id, SUM(oi.qty) AS sold_count
                FROM order_items oi
                JOIN orders o ON o.id = oi.order_id
                WHERE o.status = "done"
                GROUP BY oi.product_id
            ) s'), 's.product_id', '=', 'products.id')
            ->leftJoin(DB::raw('(
                SELECT product_id, AVG(rating) AS rating_avg, COUNT(*) AS rating_count
                FROM ulasan
                GROUP BY product_id
            ) r'), 'r.product_id', '=', 'products.id')
            ->where('products.id', $id)
            ->select(
                'products.*',
                DB::raw('COALESCE(s.sold_count, 0) as sold_count'),
                DB::raw('COALESCE(r.rating_avg, 0) as rating_avg'),
                DB::raw('COALESCE(r.rating_count, 0) as rating_count')
            )
            ->firstOrFail();

        return response()->json($product);
    }

    /**
     * =====================================================
     * ✏️ UPDATE — Perbarui produk
     * =====================================================
     */
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'nama_product'   => 'sometimes|string|max:255',
            'product_code'   => 'sometimes|nullable|string|max:50|unique:products,product_code,' . $product->id, // + tambah
            'harga'          => 'sometimes|numeric',
            'scale_diecast'  => 'sometimes|string',
            'stock'          => 'sometimes|integer|min:0',
            'limited'        => 'sometimes|boolean',
            'foto'           => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'deskripsi'      => 'sometimes|nullable|string',
        ]);

        // 📸 Simpan foto baru ke storage/public/images
        $fileName = $product->foto;
        if ($request->hasFile('foto')) {
            if ($fileName && Storage::disk('public')->exists('images/'.$fileName)) {
                Storage::disk('public')->delete('images/'.$fileName);
            }
            $file = $request->file('foto');
            $original = $file->getClientOriginalName();
            $ext = $file->getClientOriginalExtension();
            $nameOnly = pathinfo($original, PATHINFO_FILENAME);
            $clean = preg_replace('/[^\pL\pN\-\._]+/u', '_', $nameOnly) ?: 'file';
            $filename = $clean . '.' . strtolower($ext);
            Storage::disk('public')->putFileAs('images', $file, $filename);
            $fileName = $filename;
        }

        $product->update([
            'product_code'   => array_key_exists('product_code', $validated) ? $validated['product_code'] : $product->product_code, // + update
            'nama_product'   => $validated['nama_product'] ?? $product->nama_product,
            'harga'          => $validated['harga'] ?? $product->harga,
            'scale_diecast'  => $validated['scale_diecast'] ?? $product->scale_diecast,
            'stock'          => $validated['stock'] ?? $product->stock,
            'limited'        => array_key_exists('limited', $validated) ? $validated['limited'] : $product->limited,
            'foto'           => $fileName,
            'deskripsi'      => array_key_exists('deskripsi', $validated) ? $validated['deskripsi'] : $product->deskripsi,
        ]);

        return response()->json([
            'message' => 'Produk berhasil diperbarui',
            'product' => $product,
        ]);
    }

    /**
     * =====================================================
     * 🗑️ DESTROY — Hapus produk
     * =====================================================
     */
    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        // Hapus foto di storage jika ada; fallback hapus di public/images
        if ($product->foto && Storage::disk('public')->exists('images/'.$product->foto)) {
            Storage::disk('public')->delete('images/'.$product->foto);
        } elseif ($product->foto && file_exists(public_path('images/'.$product->foto))) {
            @unlink(public_path('images/'.$product->foto));
        }

        $product->delete();

        return response()->json(['message' => 'Produk berhasil dihapus']);
    }

    /**
 * 🛒 Add to Cart: kurangi stok di database
 */
public function addToCart($id, Request $request)
{
    $product = Product::findOrFail($id);

    $quantity = $request->input('quantity', 1);

    if ($product->stock < $quantity) {
        return response()->json([
            'message' => 'Stok tidak cukup',
            'product' => $product
        ], 400);
    }

    // Kurangi stok
    $product->stock -= $quantity;
    $product->save();

    // Bisa juga buat log/cart table di sini jika mau

    return response()->json([
        'message' => 'Berhasil ditambahkan ke cart',
        'product' => $product
    ]);
}

}
