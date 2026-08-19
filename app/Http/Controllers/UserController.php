<?php

namespace App\Http\Controllers;

use App\Http\ApiResponse;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(private readonly UserService $service) {}

    public function index(Request $request): JsonResponse
    {
        return ApiResponse::paginated(
            $this->service->paginate((int) $request->query('per_page', 15))
        );
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        return ApiResponse::success(
            new UserResource($this->service->create($request->validated())),
            'User created successfully',
            201
        );
    }

    public function show(User $user): JsonResponse
    {
        return ApiResponse::success(new UserResource($user->load(['student', 'teacher'])));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        return ApiResponse::success(
            new UserResource($this->service->update($user, $request->validated())),
            'User updated successfully'
        );
    }

    public function destroy(User $user): JsonResponse
    {
        $this->service->delete($user);

        return ApiResponse::success(null, 'User deleted successfully');
    }
}