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
        Schema::create('service_charge_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('period', 7); // Format YYYY-MM
            $table->decimal('total_collected', 15, 2);
            $table->decimal('allocated_percentage', 5, 2)->default(100.00);
            $table->decimal('total_amount_allocated', 15, 2);
            $table->enum('status', ['DRAFT', 'DISTRIBUTED'])->default('DRAFT');
            $table->timestamps();

            $table->unique(['branch_id', 'period']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_charge_allocations');
    }
};
