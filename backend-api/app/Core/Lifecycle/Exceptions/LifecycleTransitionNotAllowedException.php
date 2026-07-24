<?php

namespace App\Core\Lifecycle\Exceptions;

class LifecycleTransitionNotAllowedException extends LifecycleException
{
    protected string $transitionCode;
    protected string $currentState;

    public function __construct(string $message, string $transitionCode, string $currentState, ?\Throwable $previous = null)
    {
        parent::__construct($message, 409, null, $previous);
        $this->transitionCode = $transitionCode;
        $this->currentState = $currentState;
    }

    public function getTransitionCode(): string
    {
        return $this->transitionCode;
    }

    public function getCurrentState(): string
    {
        return $this->currentState;
    }
}
