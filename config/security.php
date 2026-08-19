<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Security Headers
    |--------------------------------------------------------------------------
    |
    | X-Content-Type-Options: nosniff  - prevents MIME-sniffing attacks on
    |   uploaded/attached content.
    | X-Frame-Options: DENY            - blocks clickjacking of rendered views.
    | Referrer-Policy: no-referrer     - never leaks URLs/tokens via referrer.
    | Permissions-Policy               - reduces browser feature abuse.
    | HSTS (production only)           - forces HTTPS; never enabled on
    |   http://localhost because it would permanently poison the browser.
    |
    */

    'headers' => [
        'x_content_type_options' => env('SECURITY_HEADER_X_CONTENT_TYPE', 'nosniff'),
        'x_frame_options' => env('SECURITY_HEADER_X_FRAME', 'DENY'),
        'referrer_policy' => env('SECURITY_HEADER_REFERRER', 'no-referrer'),
        'permissions_policy' => env('SECURITY_HEADER_PERMISSIONS', 'camera=(), microphone=(), geolocation=()'),
        'hsts_enabled' => env('SECURITY_HSTS_ENABLED', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Login Lockout
    |--------------------------------------------------------------------------
    |
    | Progressive per-email throttling on top of the route-level limiter.
    | After N failed attempts within the window the account is temporarily
    | blocked regardless of the caller IP, protecting against credential
    | stuffing from distributed sources.
    |
    */

    'login' => [
        'max_attempts' => (int) env('LOGIN_MAX_ATTEMPTS', 5),
        'lockout_minutes' => (int) env('LOGIN_LOCKOUT_MINUTES', 15),
    ],

    /*
    |--------------------------------------------------------------------------
    | File Upload Limits (future upload endpoints)
    |--------------------------------------------------------------------------
    */

    'uploads' => [
        'max_image_mb' => (int) env('UPLOAD_MAX_IMAGE_MB', 2),
        'max_document_mb' => (int) env('UPLOAD_MAX_DOC_MB', 10),
    ],

];