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
        Schema::create('production_orders', function (Blueprint $table) {
            $table->id();
            $table->string('production_number', 50)->unique();
            $table->foreignId('branch_id')->comment('Central Kitchen')->constrained()->cascadeOnDelete();
            $table->foreignId('recipe_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('target_item_id')->comment('Item hasil konversi')->constrained('items')->restrictOnDelete();
            $table->foreignId('storage_location_id')->comment('Lokasi simpan hasil')->constrained()->restrictOnDelete();
            $table->decimal('target_qty', 12, 2);
            $table->decimal('actual_qty', 12, 2)->default(0);
            $table->foreignId('unit_id')->constrained('units');
            $table->enum('status', ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])->default('PLANNED');
            $table->date('production_date');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_orders');
    }
};
