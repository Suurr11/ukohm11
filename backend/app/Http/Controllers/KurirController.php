<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class KurirController extends Controller
{
    // GET /api/kurir
    public function index()
    {
        $list = collect();

        if (Schema::hasTable('kurir')) {
            $cols = ['id', 'nama', 'kode', 'ongkir'];
            $q = DB::table('kurir')->select($cols);
            if (Schema::hasColumn('kurir', 'aktif')) {
                $q->where('aktif', true);
            }
            $list = $q->orderBy('nama')->get();
        } elseif (Schema::hasTable('couriers')) {
            $cols = [
                'id',
                DB::raw('name as nama'),
                DB::raw('code as kode'),
                DB::raw('shipping_cost as ongkir'),
            ];
            $q = DB::table('couriers')->select($cols);
            if (Schema::hasColumn('couriers', 'active')) {
                $q->where('active', true);
            }
            $list = $q->orderBy('name')->get();
        }

        if ($list->isEmpty()) {
            $list = collect([
                ['id' => 1, 'nama' => 'JNE Reg',  'kode' => 'JNE',  'ongkir' => 15000],
                ['id' => 2, 'nama' => 'J&T Reg',  'kode' => 'JNT',  'ongkir' => 17000],
                ['id' => 3, 'nama' => 'SiCepat',  'kode' => 'SICE', 'ongkir' => 20000],
            ]);
        }

        return response()->json($list->values());
    }

    // ADMIN: List kurir
    public function adminIndex(Request $request)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }
        if (!Schema::hasTable('kurir')) {
            return response()->json(['message' => 'Tabel kurir belum tersedia'], 500);
        }

        $select = ['id', 'nama', 'kode', 'ongkir'];
        if (Schema::hasColumn('kurir', 'aktif')) { $select[] = 'aktif'; }

        $rows = DB::table('kurir')->select($select)->orderBy('nama')->get();
        if (!in_array('aktif', $select)) {
            $rows = $rows->map(function ($r) { $r->aktif = true; return $r; });
        }

        return response()->json($rows);
    }

    // ADMIN: Tambah kurir
    public function adminStore(Request $request)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }
        if (!Schema::hasTable('kurir')) {
            return response()->json(['message' => 'Tabel kurir belum tersedia'], 500);
        }

        $validated = $request->validate([
            'nama'  => 'required|string|max:255',
            'kode'  => ['required','string','max:50', Rule::unique('kurir','kode')],
            'ongkir'=> 'required|numeric|min:0',
            'aktif' => 'nullable|boolean',
            // 'logo' dihapus
        ]);

        $data = [
            'nama'   => $validated['nama'],
            'kode'   => $validated['kode'],
            'ongkir' => (float)$validated['ongkir'],
        ];
        if (Schema::hasColumn('kurir', 'aktif')) {
            $data['aktif'] = isset($validated['aktif']) ? (bool)$validated['aktif'] : true;
        }
        if (Schema::hasColumn('kurir', 'created_at')) { $data['created_at'] = now(); }
        if (Schema::hasColumn('kurir', 'updated_at')) { $data['updated_at'] = now(); }

        $id = DB::table('kurir')->insertGetId($data);

        $select = ['id','nama','kode','ongkir'];
        if (Schema::hasColumn('kurir', 'aktif')) $select[] = 'aktif';
        if (Schema::hasColumn('kurir', 'created_at')) $select[] = 'created_at';
        if (Schema::hasColumn('kurir', 'updated_at')) $select[] = 'updated_at';

        $row = DB::table('kurir')->select($select)->where('id',$id)->first();
        if (!in_array('aktif',$select)) { $row->aktif = true; }

        return response()->json(['message' => 'Kurir dibuat','data'=>$row]);
    }

    // ADMIN: Update kurir
    public function adminUpdate(Request $request, $id)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }
        if (!Schema::hasTable('kurir')) {
            return response()->json(['message' => 'Tabel kurir belum tersedia'], 500);
        }

        $row = DB::table('kurir')->where('id',$id)->first();
        if (!$row) return response()->json(['message'=>'Kurir tidak ditemukan'],404);

        $validated = $request->validate([
            'nama'   => 'sometimes|string|max:255',
            'kode'   => ['sometimes','string','max:50', Rule::unique('kurir','kode')->ignore($id,'id')],
            'ongkir' => 'sometimes|numeric|min:0',
            'aktif'  => 'sometimes|boolean',
            // 'logo' dihapus
        ]);

        $data = [];
        if (array_key_exists('nama', $validated))   { $data['nama'] = $validated['nama']; }
        if (array_key_exists('kode', $validated))   { $data['kode'] = $validated['kode']; }
        if (array_key_exists('ongkir', $validated)) { $data['ongkir'] = (float)$validated['ongkir']; }
        if (Schema::hasColumn('kurir', 'aktif') && array_key_exists('aktif', $validated)) {
            $data['aktif'] = (bool)$validated['aktif'];
        }
        if (Schema::hasColumn('kurir', 'updated_at')) { $data['updated_at'] = now(); }

        if (!empty($data)) {
            DB::table('kurir')->where('id',$id)->update($data);
        }

        $select = ['id','nama','kode','ongkir'];
        if (Schema::hasColumn('kurir', 'aktif')) $select[] = 'aktif';
        if (Schema::hasColumn('kurir', 'created_at')) $select[] = 'created_at';
        if (Schema::hasColumn('kurir', 'updated_at')) $select[] = 'updated_at';

        $updated = DB::table('kurir')->select($select)->where('id',$id)->first();
        if (!in_array('aktif',$select)) { $updated->aktif = true; }

        return response()->json(['message'=>'Kurir diperbarui','data'=>$updated]);
    }

    // ADMIN: Hapus kurir
    public function adminDestroy(Request $request, $id)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }
        if (!Schema::hasTable('kurir')) {
            return response()->json(['message' => 'Tabel kurir belum tersedia'], 500);
        }

        $row = DB::table('kurir')->where('id',$id)->first();
        if (!$row) return response()->json(['message'=>'Kurir tidak ditemukan'],404);

        DB::table('kurir')->where('id',$id)->delete();

        return response()->json(['message'=>'Kurir dihapus']);
    }
}
