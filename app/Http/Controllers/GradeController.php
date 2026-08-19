<?php

namespace App\Http\Controllers;

use App\Http\ApiResponse;
use App\Http\Requests\Grade\StoreGradeRequest;
use App\Http\Requests\Grade\UpdateGradeRequest;
use App\Http\Resources\GradeResource;
use App\Models\Grade;
use App\Services\GradeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    public function __construct(private readonly GradeService $service) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Grade::class);

        return ApiResponse::paginated(
            $this->service->paginate((int) $request->query('per_page', 15)),
            GradeResource::class
        );
    }

    public function store(StoreGradeRequest $request): JsonResponse
    {
        $this->authorize('create', Grade::class);

        return ApiResponse::success(
            new GradeResource($this->service->create($request->validated())),
            'Grade recorded successfully',
            201
        );
    }

    public function show(Grade $grade): JsonResponse
    {
        $this->authorize('view', $grade);

        return ApiResponse::success(
            new GradeResource($grade->load(['student.user', 'department', 'academicYear', 'gradeLevel']))
        );
    }

    public function update(UpdateGradeRequest $request, Grade $grade): JsonResponse
    {
        $this->authorize('update', $grade);

        return ApiResponse::success(
            new GradeResource($this->service->update($grade, $request->validated())),
            'Grade updated successfully'
        );
    }

    public function destroy(Grade $grade): JsonResponse
    {
        $this->authorize('delete', $grade);

        $this->service->delete($grade);

        return ApiResponse::success(null, 'Grade deleted successfully');
    }
}