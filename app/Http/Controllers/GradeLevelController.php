<?php

namespace App\Http\Controllers;

use App\Http\ApiResponse;
use App\Http\Requests\GradeLevel\StoreGradeLevelRequest;
use App\Http\Requests\GradeLevel\UpdateGradeLevelRequest;
use App\Http\Resources\GradeLevelResource;
use App\Models\GradeLevel;
use App\Services\GradeLevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeLevelController extends Controller
{
    public function __construct(private readonly GradeLevelService $service) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', GradeLevel::class);

        return ApiResponse::paginated(
            $this->service->paginate((int) $request->query('per_page', 15)),
            GradeLevelResource::class
        );
    }

    public function store(StoreGradeLevelRequest $request): JsonResponse
    {
        $this->authorize('create', GradeLevel::class);

        return ApiResponse::success(
            new GradeLevelResource($this->service->create($request->validated())),
            'Grade level created successfully',
            201
        );
    }

    public function show(GradeLevel $gradeLevel): JsonResponse
    {
        $this->authorize('view', $gradeLevel);

        return ApiResponse::success(new GradeLevelResource($gradeLevel->loadCount(['classes', 'students'])));
    }

    public function update(UpdateGradeLevelRequest $request, GradeLevel $gradeLevel): JsonResponse
    {
        $this->authorize('update', $gradeLevel);

        return ApiResponse::success(
            new GradeLevelResource($this->service->update($gradeLevel, $request->validated())),
            'Grade level updated successfully'
        );
    }

    public function destroy(GradeLevel $gradeLevel): JsonResponse
    {
        $this->authorize('delete', $gradeLevel);

        $this->service->delete($gradeLevel);

        return ApiResponse::success(null, 'Grade level deleted successfully');
    }
}