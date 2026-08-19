<?php

use App\Enums\TeacherShiftStatusEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_shifts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignUuid('class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignUuid('switch_to_id')->nullable()->constrained('teachers')->nullOnDelete();

            $table->date('shift_date');
            $table->time('start_time');
            $table->time('end_time');

            $table->enum('status',[
                TeacherShiftStatusEnum::SCHEDULED->value,
                TeacherShiftStatusEnum::COMPLETED->value,
                TeacherShiftStatusEnum::ABSENT->value,
                TeacherShiftStatusEnum::CANCELLED->value,
             ])
             ->default(TeacherShiftStatusEnum::SCHEDULED->value);

            $table->text('notes')->nullable();

            $table->index(['teacher_id' , 'shift_date']);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_shifts');
    }
};
