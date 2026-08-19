<?php

namespace App\Http\Controllers;

use App\Http\ApiResponse;
use App\Http\Requests\ExamResult\BulkStoreExamResultRequest;
use App\Http\Requests\ExamResult\StoreExamResultRequest;
use App\Http\Requests\ExamResult\UpdateExamResultRequest;
use App\Http\Resources\ExamResultResource;
use App\Models\ExamResult;
use App\Services\ExamResultService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamResultController extends Controller
{
    public function __construct(private readonly ExamResultService $service) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ExamResult::class);

        return ApiResponse::paginated(
            $this->service->paginate(
                (int) $request->query('per_page', 15),
                $request->query('exam_id'),
                $request->query('student_id')
            ),
            ExamResultResource::class
        );
    }

    public function store(StoreExamResultRequest $request): JsonResponse
    {
        $this->authorize('create', ExamResult::class);

        return ApiResponse::success(
            new ExamResultResource($this->service->create($request->validated())),
            'Exam result recorded successfully',
            201
        );
    }

    public function bulkStore(BulkStoreExamResultRequest $request): JsonResponse
    {
        $this->authorize('create', ExamResult::class);

        $records = $this->service->bulkCreate($request->validated());

        return ApiResponse::success(
            ExamResultResource::collection($records),
            'Exam results recorded successfully',
            201
        );
    }

    public function show(ExamResult $result): JsonResponse
    {
        $this->authorize('view', $result);

        return ApiResponse::success(
            new ExamResultResource($result->load(['exam.gradeLevel', 'student.user']))
        );
    }

    public function update(UpdateExamResultRequest $request, ExamResult $result): JsonResponse
    {
        $this->authorize('update', $result);

        return ApiResponse::success(
            new ExamResultResource($this->service->update($result, $request->validated())),
            'Exam result updated successfully'
        );
    }

    public function destroy(ExamResult $result): JsonResponse
    {
        $this->authorize('delete', $result);

        $this->service->delete($result);

        return ApiResponse::success(null, 'Exam result deleted successfully');
    }
}