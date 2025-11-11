<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\Order;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    /**
     * 📊 Mengambil statistik dashboard admin
     */
    public function stats()
    {
        // total products & users (simple)
        $totalProducts = Product::count();
        $totalUsers = User::count();

        // total limited — jika kolom 'limited' ada
        $totalLimited = 0;
        if (Schema::hasColumn('products', 'limited')) {
            $totalLimited = Product::where('limited', 1)->count();
        }

        // total stock — dukung 'stok' atau 'stock'
        $totalStock = 0;
        if (Schema::hasColumn('products', 'stok')) {
            $totalStock = (int) Product::sum('stok');
        } elseif (Schema::hasColumn('products', 'stock')) {
            $totalStock = (int) Product::sum('stock');
        }

        // +==================== NEW: PROFIT & MODAL ====================
        // Keuntungan = SUM( qty * (harga_jual - harga_beli) ) dari orders 'done'
        $totalKeuntungan = 0.0;
        if (Schema::hasTable('order_items') && Schema::hasTable('orders') && Schema::hasTable('products')) {
            if (Schema::hasColumn('products', 'harga_beli')) {
                $totalKeuntungan = (float) DB::table('order_items as oi')
                    ->join('orders as o', 'o.id', '=', 'oi.order_id')
                    ->join('products as p', 'p.id', '=', 'oi.product_id')
                    ->where('o.status', 'done')
                    ->select(DB::raw('COALESCE(SUM(oi.qty * (oi.price - COALESCE(p.harga_beli,0))),0) as total'))
                    ->value('total');
            } else {
                // tanpa kolom harga_beli, anggap 0 (tidak bisa hitung profit akurat)
                $totalKeuntungan = 0.0;
            }
        }

        // Modal = SUM(harga_beli) dari tabel products (nullable dianggap 0)
        $totalModal = 0.0;
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'harga_beli')) {
            $totalModal = (float) DB::table('products')->whereNotNull('harga_beli')->sum('harga_beli');
        }

        return response()->json([
            'total_products'   => $totalProducts,
            'total_users'      => $totalUsers,
            'total_limited'    => $totalLimited,
            'total_stock'      => $totalStock,
            // + kembalikan nilai baru
            'total_keuntungan' => $totalKeuntungan,
            'total_modal'      => $totalModal,
        ]);
    }

    /**
     * 📦 Daftar semua order (admin) dengan agregasi item
     * Response: [{ id, user_name, total_items, total_harga, tanggal, status }]
     */
    public function orders(Request $request)
    {
        $admin = $request->user();
        if (! $admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        // + deteksi kemungkinan kolom kurir di tabel orders
        $hasKurirId     = \Illuminate\Support\Facades\Schema::hasColumn('orders','kurir_id');
        $hasCourierId   = \Illuminate\Support\Facades\Schema::hasColumn('orders','courier_id');
        $hasKurirKode   = \Illuminate\Support\Facades\Schema::hasColumn('orders','kurir_kode');
        $hasCourierCode = \Illuminate\Support\Facades\Schema::hasColumn('orders','courier_code');
        $hasKurirNama   = \Illuminate\Support\Facades\Schema::hasColumn('orders','kurir_nama');
        $hasCourierName = \Illuminate\Support\Facades\Schema::hasColumn('orders','courier_name');

        // { changed code } schema checks
        $hasTotalPrice      = Schema::hasColumn('orders', 'total_price');
        $hasTotalLegacy     = Schema::hasColumn('orders', 'total');
        $hasCancelBy        = Schema::hasColumn('orders', 'cancel_requested_by');
        $hasCancelApproved  = Schema::hasColumn('orders', 'cancel_approved');

        $select = [
            'orders.id',
            'users.name as user_name',
            DB::raw('COALESCE(SUM(order_items.qty),0) as total_items'),
            // total_harga: prefer total_price, else legacy total, else sum item*price
            DB::raw(
                ($hasTotalPrice
                    ? 'orders.total_price'
                    : ($hasTotalLegacy ? 'orders.total' : 'COALESCE(SUM(order_items.qty * order_items.price),0)')) . ' as total_harga'
            ),
            DB::raw('orders.created_at as tanggal'),
            'orders.status',
            'orders.order_code', // + added
            $hasCancelBy ? 'orders.cancel_requested_by' : DB::raw('NULL as cancel_requested_by'),
            $hasCancelApproved ? 'orders.cancel_approved' : DB::raw('0 as cancel_approved'),
        ];

        $groupBy = ['orders.id','users.name','orders.created_at','orders.status','orders.order_code']; // + order_code
        if ($hasTotalPrice) {
            $groupBy[] = 'orders.total_price';
        } elseif ($hasTotalLegacy) {
            $groupBy[] = 'orders.total';
        }
        if ($hasCancelBy) $groupBy[] = 'orders.cancel_requested_by';
        if ($hasCancelApproved) $groupBy[] = 'orders.cancel_approved';

        $rowsQuery = \Illuminate\Support\Facades\DB::table('orders')
            ->leftJoin('users','orders.user_id','=','users.id')
            ->leftJoin('order_items','order_items.order_id','=','orders.id');

        $rows = $rowsQuery
            ->select($select)
            ->groupBy($groupBy)
            ->orderBy('orders.created_at','desc')
            ->get()
            ->map(function ($r) {
                $r->tanggal = $r->tanggal ? \Carbon\Carbon::parse($r->tanggal)->toDateTimeString() : null;
                $r->total_items = (int) $r->total_items;
                $r->total_harga = (float) $r->total_harga;
                $r->cancel_approved = (bool) $r->cancel_approved;
                // normalisasi status legacy
                $r->status = ($r->status === 'history') ? 'cancelled' : $r->status;
                return $r;
            });

        return response()->json($rows);
    }

    /**
     * ✏️ Ubah status order (admin)
     * Body: { status: 'pending'|'shipping'|'done'|'cancelled' }
     */
    public function updateOrderStatus(Request $request, $id)
    {
        $admin = $request->user();
        if (! $admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,shipping,done,cancelled',
        ]);

        $order = Order::find($id);
        if (! $order) {
            return response()->json(['message' => 'Order tidak ditemukan'], 404);
        }

        // Jika admin mencoba set langsung ke cancelled tanpa permintaan user, arahkan untuk pakai request-cancel endpoint
        if ($validated['status'] === 'cancelled' && $order->cancel_requested_by !== 'user') {
            return response()->json(['message' => 'Gunakan endpoint request-cancel untuk meminta pembatalan ke user'], 422);
        }

        $order->status = $validated['status'];
        $order->save();

        return response()->json([
            'message' => 'Status order diperbarui',
            'data' => $order,
        ]);
    }

    // Admin minta pembatalan (butuh persetujuan user)
    public function requestCancel(Request $request, $id)
    {
        $admin = $request->user();
        if (! $admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $order = Order::find($id);
        if (! $order) {
            return response()->json(['message' => 'Order tidak ditemukan'], 404);
        }
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Hanya order pending yang bisa diminta dibatalkan'], 400);
        }
        if ($order->cancel_requested_by && $order->cancel_requested_by !== 'admin') {
            return response()->json(['message' => 'User sudah mengajukan pembatalan'], 409);
        }
        $order->cancel_requested_by = 'admin';
        $order->cancel_approved = false;
        $order->save();

        return response()->json(['message' => 'Permintaan pembatalan dikirim ke user', 'data' => $order]);
    }

    // Admin menerima permintaan pembatalan dari user
    public function acceptCancel(Request $request, $id)
    {
        $admin = $request->user();
        if (! $admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $order = Order::find($id);
        if (! $order) {
            return response()->json(['message' => 'Order tidak ditemukan'], 404);
        }
        if ($order->status !== 'pending' || $order->cancel_requested_by !== 'user') {
            return response()->json(['message' => 'Tidak ada permintaan pembatalan dari user'], 400);
        }

        $order->status = 'cancelled';
        $order->cancel_approved = true;
        $order->save();

        return response()->json(['message' => 'Order dibatalkan', 'data' => $order]);
    }

    /**
     * 🔎 Detail item pada order (admin)
     * GET /admin/orders/{id}/items
     */
    public function orderItems(Request $request, $id)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $order = Order::find($id);
        if (!$order) {
            return response()->json(['message' => 'Order tidak ditemukan'], 404);
        }

        $rows = \Illuminate\Support\Facades\DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('order_items.order_id', $id)
            ->select(
                'order_items.id',
                'order_items.product_id',
                'order_items.qty',
                'order_items.price',
                'products.nama_product',
                'products.foto',
                'products.product_code' // + tambah kode produk
            )
            ->get();

        $items = $rows->map(function ($r) {
            $subtotal = (float)$r->price * (int)$r->qty;
            // Bangun URL gambar HANYA dari storage/images
            $img = null;
            if ($r->foto && \Illuminate\Support\Facades\Storage::disk('public')->exists('images/' . $r->foto)) {
                $img = asset('storage/images/' . $r->foto);
            }
            return [
                'id'            => (int)$r->id,
                'product_id'    => (int)$r->product_id,
                'qty'           => (int)$r->qty,
                'price'         => (float)$r->price,
                'subtotal'      => $subtotal,
                'product_name'  => $r->nama_product,
                'product_image' => $img,
                'product_code'  => $r->product_code, // + expose product_code
            ];
        })->values();

        return response()->json(['items' => $items]);
    }
}
