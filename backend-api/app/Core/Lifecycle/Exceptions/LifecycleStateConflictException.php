<?php

namespace App\Core\Lifecycle\Exceptions;

class LifecycleStateConflictException extends LifecycleException
{
    protected string $expectedState;
    protected string $currentState;

    public function __construct(string $message, string $expectedState, string $currentState, ?\Throwable $previous = null)
    {
        parent::__construct($message, 409, null, $previous);
        $this->expectedState = $expectedState;
        $this->currentState = $currentState;
    }

    public function getExpectedState(): string
    {
        return $this->expectedState;
    }

    public function getCurrentState(): string
    {
        return $this->currentState;
    }
}
