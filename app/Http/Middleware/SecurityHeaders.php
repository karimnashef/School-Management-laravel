<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', config('security.headers.x_content_type_options', 'nosniff'));
        $response->headers->set('X-Frame-Options', config('security.headers.x_frame_options', 'DENY'));
        $response->headers->set('Referrer-Policy', config('security.headers.referrer_policy', 'no-referrer'));
        $response->headers->set('Permissions-Policy', config('security.headers.permissions_policy', 'camera=(), microphone=(), geolocation=()'));

        if (config('security.headers.hsts_enabled') && app()->isProduction()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        if ($request->is('api/*')) {
            $response->headers->set('Cache-Control', 'no-store, private');
        }

        return $response;
    }
}