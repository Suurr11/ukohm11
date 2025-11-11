<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
	public function up(): void
	{
		// Ubah struktur tabel orders
		Schema::table('orders', function (Blueprint $table) {
			// hapus kolom lama jika ada
			if (Schema::hasColumn('orders', 'product_name')) {
				$table->dropColumn('product_name');
			}
			if (Schema::hasColumn('orders', 'product_image')) {
				$table->dropColumn('product_image');
			}
			if (Schema::hasColumn('orders', 'total')) {
				$table->dropColumn('total');
			}
			if (Schema::hasColumn('orders', 'tanggal')) {
				$table->dropColumn('tanggal');
			}

			// tambahkan kolom baru
			if (!Schema::hasColumn('orders', 'order_code')) {
				$table->string('order_code')->unique()->after('user_id');
			}
			if (!Schema::hasColumn('orders', 'total_price')) {
				$table->decimal('total_price', 12, 2)->after('order_code');
			}
			// status enum sudah ada di migration lama; jika belum ada, tambahkan
			if (!Schema::hasColumn('orders', 'status')) {
    			$table->enum('status', ['pending', 'dikirim', 'selesai', 'dibatalkan'])->default('pending');
			}

		});

		// Buat tabel order_items
		if (!Schema::hasTable('order_items')) {
			Schema::create('order_items', function (Blueprint $table) {
				$table->id();
				$table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
				$table->foreignId('product_id')->constrained('products')->onDelete('cascade');
				$table->integer('qty');
				$table->decimal('price', 12, 2); // harga satuan saat order
				$table->timestamps();
			});
		}
	}

	public function down(): void
	{
		// Hapus tabel order_items
		Schema::dropIfExists('order_items');

		// Kembalikan struktur orders ke kondisi sebelumnya (minimal: hapus kolom baru)
		Schema::table('orders', function (Blueprint $table) {
			if (Schema::hasColumn('orders', 'order_code')) {
				$table->dropColumn('order_code');
			}
			if (Schema::hasColumn('orders', 'total_price')) {
				$table->dropColumn('total_price');
			}
			// kolom status dibiarkan karena mungkin dipakai
		});
	}	
};
