<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddLogoPathAndTimestampsToKurirTable extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('kurir')) {
            Schema::table('kurir', function (Blueprint $table) {
                if (!Schema::hasColumn('kurir', 'logo_path')) {
                    $table->string('logo_path')->nullable()->after('ongkir');
                }
                if (!Schema::hasColumn('kurir', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }
                if (!Schema::hasColumn('kurir', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('kurir')) {
            Schema::table('kurir', function (Blueprint $table) {
                if (Schema::hasColumn('kurir', 'logo_path')) {
                    $table->dropColumn('logo_path');
                }
                // Hindari drop timestamps agar tidak menghapus kolom yang mungkin sudah ada sebelumnya
            });
        }
    }
}
