<?php

namespace App\Core\Lifecycle\Definitions;

use App\Core\Lifecycle\Contracts\LifecycleDefinitionInterface;
use App\Core\Lifecycle\Contracts\LifecycleStateInterface;
use App\Core\Lifecycle\Contracts\LifecycleTransitionInterface;

class LifecycleDefinition implements LifecycleDefinitionInterface
{
    protected string $code;
    protected string $name;
    protected string $version;
    /** @var array<string, LifecycleStateInterface> */
    protected array $states = [];
    /** @var array<string, LifecycleTransitionInterface> */
    protected array $transitions = [];
    protected string $initialState;
    protected array $terminalStates = [];

    public function __construct(
        string $code,
        string $name,
        string $version,
        array $states,
        array $transitions
    ) {
        $this->code = strtolower($code);
        $this->name = $name;
        $this->version = $version;

        foreach ($states as $state) {
            $stateObj = $state instanceof LifecycleStateInterface ? $state : new LifecycleState($state);
            $this->states[$stateObj->code()] = $stateObj;
            if ($stateObj->isInitial()) {
                $this->initialState = $stateObj->code();
            }
            if ($stateObj->isTerminal()) {
                $this->terminalStates[] = $stateObj->code();
            }
        }

        if (empty($this->initialState) && !empty($this->states)) {
            $first = reset($this->states);
            $this->initialState = $first->code();
        }

        foreach ($transitions as $transition) {
            $transObj = $transition instanceof LifecycleTransitionInterface ? $transition : new LifecycleTransition($transition);
            $this->transitions[$transObj->code()] = $transObj;
        }
    }

    public function code(): string { return $this->code; }
    public function name(): string { return $this->name; }
    public function version(): string { return $this->version; }
    public function states(): array { return $this->states; }
    public function transitions(): array { return $this->transitions; }
    public function initialState(): string { return $this->initialState; }
    public function terminalStates(): array { return $this->terminalStates; }

    public function state(string $code): ?LifecycleStateInterface
    {
        return $this->states[strtoupper($code)] ?? null;
    }

    public function transition(string $code): ?LifecycleTransitionInterface
    {
        return $this->transitions[strtolower($code)] ?? null;
    }

    public function availableTransitions(string $currentState): array
    {
        $currentUpper = strtoupper($currentState);
        $available = [];
        foreach ($this->transitions as $transition) {
            if ($transition->acceptsFromState($currentUpper)) {
                $available[] = $transition;
            }
        }
        return $available;
    }

    public function validateDefinition(): array
    {
        $issues = [];

        if (empty($this->states)) {
            $issues[] = "Lifecycle definition [{$this->code}] has no defined states.";
        }

        if (empty($this->initialState)) {
            $issues[] = "Lifecycle definition [{$this->code}] has no initial state defined.";
        } elseif (!isset($this->states[$this->initialState])) {
            $issues[] = "Lifecycle definition [{$this->code}] initial state [{$this->initialState}] does not exist in defined states.";
        }

        foreach ($this->transitions as $transCode => $transition) {
            foreach ($transition->fromStates() as $fromState) {
                if (!isset($this->states[$fromState])) {
                    $issues[] = "Transition [{$transCode}] references non-existent origin state [{$fromState}].";
                }
            }
            if (!isset($this->states[$transition->destinationState()])) {
                $issues[] = "Transition [{$transCode}] references non-existent destination state [{$transition->destinationState()}].";
            }
        }

        return $issues;
    }

    public function toArray(): array
    {
        return [
            'code' => $this->code,
            'name' => $this->name,
            'version' => $this->version,
            'initial_state' => $this->initialState,
            'terminal_states' => $this->terminalStates,
            'states' => array_map(fn($s) => $s->toArray(), array_values($this->states)),
            'transitions' => array_map(fn($t) => $t->toArray(), array_values($this->transitions)),
        ];
    }
}
