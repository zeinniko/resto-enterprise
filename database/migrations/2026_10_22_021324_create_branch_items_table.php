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
        Schema::create('branch_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained()->cascadeOnDelete();
            $table->decimal('min_stock', 12, 2)->default(0);
            $table->decimal('reorder_point', 12, 2)->default(0);
            $table->decimal('purchase_price', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        
            $table->unique(['branch_id', 'item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branch_items');
    }
};
