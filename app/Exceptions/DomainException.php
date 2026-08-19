<?php

namespace App\Exceptions;

use RuntimeException;

class DomainException extends RuntimeException
{
    /**
     * @param  array<string, mixed>|null  $errors
     */
    public function __construct(
        string $message,
        public readonly int $statusCode = 422,
        public readonly ?array $errors = null,
    ) {
        parent::__construct($message);
    }
}