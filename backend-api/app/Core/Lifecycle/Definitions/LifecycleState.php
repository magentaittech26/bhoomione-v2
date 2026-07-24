<?php

namespace App\Core\Lifecycle\Definitions;

use App\Core\Lifecycle\Contracts\LifecycleStateInterface;
use App\Core\Lifecycle\Enums\StateColorToken;

class LifecycleState implements LifecycleStateInterface
{
    protected string $code;
    protected string $name;
    protected string $description;
    protected int $sequence;
    protected bool $initial;
    protected bool $terminal;
    protected bool $active;
    protected bool $visible;
    protected bool $operational;
    protected bool $immutable;
    protected StateColorToken $colorToken;
    protected array $allowedActions;
    protected array $metadata;

    public function __construct(array $attributes)
    {
        $this->code = strtoupper($attributes['code'] ?? '');
        $this->name = $attributes['name'] ?? $this->code;
        $this->description = $attributes['description'] ?? '';
        $this->sequence = (int) ($attributes['sequence'] ?? 1);
        $this->initial = (bool) ($attributes['initial'] ?? false);
        $this->terminal = (bool) ($attributes['terminal'] ?? false);
        $this->active = (bool) ($attributes['active'] ?? true);
        $this->visible = (bool) ($attributes['visible'] ?? true);
        $this->operational = (bool) ($attributes['operational'] ?? true);
        $this->immutable = (bool) ($attributes['immutable'] ?? false);

        $color = $attributes['color_token'] ?? StateColorToken::NEUTRAL;
        $this->colorToken = $color instanceof StateColorToken
            ? $color
            : (StateColorToken::tryFrom((string)$color) ?? StateColorToken::NEUTRAL);

        $this->allowedActions = $attributes['allowed_actions'] ?? [];
        $this->metadata = $attributes['metadata'] ?? [];
    }

    public function code(): string { return $this->code; }
    public function name(): string { return $this->name; }
    public function description(): string { return $this->description; }
    public function sequence(): int { return $this->sequence; }
    public function isInitial(): bool { return $this->initial; }
    public function isTerminal(): bool { return $this->terminal; }
    public function isActive(): bool { return $this->active; }
    public function isVisible(): bool { return $this->visible; }
    public function isOperational(): bool { return $this->operational; }
    public function isImmutable(): bool { return $this->immutable; }
    public function colorToken(): StateColorToken { return $this->colorToken; }
    public function allowedActions(): array { return $this->allowedActions; }
    public function metadata(): array { return $this->metadata; }

    public function toArray(): array
    {
        return [
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'sequence' => $this->sequence,
            'initial' => $this->initial,
            'terminal' => $this->terminal,
            'active' => $this->active,
            'visible' => $this->visible,
            'operational' => $this->operational,
            'immutable' => $this->immutable,
            'color_token' => $this->colorToken->value,
            'allowed_actions' => $this->allowedActions,
            'metadata' => $this->metadata,
        ];
    }
}
