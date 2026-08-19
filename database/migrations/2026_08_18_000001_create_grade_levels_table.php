<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_levels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->integer('level');
            $table->string('stage');
            $table->text('description')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['level', 'stage']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_levels');
    }
};
