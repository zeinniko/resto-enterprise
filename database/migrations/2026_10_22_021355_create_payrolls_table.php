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
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_charge_allocation_id')->nullable()->constrained()->nullOnDelete();
            $table->string('period', 7); // Format YYYY-MM
            $table->decimal('basic_salary', 15, 2);
            $table->decimal('overtime_pay', 15, 2)->default(0);
            $table->decimal('service_charge_bonus', 15, 2)->default(0);
            $table->decimal('deductions', 15, 2)->default(0)->comment('Potongan keterlambatan atau kasbon');
            $table->decimal('net_salary', 15, 2);
            $table->enum('status', ['DRAFT', 'APPROVED', 'PAID'])->default('DRAFT');
            $table->dateTime('paid_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
