---
# OpenCode Orchestrator Configuration V2.1
# Context-Aware Multi-Dimensional Selection
# Incorporates: plan-awareness, context-size, subtask detection

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

  # NEW: Context-aware complexity adjustment
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

    # Context size affects what model can handle
    # More context = can use cheaper model for same complexity
    contextSize:
      enabled: true
      # If context > 40K tokens, can downgrade model by 1 tier
      largeContextThreshold: 40000
      # If context > 80K tokens, can downgrade by 2 tiers
      veryLargeContextThreshold: 80000

# ============================================================================
# STRATEGY-BASED MODEL SELECTION
# Enhanced with finer-grained task types
# ============================================================================

strategies:
  # --------------------------------------------------------------------------
  # COST-OPTIMIZED STRATEGY
  # --------------------------------------------------------------------------
  cost-optimized:
    # Simple coding: basic fixes, simple features
    coding-simple:
      simple: zhipu/glm-4-flash
      medium: zhipu/glm-4-flash
      complex: zhipu/glm-4-flash      # GLM can handle with good plan
      advanced: anthropic/claude-haiku-4-20250514

    # Complex coding: architectural, critical, performance
    coding-complex:
      simple: zhipu/glm-4-flash
      medium: anthropic/claude-haiku-4-20250514
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

    # Planning: design, architecture, strategy
    planning:
      simple: zhipu/glm-4-flash
      medium: zhipu/glm-4-flash
      complex: openai/gpt-5           # Medium reasoning (codex)
      advanced: openai/gpt-5

    # Debugging: error analysis, troubleshooting
    debugging:
      simple: zhipu/glm-4-flash
      medium: anthropic/claude-haiku-4-20250514
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

    # Code review: quality checks, best practices
    review:
      simple: zhipu/glm-4-flash
      medium: anthropic/claude-haiku-4-20250514
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

    # Documentation: comments, README, guides
    documentation:
      simple: zhipu/glm-4-flash
      medium: zhipu/glm-4-flash
      complex: zhipu/glm-4-flash
      advanced: anthropic/claude-haiku-4-20250514

    # General: questions, explanations
    general:
      simple: zhipu/glm-4-flash
      medium: zhipu/glm-4-flash
      complex: anthropic/claude-haiku-4-20250514
      advanced: anthropic/claude-sonnet-4-5-20250929

  # --------------------------------------------------------------------------
  # PERFORMANCE-OPTIMIZED STRATEGY
  # --------------------------------------------------------------------------
  performance-optimized:
    coding-simple:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-haiku-4-20250514
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

    coding-complex:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

    planning:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: openai/o1                    # High reasoning (o1)
      advanced: openai/o1

    debugging:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

    review:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

    documentation:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-haiku-4-20250514
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

    general:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

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

# ============================================================================
# COST OPTIMIZATION
# ============================================================================

costOptimization:
  enabled: true
  allowDowngrade: true
  maxCostPerRequest: 0.50

# ============================================================================
# FALLBACK CHAIN
# ============================================================================

fallback:
  - anthropic/claude-sonnet-4-5-20250929
  - anthropic/claude-haiku-4-20250514
  - zhipu/glm-4-flash

---

# V2.1 - Context-Aware Enhancements

## What's New

### 1. Plan-Aware Complexity Reduction

If your prompt contains a detailed plan (3+ steps), complexity is reduced by 1 level:

```
Prompt: "Implement user auth following this plan:
1. Create user model
2. Add JWT middleware
3. Create login endpoint
4. Add tests"

Without plan-awareness:
  complexity: complex (architectural feature)
  model: anthropic/claude-sonnet-4-5-20250929

With plan-awareness:
  detected: detailed plan (4 steps)
  complexity: complex → medium (reduced!)
  task_type: coding-simple (has plan)
  model: zhipu/glm-4-flash (cost mode)

✓ Matches your real experience!
```

### 2. Subtask Detection

If implementing a subtask from a list, treat as simpler:

```
Prompt: "Complete task 3 from the list: Update filter component"

Detected: subtask indicator "Complete task"
complexity: medium → simple (reduced)
task_type: coding-simple
model: zhipu/glm-4-flash

✓ Perfect for your workflow!
```

### 3. Context-Size Awareness

Large context (40K+ tokens) = can use cheaper model:

```
Context: 50K tokens (like your example)
Task: Medium complexity coding
Original model: anthropic/claude-haiku-4-20250514

With context-awareness:
  context > 40K: downgrade by 1 tier
  model: zhipu/glm-4-flash

✓ This is what happened in your successful implementation!
```

### 4. Fine-Grained Task Types

Borrowed from your subagent approach:

- **coding-simple**: Basic fixes, simple features (like your `coder-simple`)
- **coding-complex**: Architectural, critical work (like your `coder-advanced`)

```yaml
taskTypeIndicators:
  coding-simple:
    keywords:
      - "implement from plan"
      - "following the design"
      - "from the task list"
      - "next step"

  coding-complex:
    keywords:
      - "architecture"
      - "design and implement"
      - "critical"
      - "security"
```

## Your Example Analyzed

### Your Scenario:
- **Planning**: GPT-5 Codex created detailed plan
- **Implementation**: GLM 4.6 successfully implemented
- **Context**: ~50K tokens
- **Complexity**: Medium (multiple files, moderate changes)

### How V2.1 Handles This:

```yaml
Step 1: User says "implement the plan"

Detected:
  - task_type: coding-simple (has "from plan" indicator)
  - base_complexity: medium (multiple files)
  - plan_detected: YES (has numbered steps)
  - context_size: 50K tokens

Adjustments:
  - Plan exists: medium → simple (reduce 1 level)
  - Large context (50K > 40K): can downgrade model tier

Final:
  - strategy: cost-optimized
  - task_type: coding-simple
  - complexity: simple (after adjustment)
  - model: zhipu/glm-4-flash

✓ Exactly what you did manually!
```

## Configuration Philosophy

Following your subagent approach:

### Cost Mode (`auto-optimized`)
- **Simple coding with plan**: GLM (even complex becomes simple with plan)
- **Complex coding without plan**: Haiku → Sonnet
- **Planning**: GLM for simple, GPT-5 for complex

### Performance Mode (`auto-performance`)
- **Simple coding**: Haiku (fast + quality)
- **Complex coding**: Sonnet (best quality)
- **Planning**: Sonnet for medium, o1 for complex

## Real-World Example

```
Scenario: "Migrate Kimeno invoice admin to unified bizonylat list"

WITHOUT V2.1:
  task_type: coding
  complexity: complex (migration, multiple files)
  model: anthropic/claude-sonnet-4-5-20250929
  cost: $$$

WITH V2.1 (after GPT-5 planning):
  Plan created by GPT-5: detailed steps
  Context: 50K tokens from planning session

  Implementation prompt: "Implement step 1 from plan: Replace data fetching"

  Detected:
    - task_type: coding-simple (has "from plan")
    - base_complexity: medium
    - plan_detected: YES
    - subtask: YES ("step 1")
    - context: 50K tokens

  Adjustments:
    - Has plan: medium → simple
    - Is subtask: no further reduction (already simple)
    - Large context: can use cheaper model

  Final:
    - complexity: simple
    - model: zhipu/glm-4-flash
    - cost: FREE

  ✓ Successfully implemented as you did!
```

## Key Benefits

1. **Plan-first workflow**: Planning with GPT-5, implementation with GLM
2. **Context leverage**: More context = cheaper models work
3. **Subtask optimization**: Break down → save money
4. **Granular task types**: Simple vs complex coding (like your subagents)

## Migration from V2

V2.1 is backward compatible but adds:
- `contextAware` section in `detection`
- `coding-simple` and `coding-complex` task types
- Plan and subtask detection

Would you like me to implement this enhanced logic in the plugin?
