<?php

namespace App\Http\Controllers;

use App\Http\ApiResponse;
use App\Http\Requests\AcademicYear\StoreAcademicYearRequest;
use App\Http\Requests\AcademicYear\UpdateAcademicYearRequest;
use App\Http\Resources\AcademicYearResource;
use App\Models\AcademicYear;
use App\Services\AcademicYearService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicYearController extends Controller
{
    public function __construct(private readonly AcademicYearService $service) {}

    public function index(Request $request): JsonResponse
    {
        return ApiResponse::paginated(
            $this->service->paginate((int) $request->query('per_page', 15))
        );
    }

    public function store(StoreAcademicYearRequest $request): JsonResponse
    {
        return ApiResponse::success(
            new AcademicYearResource($this->service->create($request->validated())),
            'Academic year created successfully',
            201
        );
    }

    public function show(AcademicYear $academicYear): JsonResponse
    {
        return ApiResponse::success(new AcademicYearResource($academicYear));
    }

    public function update(UpdateAcademicYearRequest $request, AcademicYear $academicYear): JsonResponse
    {
        return ApiResponse::success(
            new AcademicYearResource($this->service->update($academicYear, $request->validated())),
            'Academic year updated successfully'
        );
    }

    public function destroy(AcademicYear $academicYear): JsonResponse
    {
        $this->service->delete($academicYear);

        return ApiResponse::success(null, 'Academic year deleted successfully');
    }

    public function setCurrent(AcademicYear $academicYear): JsonResponse
    {
        return ApiResponse::success(
            new AcademicYearResource($this->service->setCurrent($academicYear)),
            'Academic year set as current successfully'
        );
    }
}