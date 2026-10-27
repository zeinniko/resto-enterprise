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
        Schema::create('accounts_receivables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('partner_name', 100); // e.g. GoFood, GrabFood, ShopeeFood
            $table->decimal('total_amount', 15, 2);
            $table->decimal('received_amount', 15, 2)->default(0);
            $table->date('due_date')->nullable();
            $table->enum('status', ['UNPAID', 'PARTIAL', 'PAID'])->default('UNPAID');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts_receivables');
    }
};
