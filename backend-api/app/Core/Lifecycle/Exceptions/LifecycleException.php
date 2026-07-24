<?php

namespace App\Core\Lifecycle\Exceptions;

use App\Core\Lifecycle\Contracts\LifecycleTransitionResultInterface;

class LifecycleException extends \Exception
{
    protected ?LifecycleTransitionResultInterface $result;

    public function __construct(string $message, int $code = 422, ?LifecycleTransitionResultInterface $result = null, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->result = $result;
    }

    public function getResult(): ?LifecycleTransitionResultInterface
    {
        return $this->result;
    }
}
