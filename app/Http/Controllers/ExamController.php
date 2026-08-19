<?php

namespace App\Http\Controllers;

use App\Http\ApiResponse;
use App\Http\Requests\Exam\StoreExamRequest;
use App\Http\Requests\Exam\UpdateExamRequest;
use App\Http\Resources\ExamResource;
use App\Models\Exam;
use App\Services\ExamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    public function __construct(private readonly ExamService $service) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Exam::class);

        return ApiResponse::paginated(
            $this->service->paginate(
                (int) $request->query('per_page', 15),
                $request->query('academic_year_id')
            ),
            ExamResource::class
        );
    }

    public function store(StoreExamRequest $request): JsonResponse
    {
        $this->authorize('create', Exam::class);

        return ApiResponse::success(
            new ExamResource($this->service->create($request->validated())),
            'Exam created successfully',
            201
        );
    }

    public function show(Exam $exam): JsonResponse
    {
        $this->authorize('view', $exam);

        return ApiResponse::success(
            new ExamResource($exam->load(['gradeLevel', 'academicYear', 'department', 'class'])->loadCount('results'))
        );
    }

    public function update(UpdateExamRequest $request, Exam $exam): JsonResponse
    {
        $this->authorize('update', $exam);

        return ApiResponse::success(
            new ExamResource($this->service->update($exam, $request->validated())),
            'Exam updated successfully'
        );
    }

    public function destroy(Exam $exam): JsonResponse
    {
        $this->authorize('delete', $exam);

        $this->service->delete($exam);

        return ApiResponse::success(null, 'Exam deleted successfully');
    }

    public function publish(Exam $exam): JsonResponse
    {
        $this->authorize('publish', $exam);

        return ApiResponse::success(
            new ExamResource($this->service->publish($exam)),
            'Exam published successfully'
        );
    }
}