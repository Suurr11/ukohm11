<?php

return [
    // pastikan menggunakan wildcard untuk endpoint API agar preflight OPTIONS diterima
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'auth/*'],

    'allowed_methods' => ['*'],

    // tambahkan origin yang sesuai dengan frontend dev server
    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://localhost:3001', // opsional: tambahkan bila diperlukan
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['*'],

    'max_age' => 0,

    // bila kamu menggunakan cookie-based auth (sanctum CSRF), biarkan true
    'supports_credentials' => true,
];