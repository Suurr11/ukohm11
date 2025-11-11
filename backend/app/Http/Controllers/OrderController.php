<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage; // + tambah Storage

class OrderController extends Controller
{
    // GET /api/orders?status=...
    public function index(Request $request)
    {
        $user = Auth::user();
        $status = $request->query('status');

        $query = Order::where('user_id', $user->id);

        if ($status) {
            if ($status === 'cancelled') {
                $query->whereIn('status', ['cancelled', 'history']);
            } else {
                $query->where('status', $status);
            }
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        // Ambil item order (order_items + products) lalu kelompokkan per order_id
        $orderIds = $orders->pluck('id')->all();
        $itemsGrouped = collect();

        if (!empty($orderIds)) {
            // + ambil flat rows dulu agar bisa kumpulkan product_id
            $flatRows = DB::table('order_items')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->whereIn('order_items.order_id', $orderIds)
                ->select(
                    'order_items.order_id',
                    'order_items.product_id',
                    'order_items.qty',
                    'order_items.price',
                    'products.nama_product',
                    'products.foto'
                )
                ->get();

            $itemsGrouped = $flatRows->groupBy('order_id');

            // + ambil semua ulasan milik user untuk product_id terkait
            $productIds = $flatRows->pluck('product_id')->unique()->values()->all();
            $reviewsByProduct = collect();
            if (!empty($productIds)) {
                $reviewsByProduct = DB::table('ulasan')
                    ->where('user_id', $user->id)
                    ->whereIn('product_id', $productIds)
                    ->select('id','product_id','rating','komentar')
                    ->get()
                    ->keyBy('product_id');
            }
        } else {
            $reviewsByProduct = collect();
        }

        // { changed code } map orders + fallback fields
        $hasCancelBy       = Schema::hasColumn('orders', 'cancel_requested_by');
        $hasCancelApproved = Schema::hasColumn('orders', 'cancel_approved');

        $orders = $orders->map(function ($o) use ($itemsGrouped, $hasCancelBy, $hasCancelApproved, $reviewsByProduct) {
            $items = ($itemsGrouped[$o->id] ?? collect())->map(function ($r) use ($reviewsByProduct) {
                // + Hanya dari storage/images
                $img = null;
                if ($r->foto && \Illuminate\Support\Facades\Storage::disk('public')->exists('images/' . $r->foto)) {
                    $img = asset('storage/images/' . $r->foto);
                }

                // + sisipkan data ulasan milik user jika ada
                $rev = $reviewsByProduct->get($r->product_id);
                return [
                    'product_id'     => $r->product_id,
                    'qty'            => (int) $r->qty,
                    'price'          => (float) $r->price,
                    'nama_product'   => $r->nama_product,
                    'product_image'  => $img,
                    'review_id'      => $rev->id ?? null,
                    'user_rating'    => $rev->rating ?? null,
                    'user_komentar'  => $rev->komentar ?? null,
                ];
            })->values();

            $o->setAttribute('items', $items);

            $first = $items->first();
            $displayName = $first['nama_product'] ?? $o->product_name ?? 'Order';
            if ($items->count() > 1) {
                $displayName .= ' + ' . ($items->count() - 1) . ' items';
            }
            $o->setAttribute('product_name', $o->product_name ?? $displayName);
            $o->setAttribute('product_image', $o->product_image ?? ($first['product_image'] ?? null));

            // fallback total_price (pakai kolom legacy 'total' bila ada)
            $o->setAttribute('total_price', $o->total_price ?? ($o->total ?? 0));
            $o->setAttribute('total', $o->total ?? ($o->total_price ?? 0));

            $o->setAttribute('tanggal', $o->tanggal ?? optional($o->created_at)->toDateTimeString());

            // cancel flags (default null/false jika kolom belum ada)
            if ($hasCancelBy) {
                // biarkan nilai dari DB
            } else {
                $o->setAttribute('cancel_requested_by', null);
            }
            if ($hasCancelApproved) {
                // biarkan nilai dari DB
            } else {
                $o->setAttribute('cancel_approved', false);
            }

            // normalisasi status legacy
            $o->setAttribute('status', $o->status === 'history' ? 'cancelled' : $o->status);

            return $o;
        });

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    // POST /api/orders
    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_code'   => 'required|string|unique:orders,order_code',
            'total_price'  => 'required|numeric',
            'status'       => 'required|in:pending,shipping,done,cancelled',
        ]);
        $order = new Order();
        $order->user_id = Auth::id();
        $order->order_code = $validated['order_code'];
        $order->total_price = $validated['total_price'];
        $order->status = $validated['status'];
        $order->save();

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    // GET /api/orders/{id}
    public function show($id)
    {
        $order = Order::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    /**
     * POST /api/orders/{id}/cancel
     * Batalkan order oleh user jika masih pending.
     */
    public function cancel(Request $request, $id)
    {
        $userId = Auth::id();
        $order = Order::where('id', $id)->where('user_id', $userId)->first();

        if (! $order) {
            return response()->json(['success' => false, 'message' => 'Order tidak ditemukan'], 404);
        }

        if ($order->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Order tidak bisa dibatalkan'], 400);
        }

        // User meminta pembatalan — butuh persetujuan admin
        if ($order->cancel_requested_by && $order->cancel_requested_by !== 'user') {
            return response()->json(['success' => false, 'message' => 'Permintaan pembatalan sudah diajukan pihak lain'], 409);
        }
        $order->cancel_requested_by = 'user';
        $order->cancel_approved = false;
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Permintaan pembatalan dikirim. Menunggu persetujuan admin.',
            'data' => $order,
        ]);
    }

    /**
     * User menerima permintaan pembatalan dari admin
     */
    public function acceptCancel(Request $request, $id)
    {
        $userId = Auth::id();
        $order = Order::where('id', $id)->where('user_id', $userId)->first();

        if (! $order) {
            return response()->json(['success' => false, 'message' => 'Order tidak ditemukan'], 404);
        }

        if ($order->status !== 'pending' || $order->cancel_requested_by !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Tidak ada permintaan pembatalan dari admin'], 400);
        }

        $order->status = 'cancelled';
        $order->cancel_approved = true;
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Pembatalan disetujui. Order dibatalkan.',
            'data' => $order,
        ]);
    }

    /**
     * POST /api/orders/{id}/confirm-done
     * User mengonfirmasi pesanan sudah diterima (hanya saat status 'shipping').
     */
    public function confirmDone(Request $request, $id)
    {
        $userId = Auth::id();
        $order = Order::where('id', $id)->where('user_id', $userId)->first();

        if (! $order) {
            return response()->json(['success' => false, 'message' => 'Order tidak ditemukan'], 404);
        }

        if ($order->status !== 'shipping') {
            return response()->json(['success' => false, 'message' => 'Konfirmasi selesai hanya untuk pesanan yang sedang dikirim'], 400);
        }

        $order->status = 'done';
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Pesanan dikonfirmasi selesai.',
            'data' => $order,
        ]);
    }
}
