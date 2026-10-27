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
        Schema::create('stock_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('storage_location_id')->constrained()->restrictOnDelete();
            $table->foreignId('item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('goods_receipt_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('production_order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('batch_number', 50);
            $table->decimal('initial_qty', 12, 4);
            $table->decimal('current_qty', 12, 4);
            $table->foreignId('unit_id')->constrained('units');
            $table->decimal('unit_cost', 15, 2)->comment('HPP aktual per batch');
            $table->date('exp_date')->nullable()->index()->comment('Indeks utama sorting FEFO');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_batches');
    }
};
