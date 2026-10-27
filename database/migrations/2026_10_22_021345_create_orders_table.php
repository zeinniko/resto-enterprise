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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shift_id')->constrained()->cascadeOnDelete();
            $table->foreignId('table_id')->nullable()->constrained()->nullOnDelete();
            $table->string('order_number', 50)->unique();
            $table->enum('order_type', ['DINE_IN', 'TAKE_AWAY', 'DELIVERY_AGGREGATOR']);
            $table->enum('status', ['PENDING', 'IN_KITCHEN', 'SERVED', 'PAID', 'CANCELLED'])->default('PENDING');
            $table->decimal('subtotal', 15, 2);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0)->comment('Pajak Restoran / PB1');
            $table->decimal('service_charge_amount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2);
            $table->foreignId('user_id')->comment('Kasir / Waiter')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
