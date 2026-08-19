<?php

namespace App\Providers;

use App\Enums\UserRoleEnum;
use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\Department;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Grade;
use App\Models\GradeLevel;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\TeacherShift;
use App\Models\User;
use App\Policies\AcademicYearPolicy;
use App\Policies\AttendancePolicy;
use App\Policies\DepartmentPolicy;
use App\Policies\ExamPolicy;
use App\Policies\ExamResultPolicy;
use App\Policies\GradeLevelPolicy;
use App\Policies\GradePolicy;
use App\Policies\SchoolClassPolicy;
use App\Policies\StudentPolicy;
use App\Policies\TeacherPolicy;
use App\Policies\TeacherShiftPolicy;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Student::class, StudentPolicy::class);
        Gate::policy(Teacher::class, TeacherPolicy::class);
        Gate::policy(SchoolClass::class, SchoolClassPolicy::class);
        Gate::policy(Grade::class, GradePolicy::class);
        Gate::policy(GradeLevel::class, GradeLevelPolicy::class);
        Gate::policy(AcademicYear::class, AcademicYearPolicy::class);
        Gate::policy(Attendance::class, AttendancePolicy::class);
        Gate::policy(Department::class, DepartmentPolicy::class);
        Gate::policy(TeacherShift::class, TeacherShiftPolicy::class);
        Gate::policy(Exam::class, ExamPolicy::class);
        Gate::policy(ExamResult::class, ExamResultPolicy::class);

        Gate::define('view-any-final-results', function (User $user) {
            return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
        });

        Gate::define('view-final-result', function (User $user, Student $student) {
            if ($user->role === UserRoleEnum::STUDENT) {
                return $student->user_id === $user->id;
            }

            return in_array($user->role, [UserRoleEnum::ADMIN, UserRoleEnum::TEACHER], true);
        });

        Gate::before(function (User $user, string $ability) {
            return $user->role === UserRoleEnum::ADMIN ? true : null;
        });
    }
}