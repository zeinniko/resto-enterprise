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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('employee_code', 30)->unique();
            $table->string('name');
            $table->string('nik', 20)->nullable()->unique();
            $table->string('phone', 20)->nullable();
            $table->string('email')->nullable();
            $table->enum('position', ['MANAGER', 'HEAD_CHEF', 'COOK', 'WAITER', 'CASHIER', 'DISHWASHER', 'BARISTA']);
            $table->enum('employment_status', ['PERMANENT', 'CONTRACT', 'DAILY_WORKER'])->default('CONTRACT');
            $table->decimal('basic_salary', 15, 2)->default(0);
            $table->decimal('hourly_rate', 15, 2)->default(0);
            $table->date('joined_date');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
