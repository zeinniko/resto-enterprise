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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->enum('payment_method', ['CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'QRIS', 'GOFOOD', 'GRABFOOD', 'SHOPEEFOOD']);
            $table->decimal('amount_paid', 15, 2);
            $table->decimal('change_given', 15, 2)->default(0);
            $table->string('reference_number', 100)->nullable(); // Nomor resi / approval code EDC
            $table->dateTime('paid_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
