<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('exam_type', ['quiz', 'midterm', 'final']);
            $table->string('name');
            $table->string('subject');
            $table->foreignUuid('class_id')->nullable()->constrained('school_classes')->nullOnDelete();
            $table->foreignUuid('grade_level_id')->constrained('grade_levels')->restrictOnDelete();
            $table->foreignUuid('academic_year_id')->constrained('academic_years')->restrictOnDelete();
            $table->foreignUuid('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->date('exam_date');
            $table->decimal('max_grade', 5, 2)->default(100);
            $table->enum('status', ['draft', 'published'])->default('draft');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};