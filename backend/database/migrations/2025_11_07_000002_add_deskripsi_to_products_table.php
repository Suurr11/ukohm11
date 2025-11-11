<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('products') && !Schema::hasColumn('products', 'deskripsi')) {
            Schema::table('products', function (Blueprint $table) {
                $table->text('deskripsi')->nullable()->after('scale_diecast');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'deskripsi')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('deskripsi');
            });
        }
    }
};
