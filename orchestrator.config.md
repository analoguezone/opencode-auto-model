---
# OpenCode Orchestrator Configuration V2.1
# Context-Aware Multi-Dimensional Selection
# Incorporates: plan-awareness, context-size, subtask detection, per-level fallbacks

enabled: true
logLevel: normal
defaultModel: anthropic/claude-sonnet-4-5-20250929

# Agent activation
activeAgents:
  - auto-optimized
  - auto-performance

# Agent-to-Strategy mapping
agentStrategies:
  auto-optimized: cost-optimized
  auto-performance: performance-optimized

# ============================================================================
# CONTEXT-AWARE COMPLEXITY DETECTION
# ============================================================================

detection:
  useTokenCount: true
  useCodePatterns: true
  useKeywords: true
  useAIEstimation: false

  # Context-aware complexity adjustment
  contextAware:
    enabled: true

    # If detailed plan exists, reduce complexity by 1 level
    # Example: complex → medium, medium → simple
    planAwareness:
      enabled: true
      planIndicators:
        - "step 1"
        - "step 2"
        - "phase 1"
        - "## plan"
        - "### step"
        - "- [ ]"  # Todo list
        - "1."     # Numbered list
      minStepsForReduction: 3  # Need at least 3 steps to count as "detailed plan"

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

    # Context size affects complexity level
    # Less context = simpler task (reduce)
    # More context = more complex task (raise)
    contextSize:
      enabled: true
      # < 50K tokens: reduce complexity by 1 level
      # Task is simpler with less context needed
      smallContextThreshold: 50000
      # > 100K tokens: raise complexity by 1 level
      # Large context indicates complex, multi-faceted task
      largeContextThreshold: 100000
      # Between 50-100K: normal (no adjustment)

# ============================================================================
# STRATEGY-BASED MODEL SELECTION
# Models can be string or array (fallback chain)
# ============================================================================

strategies:
  # --------------------------------------------------------------------------
  # COST-OPTIMIZED STRATEGY
  # --------------------------------------------------------------------------
  cost-optimized:
    # Simple coding: basic fixes, simple features
    coding-simple:
      simple: zai-coding-plan/glm-4.6
      medium: zai-coding-plan/glm-4.6
      complex:
        - anthropic/claude-sonnet-4-5-20250929
        - zai-coding-plan/glm-4.6
      advanced:
        - openai/gpt-5-codex-high
        - anthropic/claude-sonnet-4-5-20250929
        - zai-coding-plan/glm-4.6

    # Complex coding: architectural, critical, performance
    coding-complex:
      simple: zai-coding-plan/glm-4.6
      medium:
        - anthropic/claude-haiku-4-20250514
        - zai-coding-plan/glm-4.6
      complex:
        - anthropic/claude-sonnet-4-5-20250929
        - anthropic/claude-haiku-4-20250514
      advanced:
        - anthropic/claude-sonnet-4-5-20250929
        - openai/gpt-5-codex-high

    # Planning: design, architecture, strategy
    planning:
      simple: zai-coding-plan/glm-4.6
      medium: zai-coding-plan/glm-4.6
      complex:
        - openai/gpt-5-codex-high
        - anthropic/claude-sonnet-4-5-20250929
      advanced:
        - openai/gpt-5-codex-high
        - anthropic/claude-sonnet-4-5-20250929

    # Debugging: error analysis, troubleshooting
    debugging:
      simple: zai-coding-plan/glm-4.6
      medium:
        - anthropic/claude-haiku-4-20250514
        - zai-coding-plan/glm-4.6
      complex:
        - anthropic/claude-sonnet-4-5-20250929
        - anthropic/claude-haiku-4-20250514
      advanced:
        - anthropic/claude-sonnet-4-5-20250929

    # Code review: quality checks, best practices
    review:
      simple: zai-coding-plan/glm-4.6
      medium:
        - anthropic/claude-haiku-4-20250514
        - zai-coding-plan/glm-4.6
      complex:
        - anthropic/claude-sonnet-4-5-20250929
        - anthropic/claude-haiku-4-20250514
      advanced:
        - anthropic/claude-sonnet-4-5-20250929

    # Documentation: comments, README, guides
    documentation:
      simple: zai-coding-plan/glm-4.6
      medium: zai-coding-plan/glm-4.6
      complex: zai-coding-plan/glm-4.6
      advanced:
        - anthropic/claude-haiku-4-20250514
        - zai-coding-plan/glm-4.6

    # General: questions, explanations
    general:
      simple: zai-coding-plan/glm-4.6
      medium: zai-coding-plan/glm-4.6
      complex:
        - anthropic/claude-haiku-4-20250514
        - zai-coding-plan/glm-4.6
      advanced:
        - anthropic/claude-sonnet-4-5-20250929
        - anthropic/claude-haiku-4-20250514

  # --------------------------------------------------------------------------
  # PERFORMANCE-OPTIMIZED STRATEGY
  # --------------------------------------------------------------------------
  performance-optimized:
    coding-simple:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-haiku-4-20250514
      complex:
        - anthropic/claude-sonnet-4-5-20250929
        - anthropic/claude-haiku-4-20250514
      advanced:
        - anthropic/claude-sonnet-4-5-20250929

    coding-complex:
      simple: anthropic/claude-haiku-4-20250514
      medium:
        - anthropic/claude-sonnet-4-5-20250929
        - anthropic/claude-haiku-4-20250514
      complex:
        - anthropic/claude-sonnet-4-5-20250929
      advanced:
        - anthropic/claude-sonnet-4-5-20250929
        - openai/o1

    planning:
      simple: anthropic/claude-haiku-4-20250514
      medium:
        - anthropic/claude-sonnet-4-5-20250929
        - anthropic/claude-haiku-4-20250514
      complex:
        - openai/o1
        - anthropic/claude-sonnet-4-5-20250929
      advanced:
        - openai/o1
        - anthropic/claude-sonnet-4-5-20250929

    debugging:
      simple: anthropic/claude-haiku-4-20250514
      medium:
        - anthropic/claude-sonnet-4-5-20250929
        - anthropic/claude-haiku-4-20250514
      complex:
        - anthropic/claude-sonnet-4-5-20250929
      advanced:
        - anthropic/claude-sonnet-4-5-20250929

    review:
      simple: anthropic/claude-haiku-4-20250514
      medium:
        - anthropic/claude-sonnet-4-5-20250929
        - anthropic/claude-haiku-4-20250514
      complex:
        - anthropic/claude-sonnet-4-5-20250929
      advanced:
        - anthropic/claude-sonnet-4-5-20250929

    documentation:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-haiku-4-20250514
      complex:
        - anthropic/claude-sonnet-4-5-20250929
        - anthropic/claude-haiku-4-20250514
      advanced:
        - anthropic/claude-sonnet-4-5-20250929

    general:
      simple: anthropic/claude-haiku-4-20250514
      medium:
        - anthropic/claude-sonnet-4-5-20250929
        - anthropic/claude-haiku-4-20250514
      complex:
        - anthropic/claude-sonnet-4-5-20250929
      advanced:
        - anthropic/claude-sonnet-4-5-20250929

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
    patterns:
      - "\\bimplement\\b.*\\b(step|task|from plan)\\b"
      - "\\b(simple|basic|straightforward)\\b.*\\b(fix|feature|implementation)\\b"

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
    patterns:
      - "\\b(architect|design)\\b.*\\b(system|solution)\\b"
      - "\\b(critical|complex|advanced)\\b.*\\b(implementation|feature)\\b"

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
    patterns:
      - "\\bplan\\b.*\\b(out|for|how)\\b"
      - "\\bdesign\\b.*\\b(approach|architecture)\\b"

  # Debugging
  debugging:
    keywords:
      - "debug"
      - "fix bug"
      - "error"
      - "not working"
      - "broken"
    patterns:
      - "\\b(fix|debug)\\b.*\\b(bug|error)\\b"

  # Code review
  review:
    keywords:
      - "review"
      - "check code"
      - "analyze"
      - "evaluate"
    patterns:
      - "\\breview\\b.*\\bcode\\b"

  # Documentation
  documentation:
    keywords:
      - "document"
      - "explain"
      - "readme"
      - "guide"
      - "comment"
    patterns:
      - "\\b(add|write)\\b.*\\b(documentation|comments)\\b"

  # General fallback
  general:
    keywords:
      - "what"
      - "how"
      - "why"
      - "show"
    patterns:
      - "^(what|how|why)\\b"

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
    patterns:
      - "^(what|where|when)\\s"
    tokenRange:
      min: 0
      max: 250
    fileCount:
      max: 1

  medium:
    keywords:
      - "implement"
      - "create"
      - "add"
      - "update"
      - "modify"
    patterns:
      - "\\b(implement|create|add)\\b"
    tokenRange:
      min: 250
      max: 600
    fileCount:
      min: 1
      max: 5

  complex:
    keywords:
      - "refactor"
      - "migrate"
      - "integrate"
      - "system-wide"
    patterns:
      - "\\b(refactor|migrate)\\b.*\\b(system|entire)\\b"
    tokenRange:
      min: 600
      max: 1800
    fileCount:
      min: 5
      max: 15

  advanced:
    keywords:
      - "complete rewrite"
      - "from scratch"
      - "entire codebase"
      - "microservices"
    patterns:
      - "\\b(complete|entire)\\b.*\\b(rewrite|redesign)\\b"
    tokenRange:
      min: 1800
      max: 999999
    fileCount:
      min: 15
      max: 999999

# ============================================================================
# FILE PATTERN OVERRIDES
# ============================================================================

filePatternOverrides:
  - pattern: "**/*.sql"
    model: anthropic/claude-sonnet-4-5-20250929
    reason: "Database queries are critical"

  - pattern: "**/migrations/**"
    model: anthropic/claude-sonnet-4-5-20250929
    reason: "Migrations are critical"

  - pattern: "**/security/**"
    model: anthropic/claude-sonnet-4-5-20250929
    reason: "Security code requires premium model"

  - pattern: "**/*.test.*"
    taskTypeOverride: coding-simple
    reason: "Tests are straightforward coding"

  - pattern: "**/*.md"
    taskTypeOverride: documentation

---

# V2.1 Configuration Explanation

## Key Changes from V2

### 1. Per-Level Fallback Arrays

Instead of global fallback, each complexity level can have its own fallback chain:

```yaml
# Simple/medium: single model (no fallback needed)
simple: zai-coding-plan/glm-4.6
medium: zai-coding-plan/glm-4.6

# Complex: try Sonnet, fallback to GLM
complex:
  - anthropic/claude-sonnet-4-5-20250929
  - zai-coding-plan/glm-4.6

# Advanced: try best model, fallback through tiers
advanced:
  - openai/gpt-5-codex-high
  - anthropic/claude-sonnet-4-5-20250929
  - zai-coding-plan/glm-4.6
```

### 2. Context-Size Logic (Corrected)

```yaml
contextSize:
  # < 50K tokens: REDUCE complexity by 1 level
  # Less context = simpler, more focused task
  smallContextThreshold: 50000

  # > 100K tokens: RAISE complexity by 1 level
  # More context = complex, multi-faceted task
  largeContextThreshold: 100000

  # 50K-100K: Normal (no adjustment)
```

**Examples:**

```
Scenario 1: Small context
  Context: 20K tokens
  Prompt: "Refactor auth system"
  Base complexity: complex
  Adjustment: < 50K → reduce by 1
  Final: medium
  Model: glm-4.6 (can handle with focused context)

Scenario 2: Normal context
  Context: 70K tokens
  Prompt: "Implement user auth"
  Base complexity: medium
  Adjustment: 50-100K → no change
  Final: medium
  Model: glm-4.6

Scenario 3: Large context
  Context: 120K tokens
  Prompt: "Add email feature"
  Base complexity: medium
  Adjustment: > 100K → raise by 1
  Final: complex
  Model: Sonnet (needs more capable model for large context)
```

### 3. Removed Cost Optimization

Removed the `costOptimization` section because:
- Can't actually measure cost without API integration
- Max cost per request is theoretical
- Better to rely on strategy-based selection

### 4. Model Naming

Using your actual model names:
- `zai-coding-plan/glm-4.6` (not `zhipu/glm-4-flash`)
- `openai/gpt-5-codex-high` (your planning model)
- `anthropic/claude-sonnet-4-5-20250929`
- `openai/o1` (GPT-5 high reasoning)

## How Fallbacks Work

When primary model fails or is unavailable:

```yaml
complex:
  - anthropic/claude-sonnet-4-5-20250929  # Try first
  - zai-coding-plan/glm-4.6               # Fallback if Sonnet fails
```

**Flow:**
1. Try `claude-sonnet-4-5`
2. If fails (API error, rate limit, unavailable):
   - Try next in array: `glm-4.6`
3. If all fail:
   - Use `defaultModel`

## Your Workflow Example

```
Phase 1: Planning (auto-performance)
  Prompt: "Plan Kimeno migration"
  Context: 0 tokens
  Task: planning
  Complexity: complex
  Context adjustment: < 50K → reduce to medium
  Model: claude-sonnet-4-5 (performance mode, planning medium)

Phase 2: Implementation (auto-optimized)
  Prompt: "Implement step 1 from plan"
  Context: 50K tokens
  Task: coding-simple (detected "step 1 from plan")
  Base complexity: medium
  Adjustments:
    - Plan detected: medium → simple
    - Context 50K: no adjustment (in normal range)
    - Subtask detected: already simple
  Final: simple
  Model: zai-coding-plan/glm-4.6
  Cost: FREE ✓
```

## Strategy Summary

### Cost-Optimized (auto-optimized)
- **Simple/Medium**: GLM (free)
- **Complex**: Sonnet → GLM fallback
- **Advanced**: GPT-5 codex → Sonnet → GLM
- **Planning complex**: GPT-5 codex → Sonnet

### Performance-Optimized (auto-performance)
- **Simple**: Haiku (fast)
- **Medium**: Sonnet → Haiku fallback
- **Complex**: Sonnet
- **Advanced/Planning**: o1 → Sonnet
