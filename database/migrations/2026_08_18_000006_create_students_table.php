<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('class_id')->constrained('school_classes')->restrictOnDelete();
            $table->foreignUuid('grade_level_id')->constrained('grade_levels')->restrictOnDelete();
            $table->foreignUuid('academic_year_id')->constrained('academic_years')->restrictOnDelete();
            $table->integer('age')->nullable();
            $table->date('admission_date');
            $table->string('blood_group')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['class_id', 'academic_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};