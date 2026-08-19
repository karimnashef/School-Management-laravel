<?php

namespace App\Http\Controllers;

use App\Http\ApiResponse;
use App\Http\Requests\TeacherShift\StoreTeacherShiftRequest;
use App\Http\Requests\TeacherShift\UpdateTeacherShiftRequest;
use App\Http\Resources\TeacherShiftResource;
use App\Models\TeacherShift;
use App\Services\TeacherShiftService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherShiftController extends Controller
{
    public function __construct(private readonly TeacherShiftService $service) {}

    public function index(Request $request): JsonResponse
    {
        return ApiResponse::paginated(
            $this->service->paginate((int) $request->query('per_page', 15))
        );
    }

    public function store(StoreTeacherShiftRequest $request): JsonResponse
    {
        return ApiResponse::success(
            new TeacherShiftResource($this->service->create($request->validated())),
            'Teacher shift created successfully',
            201
        );
    }

    public function show(TeacherShift $shift): JsonResponse
    {
        return ApiResponse::success(
            new TeacherShiftResource($shift->load(['teacher.user', 'class.gradeLevel', 'switchTo.user']))
        );
    }

    public function update(UpdateTeacherShiftRequest $request, TeacherShift $shift): JsonResponse
    {
        return ApiResponse::success(
            new TeacherShiftResource($this->service->update($shift, $request->validated())),
            'Teacher shift updated successfully'
        );
    }

    public function destroy(TeacherShift $shift): JsonResponse
    {
        $this->service->delete($shift);

        return ApiResponse::success(null, 'Teacher shift deleted successfully');
    }
}