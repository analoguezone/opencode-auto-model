---
# OpenCode Orchestrator Configuration V3.0
# Works with prompt.before hook!
# Respects OPTIMIZE toggle

enabled: true
logLevel: normal

# Default model (fallback if nothing matches)
defaultModel:
  providerID: anthropic
  modelID: claude-sonnet-4-5

# Agent-to-Strategy mapping
agentStrategies:
  auto-optimized: cost-optimized
  auto-performance: performance-optimized
  build: cost-optimized
  general: balanced

# ============================================================================
# CONTEXT-AWARE COMPLEXITY DETECTION
# ============================================================================

detection:
  useTokenCount: true
  useKeywords: true

  # Context-aware complexity adjustment
  contextAware:
    enabled: true

    # If detailed plan exists, reduce complexity by 1 level
    planAwareness:
      enabled: true
      planIndicators:
        - "step 1"
        - "step 2"
        - "phase 1"
        - "## plan"
        - "### step"
        - "- [ ]"
        - "1."
      minStepsForReduction: 3

    # If working on subtask from a list, reduce complexity
    subtaskDetection:
      enabled: true
      subtaskIndicators:
        - "implement step"
        - "complete task"
        - "from the plan"
        - "as planned"
        - "following the plan"
        - "next todo"
        - "checklist item"

# ============================================================================
# STRATEGY-BASED MODEL SELECTION
# Models can be string or array (fallback chain)
# ============================================================================

strategies:
  # --------------------------------------------------------------------------
  # COST-OPTIMIZED STRATEGY
  # Maximize savings with GLM 4.6 when possible
  # --------------------------------------------------------------------------
  cost-optimized:
    coding-simple:
      simple: zai-coding-plan/glm-4.6
      medium: zai-coding-plan/glm-4.6
      complex:
        - anthropic/claude-sonnet-4-5
        - zai-coding-plan/glm-4.6
      advanced:
        - openai/gpt-5-codex-high
        - anthropic/claude-sonnet-4-5
        - zai-coding-plan/glm-4.6

    coding-complex:
      simple: zai-coding-plan/glm-4.6
      medium:
        - anthropic/claude-haiku-4-5
        - zai-coding-plan/glm-4.6
      complex:
        - anthropic/claude-sonnet-4-5
        - anthropic/claude-haiku-4-5
      advanced:
        - anthropic/claude-sonnet-4-5
        - openai/gpt-5-codex-high

    planning:
      simple: zai-coding-plan/glm-4.6
      medium: zai-coding-plan/glm-4.6
      complex:
        - openai/gpt-5-codex-high
        - anthropic/claude-sonnet-4-5
      advanced:
        - openai/gpt-5-codex-high
        - anthropic/claude-sonnet-4-5

    debugging:
      simple: zai-coding-plan/glm-4.6
      medium:
        - anthropic/claude-haiku-4-5
        - zai-coding-plan/glm-4.6
      complex:
        - anthropic/claude-sonnet-4-5
        - anthropic/claude-haiku-4-5
      advanced:
        - anthropic/claude-sonnet-4-5

    review:
      simple: zai-coding-plan/glm-4.6
      medium:
        - anthropic/claude-haiku-4-5
        - zai-coding-plan/glm-4.6
      complex:
        - anthropic/claude-sonnet-4-5
        - anthropic/claude-haiku-4-5
      advanced:
        - anthropic/claude-sonnet-4-5

    documentation:
      simple: zai-coding-plan/glm-4.6
      medium: zai-coding-plan/glm-4.6
      complex: zai-coding-plan/glm-4.6
      advanced:
        - anthropic/claude-haiku-4-5
        - zai-coding-plan/glm-4.6

    general:
      simple: zai-coding-plan/glm-4.6
      medium: zai-coding-plan/glm-4.6
      complex:
        - anthropic/claude-haiku-4-5
        - zai-coding-plan/glm-4.6
      advanced:
        - anthropic/claude-sonnet-4-5
        - anthropic/claude-haiku-4-5

  # --------------------------------------------------------------------------
  # PERFORMANCE-OPTIMIZED STRATEGY
  # Maximize quality with premium models
  # --------------------------------------------------------------------------
  performance-optimized:
    coding-simple:
      simple: anthropic/claude-haiku-4-5
      medium: anthropic/claude-haiku-4-5
      complex:
        - anthropic/claude-sonnet-4-5
        - openai/gpt-5-codex-medium
        - anthropic/claude-haiku-4-5
      advanced:
        - openai/gpt-5-codex-high
        - anthropic/claude-sonnet-4-5

    coding-complex:
      simple: anthropic/claude-haiku-4-5
      medium:
        - anthropic/claude-sonnet-4-5
        - openai/gpt-5-codex-medium
        - anthropic/claude-haiku-4-5
      complex:
        - anthropic/claude-sonnet-4-5
        - openai/gpt-5-codex-high
      advanced:
        - anthropic/claude-sonnet-4-5
        - openai/gpt-5-codex-high

    planning:
      simple: anthropic/claude-haiku-4-5
      medium:
        - anthropic/claude-sonnet-4-5
        - anthropic/claude-haiku-4-5
        - openai/gpt-5-codex-medium
      complex:
        - openai/gpt-5-codex-high
        - anthropic/claude-sonnet-4-5
      advanced:
        - openai/gpt-5-codex-high
        - anthropic/claude-sonnet-4-5

    debugging:
      simple: anthropic/claude-haiku-4-5
      medium:
        - openai/gpt-5-codex-medium
        - anthropic/claude-sonnet-4-5
        - anthropic/claude-haiku-4-5
      complex:
        - openai/gpt-5-codex-high
        - anthropic/claude-sonnet-4-5
      advanced:
        - openai/gpt-5-codex-high
        - anthropic/claude-sonnet-4-5

    review:
      simple: anthropic/claude-haiku-4-5
      medium:
        - anthropic/claude-sonnet-4-5
        - anthropic/claude-haiku-4-5
      complex:
        - anthropic/claude-sonnet-4-5
      advanced:
        - anthropic/claude-sonnet-4-5

    documentation:
      simple: anthropic/claude-haiku-4-5
      medium: anthropic/claude-haiku-4-5
      complex:
        - anthropic/claude-sonnet-4-5
        - anthropic/claude-haiku-4-5
      advanced:
        - anthropic/claude-sonnet-4-5

    general:
      simple: anthropic/claude-haiku-4-5
      medium:
        - anthropic/claude-sonnet-4-5
        - anthropic/claude-haiku-4-5
      complex:
        - anthropic/claude-sonnet-4-5
      advanced:
        - anthropic/claude-sonnet-4-5

  # --------------------------------------------------------------------------
  # BALANCED STRATEGY
  # Middle ground between cost and performance
  # --------------------------------------------------------------------------
  balanced:
    coding-simple:
      simple: anthropic/claude-haiku-4-5
      medium: anthropic/claude-haiku-4-5
      complex:
        - anthropic/claude-sonnet-4-5
        - anthropic/claude-haiku-4-5
      advanced:
        - anthropic/claude-sonnet-4-5
        - openai/gpt-5-codex-high

    coding-complex:
      simple: anthropic/claude-haiku-4-5
      medium:
        - anthropic/claude-sonnet-4-5
        - anthropic/claude-haiku-4-5
      complex:
        - anthropic/claude-sonnet-4-5
        - openai/gpt-5-codex-medium
      advanced:
        - openai/gpt-5-codex-high
        - anthropic/claude-sonnet-4-5

    planning:
      simple: anthropic/claude-haiku-4-5
      medium:
        - anthropic/claude-sonnet-4-5
        - anthropic/claude-haiku-4-5
      complex:
        - openai/gpt-5-codex-medium
        - anthropic/claude-sonnet-4-5
      advanced:
        - openai/gpt-5-codex-high
        - anthropic/claude-sonnet-4-5

    debugging:
      simple: anthropic/claude-haiku-4-5
      medium:
        - anthropic/claude-sonnet-4-5
        - anthropic/claude-haiku-4-5
      complex:
        - anthropic/claude-sonnet-4-5
        - openai/gpt-5-codex-medium
      advanced:
        - openai/gpt-5-codex-high
        - anthropic/claude-sonnet-4-5

    review:
      simple: anthropic/claude-haiku-4-5
      medium:
        - anthropic/claude-sonnet-4-5
        - anthropic/claude-haiku-4-5
      complex:
        - anthropic/claude-sonnet-4-5
      advanced:
        - anthropic/claude-sonnet-4-5

    documentation:
      simple: anthropic/claude-haiku-4-5
      medium: anthropic/claude-haiku-4-5
      complex:
        - anthropic/claude-sonnet-4-5
        - anthropic/claude-haiku-4-5
      advanced:
        - anthropic/claude-sonnet-4-5

    general:
      simple: anthropic/claude-haiku-4-5
      medium:
        - anthropic/claude-haiku-4-5
      complex:
        - anthropic/claude-sonnet-4-5
        - anthropic/claude-haiku-4-5
      advanced:
        - anthropic/claude-sonnet-4-5

# ============================================================================
# TASK TYPE DETECTION
# Enhanced with simple vs complex coding distinction
# ============================================================================

taskTypeIndicators:
  # Simple coding: straightforward implementations with good plan
  coding-simple:
    keywords:
      - "implement from plan"
      - "following the design"
      - "as specified"
      - "simple fix"
      - "quick fix"
      - "straightforward"
      - "add feature"
      - "basic implementation"
      - "from the task list"
      - "next step"

  # Complex coding: architectural, critical, needs design
  coding-complex:
    keywords:
      - "architecture"
      - "design and implement"
      - "critical"
      - "performance"
      - "security"
      - "refactor system"
      - "scalability"
      - "complex feature"
      - "edge cases"
      - "robust solution"

  # Planning: high-level design, architecture
  planning:
    keywords:
      - "plan"
      - "design"
      - "architecture"
      - "strategy"
      - "approach"
      - "how should"
      - "best way"

  # Debugging
  debugging:
    keywords:
      - "debug"
      - "fix bug"
      - "error"
      - "not working"
      - "broken"

  # Code review
  review:
    keywords:
      - "review"
      - "check code"
      - "analyze"
      - "evaluate"

  # Documentation
  documentation:
    keywords:
      - "document"
      - "explain"
      - "readme"
      - "guide"
      - "comment"

  # General fallback
  general:
    keywords:
      - "what"
      - "how"
      - "why"
      - "show"

# ============================================================================
# COMPLEXITY INDICATORS
# ============================================================================

indicators:
  simple:
    keywords:
      - "what is"
      - "explain"
      - "show me"
      - "quick"
      - "simple"
    tokenRange:
      min: 0
      max: 250

  medium:
    keywords:
      - "implement"
      - "create"
      - "add"
      - "update"
      - "modify"
    tokenRange:
      min: 250
      max: 600

  complex:
    keywords:
      - "refactor"
      - "migrate"
      - "integrate"
      - "system-wide"
    tokenRange:
      min: 600
      max: 1800

  advanced:
    keywords:
      - "complete rewrite"
      - "from scratch"
      - "entire codebase"
      - "microservices"
    tokenRange:
      min: 1800
      max: 999999

---

# OpenCode Orchestrator V3 Configuration

## What's New in V3

- ✅ **Works with `prompt.before` hook** - Fires BEFORE LLM call
- ✅ **Respects OPTIMIZE toggle** - Only runs when user enables it
- ✅ **Your model names** - Updated with correct model identifiers
- ✅ **Your fallback chains** - Preserved exactly as you configured

## Model Names

All model names updated to match your preferences:

- `anthropic/claude-haiku-4-5` (fast, cost-effective)
- `anthropic/claude-sonnet-4-5` (balanced quality/cost)
- `openai/gpt-5-codex-medium` (good coding model)
- `openai/gpt-5-codex-high` (premium coding model)
- `zai-coding-plan/glm-4.6` (free!)

## Strategies

### cost-optimized
- Uses GLM 4.6 for simple/medium tasks (FREE)
- Sonnet for complex tasks
- GPT-5 Codex for advanced tasks
- Fallback chains prevent failures

### performance-optimized
- Haiku for simple tasks (fast)
- Sonnet for medium/complex tasks
- GPT-5 Codex for advanced tasks
- Quality-first approach

### balanced
- Haiku for simple tasks
- Sonnet for medium/complex tasks
- GPT-5 Codex for advanced tasks only
- Best of both worlds

## Fallback Chains

Your fallback strategy is preserved:

```yaml
# Single model (no fallback)
simple: anthropic/claude-haiku-4-5

# Fallback array (try in order)
complex:
  - anthropic/claude-sonnet-4-5    # Try first
  - openai/gpt-5-codex-medium      # Try second
  - anthropic/claude-haiku-4-5     # Fallback
```

The V3 plugin handles these correctly - it returns the full array and OpenCode tries each model in order if one fails.

## Usage

1. **Turn ON the OPTIMIZE toggle** in OpenCode
2. **Select an agent** that maps to a strategy
3. **Let the plugin work** - it analyzes each prompt automatically

## Example Flow

```bash
# Using auto-optimized agent (cost-optimized strategy)
opencode --agent auto-optimized

# Simple task → GLM 4.6 (free!)
> "fix typo in readme"
[Orchestrator V3] Task: documentation/simple
[Orchestrator V3] ✅ Selected: zai-coding-plan/glm-4.6

# Complex task → Sonnet with fallbacks
> "refactor auth system"
[Orchestrator V3] Task: coding-complex/complex
[Orchestrator V3] ✅ Selected: anthropic/claude-sonnet-4-5
[Orchestrator V3]    Fallbacks: anthropic/claude-haiku-4-5

# Advanced planning → GPT-5 Codex
> "design microservices architecture"
[Orchestrator V3] Task: planning/advanced
[Orchestrator V3] ✅ Selected: openai/gpt-5-codex-high
[Orchestrator V3]    Fallbacks: anthropic/claude-sonnet-4-5
```

## Agent Mapping

```yaml
agentStrategies:
  auto-optimized: cost-optimized      # Max savings
  auto-performance: performance-optimized  # Max quality
  build: cost-optimized               # Fast builds
  general: balanced                   # Default
```

Add more agents as needed!

## Toggle Control

The plugin respects the OPTIMIZE toggle:

- **OPTIMIZE: ON** (green) → Plugin selects models
- **OPTIMIZE: OFF** (gray) → Uses default model

This gives you complete control - turn it off for critical work where you want to manually select the model.
