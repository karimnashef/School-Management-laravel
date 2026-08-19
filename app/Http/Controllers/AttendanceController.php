<?php

namespace App\Http\Controllers;

use App\Http\ApiResponse;
use App\Http\Requests\Attendance\BulkStoreAttendanceRequest;
use App\Http\Requests\Attendance\StoreAttendanceRequest;
use App\Http\Requests\Attendance\UpdateAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Models\Attendance;
use App\Services\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(private readonly AttendanceService $service) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Attendance::class);

        return ApiResponse::paginated(
            $this->service->paginate((int) $request->query('per_page', 15)),
            AttendanceResource::class
        );
    }

    public function store(StoreAttendanceRequest $request): JsonResponse
    {
        $this->authorize('create', Attendance::class);

        return ApiResponse::success(
            new AttendanceResource($this->service->create($request->validated())),
            'Attendance recorded successfully',
            201
        );
    }

    public function bulkStore(BulkStoreAttendanceRequest $request): JsonResponse
    {
        $this->authorize('create', Attendance::class);

        $records = $this->service->bulkCreate($request->validated());

        return ApiResponse::success(
            AttendanceResource::collection($records),
            'Attendance recorded successfully',
            201
        );
    }

    public function show(Attendance $attendance): JsonResponse
    {
        $this->authorize('view', $attendance);

        return ApiResponse::success(
            new AttendanceResource($attendance->load(['student.user', 'shift.class', 'shift.teacher.user']))
        );
    }

    public function update(UpdateAttendanceRequest $request, Attendance $attendance): JsonResponse
    {
        $this->authorize('update', $attendance);

        return ApiResponse::success(
            new AttendanceResource($this->service->update($attendance, $request->validated())),
            'Attendance updated successfully'
        );
    }

    public function destroy(Attendance $attendance): JsonResponse
    {
        $this->authorize('delete', $attendance);

        $this->service->delete($attendance);

        return ApiResponse::success(null, 'Attendance deleted successfully');
    }
}