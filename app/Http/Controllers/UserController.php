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
        $this->authorize('viewAny', User::class);

        return ApiResponse::paginated(
            $this->service->paginate((int) $request->query('per_page', 15)),
            UserResource::class
        );
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        return ApiResponse::success(
            new UserResource($this->service->create($request->validated())),
            'User created successfully',
            201
        );
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return ApiResponse::success(new UserResource($user->load(['student', 'teacher'])));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        return ApiResponse::success(
            new UserResource($this->service->update($user, $request->validated())),
            'User updated successfully'
        );
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $this->service->delete($user);

        return ApiResponse::success(null, 'User deleted successfully');
    }
}