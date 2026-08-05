<?php

declare(strict_types=1);

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;
use Stringable;

/**
 * Package-stage agent powered by the Laravel AI SDK (xAI / Lab::xAI).
 *
 * Max tokens and temperature are provided via methods so each production stage
 * can use its AgentProfile settings without separate agent classes.
 */
#[Provider(Lab::xAI)]
#[Timeout(180)]
final class ProductionStageAgent implements Agent
{
    use Promptable;

    public function __construct(
        private readonly string $systemInstructions,
        private readonly ?int $maxTokens = null,
        private readonly ?float $temperature = null,
    ) {}

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        return $this->systemInstructions;
    }

    /**
     * Max completion tokens for this stage (resolved by TextGenerationOptions).
     */
    public function maxTokens(): ?int
    {
        return $this->maxTokens;
    }

    /**
     * Sampling temperature for this stage.
     */
    public function temperature(): ?float
    {
        return $this->temperature;
    }
}
