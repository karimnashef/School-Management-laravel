<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class RateLimitServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->ip())
                ->response(fn () => response()->json([
                    'success' => false,
                    'message' => 'Too many login attempts. Please try again later.',
                ], 429));
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(3)
                ->by($request->ip())
                ->response(fn () => response()->json([
                    'success' => false,
                    'message' => 'Too many registration attempts. Please try again later.',
                ], 429));
        });

        RateLimiter::for('password', function (Request $request) {
            return Limit::perHour(3)
                ->by($request->ip())
                ->response(fn () => response()->json([
                    'success' => false,
                    'message' => 'Too many password reset requests. Please try again later.',
                ], 429));
        });

        RateLimiter::for('api', function (Request $request) {
            $user = $request->user();

            return $user !== null
                ? Limit::perMinute(120)->by($user->getAuthIdentifier())
                : Limit::perMinute(60)->by($request->ip());
        });

        RateLimiter::for('bulk', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->user()?->getAuthIdentifier() ?? $request->ip());
        });

        RateLimiter::for('sensitive', function (Request $request) {
            return Limit::perHour(10)
                ->by($request->user()?->getAuthIdentifier() ?? $request->ip());
        });
    }
}