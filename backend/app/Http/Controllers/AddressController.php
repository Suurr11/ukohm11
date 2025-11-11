<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Address;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AddressController extends Controller
{
    // 🔹 GET /addresses — ambil semua alamat user
    public function index()
    {
        $user = Auth::user();
        $addresses = Address::where('user_id', $user->id)->get();

        return response()->json([
            'status' => 'success',
            'data' => $addresses,
        ]);
    }

    // 🔹 GET /addresses/primary — ambil alamat utama user
    public function getPrimary()
    {
        $user = Auth::user();
        $address = Address::where('user_id', $user->id)
            ->where('is_primary', true)
            ->first();

        if (!$address) {
            return response()->json([
                'status' => 'error',
                'message' => 'Belum ada alamat utama',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'address' => $address,
        ]);
    }

    // 🔹 POST /addresses — simpan alamat baru
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'street' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'postal_code' => 'required|string|max:20',
            'country' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();

        $address = Address::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'phone' => $request->phone,
            'street' => $request->street,
            'city' => $request->city,
            'postal_code' => $request->postal_code,
            'country' => $request->country,
            'is_primary' => false,
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $address,
        ], 201);
    }

    // 🔹 DELETE /addresses/{id} — hapus alamat
    public function destroy($id)
    {
        $user = Auth::user();
        $address = Address::where('user_id', $user->id)->where('id', $id)->first();

        if (!$address) {
            return response()->json([
                'status' => 'error',
                'message' => 'Address not found',
            ], 404);
        }

        $address->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Address deleted',
        ]);
    }

    // 🔹 PUT /addresses/{id}/primary — set alamat utama
    public function setPrimary($id)
    {
        $user = Auth::user();

        $address = Address::where('user_id', $user->id)->where('id', $id)->first();

        if (!$address) {
            return response()->json([
                'status' => 'error',
                'message' => 'Address not found',
            ], 404);
        }

        // Nonaktifkan semua alamat lain
        Address::where('user_id', $user->id)->update(['is_primary' => false]);

        // Jadikan alamat ini utama
        $address->is_primary = true;
        $address->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Primary address updated successfully',
            'data' => $address,
        ]);
    }

    // --- NEW: PUT /addresses/{id} — update alamat
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'street' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'postal_code' => 'required|string|max:20',
            'country' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();
        $address = Address::where('user_id', $user->id)->where('id', $id)->first();

        if (! $address) {
            return response()->json(['status' => 'error', 'message' => 'Address not found'], 404);
        }

        $address->name = $request->name;
        $address->phone = $request->phone;
        $address->street = $request->street;
        $address->city = $request->city;
        $address->postal_code = $request->postal_code;
        $address->country = $request->country;
        // jangan ubah is_primary di sini (gunakan endpoint khusus)
        $address->save();

        return response()->json([
            'status' => 'success',
            'data' => $address,
        ]);
    }

    // 🔹 GET /addresses/{id} — ambil satu alamat milik user yang login
    public function show($id)
    {
        $user = Auth::user();
        $address = Address::where('user_id', $user->id)->where('id', $id)->first();

        if (!$address) {
            return response()->json([
                'status' => 'error',
                'message' => 'Address not found',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $address,
        ]);
    }
}
