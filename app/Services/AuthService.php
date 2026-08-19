<?php

namespace App\Services;

use App\Enums\UserRoleEnum;
use App\Exceptions\DomainException;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    /**
     * @param  array{email: string, password: string}  $credentials
     * @return array{user: User, token: string}
     */
    public function login(array $credentials): array
    {
        $email = strtolower($credentials['email']);
        $lockoutKey = 'auth.lockout:' . $email;

        if ($this->isLockedOut($lockoutKey)) {
            $minutes = config('security.login.lockout_minutes', 15);

            throw new DomainException("Too many failed attempts. Try again in {$minutes} minutes.", 429);
        }

        $user = User::where('email', $email)->first();

        if ($user === null || ! Hash::check($credentials['password'], $user->password)) {
            $this->registerFailedAttempt($lockoutKey);

            throw new DomainException('Invalid credentials.', 401);
        }

        if ($user->status !== 'active') {
            throw new DomainException('This account is not active.', 403);
        }

        Cache::forget($lockoutKey);

        $token = $user->createToken('api')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function register(array $data): User
    {
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

    private function isLockedOut(string $key): bool
    {
        $attempts = (int) Cache::get($key, 0);
        $maxAttempts = config('security.login.max_attempts', 5);

        return $attempts >= $maxAttempts;
    }

    private function registerFailedAttempt(string $key): void
    {
        $attempts = (int) Cache::get($key, 0) + 1;
        $minutes = config('security.login.lockout_minutes', 15);

        Cache::put($key, $attempts, now()->addMinutes($minutes));
    }
}