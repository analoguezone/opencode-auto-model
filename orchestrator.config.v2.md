---
# OpenCode Orchestrator Configuration V2
# Multi-dimensional model selection: Strategy × Task Type × Complexity

enabled: true
logLevel: normal
defaultModel: anthropic/claude-sonnet-4-5-20250929

# Agent activation
activeAgents:
  - auto-optimized    # Uses cost-optimized strategy
  - auto-performance  # Uses performance-optimized strategy

# Agent-to-Strategy mapping
agentStrategies:
  auto-optimized: cost-optimized
  auto-performance: performance-optimized

# Complexity detection settings
detection:
  useTokenCount: true
  useCodePatterns: true
  useKeywords: true
  useAIEstimation: false

# ============================================================================
# STRATEGY-BASED MODEL SELECTION
# Multi-dimensional: Strategy × Task Type × Complexity
# ============================================================================

strategies:
  # --------------------------------------------------------------------------
  # COST-OPTIMIZED STRATEGY
  # Minimize costs while maintaining acceptable quality
  # --------------------------------------------------------------------------
  cost-optimized:
    # Coding tasks (implementation, refactoring, bug fixes)
    coding:
      simple: zhipu/glm-4-flash           # Free tier - simple edits, questions
      medium: zhipu/glm-4-flash           # GLM is GOOD for medium coding!
      complex: anthropic/claude-sonnet-4-5-20250929   # Premium for complex
      advanced: anthropic/claude-sonnet-4-5-20250929  # Keep premium

    # Planning tasks (design, architecture, strategy)
    planning:
      simple: zhipu/glm-4-flash           # Free for simple planning
      medium: zhipu/glm-4-flash           # GLM can handle moderate planning
      complex: openai/gpt-5               # Codex/GPT-5 medium for complex reasoning
      advanced: openai/gpt-5              # Best reasoning for critical decisions

    # Debugging tasks (error analysis, troubleshooting)
    debugging:
      simple: zhipu/glm-4-flash           # Free for simple debugging
      medium: anthropic/claude-haiku-4-20250514  # Haiku for moderate debugging
      complex: anthropic/claude-sonnet-4-5-20250929  # Sonnet for complex bugs
      advanced: anthropic/claude-sonnet-4-5-20250929

    # Code review tasks (quality checks, best practices)
    review:
      simple: zhipu/glm-4-flash
      medium: anthropic/claude-haiku-4-20250514
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

    # Documentation tasks (comments, README, guides)
    documentation:
      simple: zhipu/glm-4-flash
      medium: zhipu/glm-4-flash
      complex: zhipu/glm-4-flash           # Even complex docs can use GLM
      advanced: anthropic/claude-haiku-4-20250514

    # General tasks (questions, explanations)
    general:
      simple: zhipu/glm-4-flash
      medium: zhipu/glm-4-flash
      complex: anthropic/claude-haiku-4-20250514
      advanced: anthropic/claude-sonnet-4-5-20250929

  # --------------------------------------------------------------------------
  # PERFORMANCE-OPTIMIZED STRATEGY
  # Maximize quality and speed, cost is secondary
  # --------------------------------------------------------------------------
  performance-optimized:
    # Coding tasks - prioritize quality
    coding:
      simple: anthropic/claude-haiku-4-20250514    # Haiku is FAST for simple
      medium: anthropic/claude-sonnet-4-5-20250929  # Sonnet for quality
      complex: anthropic/claude-sonnet-4-5-20250929 # Keep premium
      advanced: anthropic/claude-sonnet-4-5-20250929  # Best for critical code

    # Planning tasks - use reasoning models
    planning:
      simple: anthropic/claude-haiku-4-20250514     # Fast for simple
      medium: anthropic/claude-sonnet-4-5-20250929  # Quality for planning
      complex: openai/o1                            # GPT-5 HIGH reasoning
      advanced: openai/o1                           # Best reasoning available

    # Debugging tasks - prioritize accuracy
    debugging:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

    # Code review - thorough analysis
    review:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

    # Documentation - quality writing
    documentation:
      simple: anthropic/claude-haiku-4-20250514     # Fast, good quality
      medium: anthropic/claude-haiku-4-20250514
      complex: anthropic/claude-sonnet-4-5-20250929 # Better writing
      advanced: anthropic/claude-sonnet-4-5-20250929

    # General tasks
    general:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

  # --------------------------------------------------------------------------
  # BALANCED STRATEGY (Optional)
  # Balance between cost and quality
  # --------------------------------------------------------------------------
  balanced:
    coding:
      simple: zhipu/glm-4-flash
      medium: anthropic/claude-haiku-4-20250514
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929
    planning:
      simple: zhipu/glm-4-flash
      medium: anthropic/claude-haiku-4-20250514
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: openai/gpt-5
    debugging:
      simple: zhipu/glm-4-flash
      medium: anthropic/claude-haiku-4-20250514
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929
    review:
      simple: zhipu/glm-4-flash
      medium: anthropic/claude-haiku-4-20250514
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929
    documentation:
      simple: zhipu/glm-4-flash
      medium: zhipu/glm-4-flash
      complex: anthropic/claude-haiku-4-20250514
      advanced: anthropic/claude-haiku-4-20250514
    general:
      simple: zhipu/glm-4-flash
      medium: anthropic/claude-haiku-4-20250514
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: anthropic/claude-sonnet-4-5-20250929

# ============================================================================
# TASK TYPE DETECTION
# Keywords that identify task types
# ============================================================================

taskTypeIndicators:
  planning:
    keywords:
      - "plan"
      - "design"
      - "architecture"
      - "strategy"
      - "approach"
      - "how should"
      - "best way"
      - "suggest"
      - "recommend"
    patterns:
      - "\\bplan\\b.*\\b(out|for|how)\\b"
      - "\\bdesign\\b.*\\b(approach|strategy|architecture)\\b"

  coding:
    keywords:
      - "implement"
      - "create"
      - "add"
      - "write code"
      - "function"
      - "class"
      - "component"
      - "feature"
      - "refactor"
      - "optimize"
    patterns:
      - "\\b(implement|create|add|write)\\b.*\\b(function|class|component|feature)\\b"
      - "\\brefactor\\b"

  debugging:
    keywords:
      - "debug"
      - "fix"
      - "error"
      - "bug"
      - "issue"
      - "problem"
      - "not working"
      - "broken"
      - "fails"
    patterns:
      - "\\b(fix|debug)\\b.*\\b(bug|error|issue)\\b"
      - "\\b(not working|broken|fails)\\b"

  review:
    keywords:
      - "review"
      - "check"
      - "analyze"
      - "evaluate"
      - "assess"
      - "audit"
    patterns:
      - "\\breview\\b.*\\bcode\\b"
      - "\\bcheck\\b.*\\b(for|if)\\b"

  documentation:
    keywords:
      - "document"
      - "explain"
      - "describe"
      - "comment"
      - "readme"
      - "guide"
      - "tutorial"
    patterns:
      - "\\b(add|write)\\b.*\\b(documentation|comments|readme)\\b"
      - "\\bexplain\\b.*\\bhow\\b"

  general:
    # Fallback - anything that doesn't match above
    keywords:
      - "what"
      - "how"
      - "why"
      - "show"
      - "list"
      - "find"
    patterns:
      - "^(what|how|why|where|when)\\b"

# ============================================================================
# COMPLEXITY INDICATORS
# (Keep existing complexity detection)
# ============================================================================

indicators:
  simple:
    keywords:
      - "what is"
      - "explain"
      - "show me"
      - "list"
      - "find"
      - "typo"
      - "rename"
    patterns:
      - "^(what|where|when|who|why)\\s"
    tokenRange:
      min: 0
      max: 250
    fileCount:
      max: 1

  medium:
    keywords:
      - "implement"
      - "create"
      - "add feature"
      - "refactor"
      - "fix bug"
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
      - "design"
      - "architecture"
      - "migrate"
      - "integrate"
      - "system"
    patterns:
      - "\\b(design|architect|migrate)\\b.*\\b(system|application)\\b"
    tokenRange:
      min: 600
      max: 1800
    fileCount:
      min: 5
      max: 15

  advanced:
    keywords:
      - "full system"
      - "complete rewrite"
      - "microservices"
      - "from scratch"
    patterns:
      - "\\b(complete|entire|full)\\b.*\\b(rewrite|redesign)\\b"
    tokenRange:
      min: 1800
      max: 999999
    fileCount:
      min: 15
      max: 999999

# ============================================================================
# FILE PATTERN OVERRIDES
# Always use specific models for critical files
# ============================================================================

filePatternOverrides:
  - pattern: "**/*.sql"
    model: anthropic/claude-sonnet-4-5-20250929
    reason: "Database queries require careful attention"

  - pattern: "**/migrations/**"
    model: anthropic/claude-sonnet-4-5-20250929
    reason: "Database migrations are critical"

  - pattern: "**/security/**"
    model: anthropic/claude-sonnet-4-5-20250929
    reason: "Security code needs thorough review"

  - pattern: "**/auth/**"
    model: anthropic/claude-sonnet-4-5-20250929
    reason: "Authentication is critical"

  - pattern: "**/*.test.*"
    taskTypeOverride: coding  # Tests are coding tasks
    # Let strategy decide the model

  - pattern: "**/*.md"
    taskTypeOverride: documentation
    # Let strategy decide (cost mode: GLM, performance mode: Haiku)

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
  - openai/gpt-4o-mini

---

# Configuration V2 Explanation

## How It Works

### Multi-Dimensional Selection

1. **Detect Agent** → Determine Strategy
   - `auto-optimized` → `cost-optimized` strategy
   - `auto-performance` → `performance-optimized` strategy

2. **Analyze Prompt** → Determine Task Type
   - Keywords/patterns identify: coding, planning, debugging, review, docs, general

3. **Calculate Complexity** → Determine Complexity Level
   - simple, medium, complex, advanced

4. **Select Model** → `strategies[strategy][taskType][complexity]`

### Example Flows

#### Cost-Optimized Agent
```
Prompt: "Implement user authentication"
→ Agent: auto-optimized
→ Strategy: cost-optimized
→ Task Type: coding (keyword: "implement")
→ Complexity: medium (token count, keywords)
→ Model: zhipu/glm-4-flash (cost-optimized.coding.medium)
```

```
Prompt: "Design a scalable microservices architecture"
→ Agent: auto-optimized
→ Strategy: cost-optimized
→ Task Type: planning (keywords: "design", "architecture")
→ Complexity: complex (keywords: "scalable", "microservices")
→ Model: openai/gpt-5 (cost-optimized.planning.complex)
```

#### Performance-Optimized Agent
```
Prompt: "Implement user authentication"
→ Agent: auto-performance
→ Strategy: performance-optimized
→ Task Type: coding
→ Complexity: medium
→ Model: anthropic/claude-sonnet-4-5-20250929 (performance.coding.medium)
```

```
Prompt: "Design a scalable microservices architecture"
→ Agent: auto-performance
→ Strategy: performance-optimized
→ Task Type: planning
→ Complexity: complex
→ Model: openai/o1 (performance.planning.complex) - GPT-5 HIGH reasoning
```

## Key Differences

### GLM 4.6 Usage

- **Cost mode**: Used for simple AND medium coding (it's good enough!)
- **Cost mode**: Used for simple AND medium planning
- **Performance mode**: NOT used for coding (Haiku/Sonnet preferred for quality)
- **Performance mode**: NOT used for planning (Haiku/Sonnet/o1 preferred)

### GPT-5 Usage

- **Cost mode planning complex**: GPT-5 (medium reasoning effort)
- **Performance mode planning complex**: o1 (high reasoning effort)

### Haiku Usage

- **Cost mode**: Used sparingly (medium debugging, review)
- **Performance mode**: Used extensively (simple tasks for speed + quality)

## Customization

Customize any cell in the matrix:

```yaml
strategies:
  cost-optimized:
    coding:
      medium: your-preferred-model  # Override just this cell
```

Or add custom strategies:

```yaml
strategies:
  my-custom-strategy:
    coding:
      simple: model-a
      medium: model-b
      ...
```

Then map it to an agent:

```yaml
agentStrategies:
  my-custom-agent: my-custom-strategy
```
