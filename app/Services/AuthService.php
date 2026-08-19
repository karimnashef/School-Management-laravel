<?php

namespace App\Services;

use App\Enums\UserRoleEnum;
use App\Exceptions\DomainException;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    /**
     * @param  array{email: string, password: string}  $credentials
     * @return array{user: User, token: string}
     */
    public function login(array $credentials): array
    {
        $user = User::where('email', $credentials['email'])->first();

        if ($user === null || ! Hash::check($credentials['password'], $user->hashed_password)) {
            throw new DomainException('Invalid credentials.', 401);
        }

        if ($user->status !== 'active') {
            throw new DomainException('This account is not active.', 403);
        }

        $token = $user->createToken('api')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function register(array $data): User
    {
        $data['hashed_password'] = $data['password'];
        unset($data['password'], $data['password_confirmation']);

        $data['role'] = $data['role'] ?? UserRoleEnum::STUDENT;
        $data['status'] = $data['status'] ?? 'active';

        return User::create($data);
    }

    public function logout(User $user, ?string $tokenId = null): void
    {
        if ($tokenId !== null) {
            $user->tokens()->where('id', $tokenId)->delete();

            return;
        }

        $user->currentAccessToken()?->delete();
    }
}