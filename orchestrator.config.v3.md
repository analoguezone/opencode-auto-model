---
enabled: true
logLevel: normal

# Default model (fallback)
defaultModel:
  providerID: anthropic
  modelID: claude-sonnet-4-5-20250929

# Agent-to-strategy mapping
agentStrategies:
  auto-optimized: cost-optimized
  auto-performance: performance-optimized
  build: cost-optimized
  general: balanced

# Detection settings
detection:
  useTokenCount: true
  useKeywords: true
  contextAware:
    enabled: true
    planAwareness:
      enabled: true
      planIndicators:
        - "step 1"
        - "step 2"
        - "- [ ]"
        - "1."
        - "## Plan"
        - "## Implementation Plan"
      minStepsForReduction: 3
    subtaskDetection:
      enabled: true
      subtaskIndicators:
        - "implement step"
        - "from the plan"
        - "following the plan"
        - "as planned"

# --------------------------------------------------------------------------
# STRATEGIES: cost-optimized, performance-optimized, balanced
# --------------------------------------------------------------------------

strategies:
  # COST-OPTIMIZED: Maximize savings
  cost-optimized:
    coding-simple:
      simple: zai-coding-plan/glm-4.6
      medium: zai-coding-plan/glm-4.6
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: openai/gpt-5-codex-high

    coding-complex:
      simple: zai-coding-plan/glm-4.6
      medium: anthropic/claude-haiku-4-20250514
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: openai/gpt-5-codex-high

    planning:
      simple: zai-coding-plan/glm-4.6
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: openai/gpt-5-codex-high
      advanced: openai/gpt-5-codex-high

    debugging:
      simple: zai-coding-plan/glm-4.6
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: openai/gpt-5-codex-high
      advanced: openai/gpt-5-codex-high

    review:
      simple: zai-coding-plan/glm-4.6
      medium: anthropic/claude-haiku-4-20250514
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

    documentation:
      simple: zai-coding-plan/glm-4.6
      medium: zai-coding-plan/glm-4.6
      complex: anthropic/claude-haiku-4-20250514
      advanced: anthropic/claude-sonnet-4-5-20250929

    general:
      simple: zai-coding-plan/glm-4.6
      medium: zai-coding-plan/glm-4.6
      complex: anthropic/claude-haiku-4-20250514
      advanced: anthropic/claude-sonnet-4-5-20250929

  # PERFORMANCE-OPTIMIZED: Maximize quality
  performance-optimized:
    coding-simple:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: openai/gpt-5-codex-high

    coding-complex:
      simple: anthropic/claude-sonnet-4-5-20250929
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: openai/gpt-5-codex-high
      advanced: openai/gpt-5-codex-high

    planning:
      simple: anthropic/claude-sonnet-4-5-20250929
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: openai/gpt-5-codex-high
      advanced: openai/gpt-5-codex-high

    debugging:
      simple: anthropic/claude-sonnet-4-5-20250929
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: openai/gpt-5-codex-high
      advanced: openai/gpt-5-codex-high

    review:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

    documentation:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

    general:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

  # BALANCED: Middle ground
  balanced:
    coding-simple:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: openai/gpt-5-codex-high

    coding-complex:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: openai/gpt-5-codex-high

    planning:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: openai/gpt-5-codex-high

    debugging:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: openai/gpt-5-codex-high

    review:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

    documentation:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

    general:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

# --------------------------------------------------------------------------
# TASK TYPE INDICATORS
# --------------------------------------------------------------------------

taskTypeIndicators:
  coding-simple:
    keywords:
      - fix
      - update
      - add
      - change
      - typo
      - simple
      - quick
      - minor

  coding-complex:
    keywords:
      - refactor
      - architecture
      - redesign
      - migrate
      - comprehensive

  planning:
    keywords:
      - plan
      - design
      - architecture
      - strategy
      - roadmap

  debugging:
    keywords:
      - debug
      - error
      - bug
      - issue
      - problem
      - crash

  review:
    keywords:
      - review
      - check
      - audit
      - analyze
      - validate

  documentation:
    keywords:
      - document
      - readme
      - doc
      - comment
      - guide

  general:
    keywords: []

# --------------------------------------------------------------------------
# COMPLEXITY INDICATORS
# --------------------------------------------------------------------------

indicators:
  simple:
    keywords:
      - quick
      - simple
      - minor
      - small
      - typo
      - trivial
    tokenRange:
      min: 0
      max: 100

  medium:
    keywords:
      - add
      - update
      - modify
      - feature
      - enhance
    tokenRange:
      min: 100
      max: 300

  complex:
    keywords:
      - refactor
      - redesign
      - optimize
      - multiple
      - several
    tokenRange:
      min: 300
      max: 600

  advanced:
    keywords:
      - architecture
      - migrate
      - comprehensive
      - system-wide
      - entire
    tokenRange:
      min: 600
      max: 999999
---

# OpenCode Orchestrator V3 Configuration

This configuration works with the new `prompt.before` hook!

## Usage

1. **Enable optimization toggle in OpenCode**:
   - Press `Cmd+O` (or your command palette)
   - Type "toggle model"
   - Turn OPTIMIZE: ON

2. **The plugin will automatically**:
   - Detect task type (coding, planning, debugging, etc.)
   - Determine complexity (simple, medium, complex, advanced)
   - Select the optimal model from your chosen strategy
   - Log the decision to console

3. **If toggle is OFF**:
   - Plugin skips model selection
   - Uses default OpenCode model

## Example Workflow

```bash
# Turn ON optimization
# Status bar shows: "OPTIMIZE: ON"

# Simple task → GLM 4.6 (free)
> "fix typo in readme"

# Complex task → Sonnet 4.5 (quality)
> "refactor authentication to use JWT"

# Planning → GPT-5 (deep thinking)
> "design a microservices architecture for this app"

# Turn OFF optimization to use default model for everything
```

## Strategies

- **cost-optimized**: Maximize savings (GLM 4.6 for simple, Sonnet for complex)
- **performance-optimized**: Maximize quality (Sonnet/GPT-5 everywhere)
- **balanced**: Middle ground (Haiku for simple, Sonnet for complex)

Map agents to strategies in `agentStrategies` section.
