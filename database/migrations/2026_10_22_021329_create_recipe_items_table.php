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
        Schema::create('recipe_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->comment('Bahan baku / setengah jadi yang terpotong')->constrained()->restrictOnDelete();
            $table->decimal('quantity', 12, 4)->comment('Takaran bahan per porsi');
            $table->foreignId('unit_id')->constrained('units');
            $table->decimal('waste_percentage', 5, 2)->default(0.00)->comment('Faktor susut saat pemrosesan (misal kupas kentang 10%)');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recipe_items');
    }
};
