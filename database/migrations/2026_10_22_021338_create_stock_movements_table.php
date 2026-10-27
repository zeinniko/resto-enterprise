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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('stock_batch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('from_location_id')->nullable()->constrained('storage_locations')->nullOnDelete();
            $table->foreignId('to_location_id')->nullable()->constrained('storage_locations')->nullOnDelete();
            $table->enum('movement_type', [
                'IN_PURCHASE', 'IN_PRODUCTION', 'IN_TRANSFER', 
                'OUT_SALE', 'OUT_TRANSFER', 'OUT_PRODUCTION', 
                'WASTE', 'ADJUSTMENT'
            ]);
            $table->decimal('qty', 12, 4);
            $table->foreignId('unit_id')->constrained('units');
            $table->nullableMorphs('reference'); // Menghubungkan ke Order, PurchaseOrder, WasteLog, dll.
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
