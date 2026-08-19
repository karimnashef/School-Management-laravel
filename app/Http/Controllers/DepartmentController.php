<?php

namespace App\Http\Controllers;

use App\Http\ApiResponse;
use App\Http\Requests\Department\StoreDepartmentRequest;
use App\Http\Requests\Department\UpdateDepartmentRequest;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use App\Services\DepartmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function __construct(private readonly DepartmentService $service) {}

    public function index(Request $request): JsonResponse
    {
        return ApiResponse::paginated(
            $this->service->paginate((int) $request->query('per_page', 15))
        );
    }

    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        return ApiResponse::success(
            new DepartmentResource($this->service->create($request->validated())),
            'Department created successfully',
            201
        );
    }

    public function show(Department $department): JsonResponse
    {
        return ApiResponse::success(new DepartmentResource($department->loadCount(['teachers', 'grades'])));
    }

    public function update(UpdateDepartmentRequest $request, Department $department): JsonResponse
    {
        return ApiResponse::success(
            new DepartmentResource($this->service->update($department, $request->validated())),
            'Department updated successfully'
        );
    }

    public function destroy(Department $department): JsonResponse
    {
        $this->service->delete($department);

        return ApiResponse::success(null, 'Department deleted successfully');
    }
}