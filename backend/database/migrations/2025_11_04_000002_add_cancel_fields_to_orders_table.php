<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'cancel_requested_by')) {
                    $table->enum('cancel_requested_by', ['user', 'admin'])->nullable()->after('status');
                }
                if (!Schema::hasColumn('orders', 'cancel_approved')) {
                    $table->boolean('cancel_approved')->default(false)->after('cancel_requested_by');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (Schema::hasColumn('orders', 'cancel_requested_by')) {
                    $table->dropColumn('cancel_requested_by');
                }
                if (Schema::hasColumn('orders', 'cancel_approved')) {
                    $table->dropColumn('cancel_approved');
                }
            });
        }
    }
};
