<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('goods_receipt_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goods_receipt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained()->restrictOnDelete();
            $table->foreignId('storage_location_id')->constrained()->restrictOnDelete();
            $table->decimal('qty_received', 12, 2);
            $table->foreignId('unit_id')->constrained('units');
            $table->decimal('unit_cost', 15, 2)->comment('Harga beli aktual per unit');
            $table->date('exp_date')->nullable()->comment('Kunci penentuan tanggal kadaluwarsa FEFO');
            $table->string('batch_number', 50)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goods_receipt_items');
    }
};
