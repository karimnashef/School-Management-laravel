<?php

use App\Http\Controllers\AcademicYearController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\ExamResultController;
use App\Http\Controllers\FinalResultController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\GradeLevelController;
use App\Http\Controllers\SchoolClassController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\TeacherShiftController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
        Route::post('register', [AuthController::class, 'register'])->middleware('throttle:register');

        Route::middleware(['auth:sanctum', 'active', 'throttle:api'])->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
        });
    });

    Route::middleware(['auth:sanctum', 'active', 'throttle:api'])->group(function () {
        Route::apiResource('users', UserController::class);
        Route::apiResource('students', StudentController::class);
        Route::post('students/{student}/restore', [StudentController::class, 'restore']);

        Route::apiResource('teachers', TeacherController::class);

        Route::apiResource('school-classes', SchoolClassController::class);

        Route::apiResource('grades', GradeController::class);

        Route::apiResource('grade-levels', GradeLevelController::class);

        Route::apiResource('academic-years', AcademicYearController::class);
        Route::post('academic-years/{academic_year}/set-current', [AcademicYearController::class, 'setCurrent']);

        Route::post('attendances/bulk', [AttendanceController::class, 'bulkStore'])->middleware('throttle:bulk');
        Route::apiResource('attendances', AttendanceController::class);

        Route::apiResource('departments', DepartmentController::class);

        Route::apiResource('teacher-shifts', TeacherShiftController::class);

        Route::apiResource('exams', ExamController::class);
        Route::post('exams/{exam}/publish', [ExamController::class, 'publish'])->middleware('throttle:sensitive');

        Route::post('exam-results/bulk', [ExamResultController::class, 'bulkStore'])->middleware('throttle:bulk');
        Route::apiResource('exam-results', ExamResultController::class);

        Route::get('final-results', [FinalResultController::class, 'index']);
        Route::get('final-results/{student}', [FinalResultController::class, 'show']);
    });
});