<?php

namespace App\Http\Controllers;

use App\Http\ApiResponse;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $service) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->service->login($request->validated());

        return ApiResponse::success([
            'token' => $result['token'],
            'user' => new UserResource($result['user']->load(['student', 'teacher'])),
        ], 'Login successful');
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->service->register($request->validated());

        return ApiResponse::success(new UserResource($user), 'Account created successfully', 201);
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success(new UserResource($request->user()->load(['student', 'teacher'])));
    }

    public function logout(Request $request): JsonResponse
    {
        $this->service->logout($request->user(), $request->input('token_id'));

        return ApiResponse::success(null, 'Logged out successfully');
    }
}