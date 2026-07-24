<?php

namespace App\Core\Lifecycle\Exceptions;

class LifecycleEntitlementException extends LifecycleException
{
    protected string $requiredEntitlement;

    public function __construct(string $message, string $requiredEntitlement, ?\Throwable $previous = null)
    {
        parent::__construct($message, 402, null, $previous);
        $this->requiredEntitlement = $requiredEntitlement;
    }

    public function getRequiredEntitlement(): string
    {
        return $this->requiredEntitlement;
    }
}
