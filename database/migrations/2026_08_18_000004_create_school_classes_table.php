<?php

use App\Enums\SchoolClassStatusEnum;
use App\Enums\SchoolClassTypeEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_classes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('grade_level_id')->constrained('grade_levels')->restrictOnDelete();
            $table->foreignUuid('academic_year_id')->constrained('academic_years')->restrictOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('capacity')->nullable();
            $table->enum('status', [
                SchoolClassStatusEnum::ACTIVE->value,
                SchoolClassStatusEnum::INACTIVE->value,
                SchoolClassStatusEnum::MAINTENANCE->value,
            ])->default(SchoolClassStatusEnum::ACTIVE->value)->index();
            $table->enum('type', [
                SchoolClassTypeEnum::GENDER_MALE->value,
                SchoolClassTypeEnum::GENDER_FEMALE->value,
                SchoolClassTypeEnum::GENDER_MIX->value,
            ])->default(SchoolClassTypeEnum::GENDER_MIX->value);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['grade_level_id', 'academic_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_classes');
    }
};