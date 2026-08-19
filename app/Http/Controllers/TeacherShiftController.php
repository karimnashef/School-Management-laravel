<?php

namespace App\Http\Controllers;

use App\Http\ApiResponse;
use App\Http\Requests\TeacherShift\GenerateTeacherShiftsRequest;
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
        $this->authorize('viewAny', TeacherShift::class);

        return ApiResponse::paginated(
            $this->service->paginate(
                (int) $request->query('per_page', 15),
                $request->query('from_date'),
                $request->query('to_date'),
                $request->query('teacher_id'),
                $request->query('class_id')
            ),
            TeacherShiftResource::class
        );
    }

    public function generate(GenerateTeacherShiftsRequest $request): JsonResponse
    {
        $this->authorize('create', TeacherShift::class);

        return ApiResponse::success(
            TeacherShiftResource::collection($this->service->generate($request->validated())),
            'Schedule generated successfully',
            201
        );
    }

    public function store(StoreTeacherShiftRequest $request): JsonResponse
    {
        $this->authorize('create', TeacherShift::class);

        return ApiResponse::success(
            new TeacherShiftResource($this->service->create($request->validated())),
            'Teacher shift created successfully',
            201
        );
    }

    public function show(TeacherShift $shift): JsonResponse
    {
        $this->authorize('view', $shift);

        return ApiResponse::success(
            new TeacherShiftResource($shift->load(['teacher.user', 'class.gradeLevel', 'switchTo.user']))
        );
    }

    public function update(UpdateTeacherShiftRequest $request, TeacherShift $shift): JsonResponse
    {
        $this->authorize('update', $shift);

        return ApiResponse::success(
            new TeacherShiftResource($this->service->update($shift, $request->validated())),
            'Teacher shift updated successfully'
        );
    }

    public function destroy(TeacherShift $shift): JsonResponse
    {
        $this->authorize('delete', $shift);

        $this->service->delete($shift);

        return ApiResponse::success(null, 'Teacher shift deleted successfully');
    }
}