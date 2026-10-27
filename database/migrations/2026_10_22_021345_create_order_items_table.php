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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('menu_item_id')->constrained()->restrictOnDelete();
            $table->decimal('unit_price', 15, 2);
            $table->unsignedInteger('qty');
            $table->decimal('subtotal', 15, 2);
            $table->string('notes')->nullable(); // e.g. Tanpa Bawang, pedas sedang
            $table->enum('kitchen_status', ['PENDING', 'COOKING', 'READY', 'SERVED'])->default('PENDING');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
