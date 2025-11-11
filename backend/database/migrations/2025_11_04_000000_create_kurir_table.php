<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('kurir', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('kode')->unique();
            $table->decimal('ongkir', 12, 2)->default(0);
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        // Seed contoh data awal
        DB::table('kurir')->insert([
            ['nama' => 'JNE Reg',  'kode' => 'JNE',  'ongkir' => 15000, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'J&T Reg',  'kode' => 'JNT',  'ongkir' => 17000, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'SiCepat',  'kode' => 'SICE', 'ongkir' => 20000, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('kurir');
    }
};
