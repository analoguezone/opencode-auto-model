---
# OpenCode Orchestrator Configuration
# This file defines how the orchestrator plugin automatically selects models based on task complexity

# Enable/disable the orchestrator
enabled: true

# Logging level: silent, minimal, normal, verbose
logLevel: normal

# Default model if no complexity match is found
defaultModel: anthropic/claude-sonnet-4-5-20250929

# Complexity detection settings
detection:
  # Consider token count in complexity analysis
  useTokenCount: true
  # Consider code patterns (imports, classes, functions)
  useCodePatterns: true
  # Consider explicit keywords
  useKeywords: true
  # Use AI-based complexity estimation (requires an additional API call)
  useAIEstimation: false

# Model assignments by complexity level
models:
  # Simple tasks: documentation, simple edits, questions
  simple:
    model: openai/gpt-4o-mini
    description: Quick tasks, simple edits, basic questions
    maxTokens: 4000
    temperature: 0.3

  # Medium tasks: feature implementations, refactoring
  medium:
    model: zhipu/glm-4-flash
    description: Standard development tasks, moderate complexity
    maxTokens: 8000
    temperature: 0.5

  # Complex tasks: architecture changes, complex algorithms
  complex:
    model: anthropic/claude-sonnet-4-5-20250929
    description: Complex implementations, architecture decisions
    maxTokens: 16000
    temperature: 0.7

  # Advanced tasks: full system design, critical planning
  advanced:
    model: openai/o1
    description: System-level planning, critical decision making
    maxTokens: 32000
    temperature: 0.9

  # Planning-specific models
  planning:
    simple: zhipu/glm-4-flash
    complex: openai/o1

# Complexity indicators
# Each section defines patterns that indicate a certain complexity level

indicators:
  simple:
    # Keywords that suggest simple tasks
    keywords:
      - "explain"
      - "what is"
      - "how do i"
      - "show me"
      - "list"
      - "display"
      - "read"
      - "view"
      - "find"
      - "search"
      - "typo"
      - "fix spacing"
      - "add comment"
      - "rename variable"

    # Patterns (regex)
    patterns:
      - "^(what|where|when|who|why|how)\\s"
      - "\\bexplain\\b"
      - "\\bshow\\b.*\\bme\\b"

    # Token count range
    tokenRange:
      min: 0
      max: 200

    # File count (number of files mentioned or to be modified)
    fileCount:
      max: 1

  medium:
    keywords:
      - "implement"
      - "create function"
      - "add feature"
      - "refactor"
      - "optimize"
      - "improve"
      - "update"
      - "modify"
      - "change"
      - "fix bug"
      - "debug"
      - "test"

    patterns:
      - "\\b(implement|create|add|refactor|optimize)\\b.*\\b(function|class|component|feature)\\b"
      - "\\bfix\\b.*\\bbug\\b"
      - "\\bwrite\\b.*\\b(test|tests)\\b"

    tokenRange:
      min: 200
      max: 500

    fileCount:
      min: 1
      max: 5

  complex:
    keywords:
      - "design"
      - "architecture"
      - "migrate"
      - "rebuild"
      - "rewrite"
      - "integrate"
      - "system"
      - "database schema"
      - "api design"
      - "performance optimization"
      - "security"
      - "scalability"

    patterns:
      - "\\b(design|architect|migrate|rebuild)\\b.*\\b(system|application|service)\\b"
      - "\\bintegrate\\b.*\\bwith\\b"
      - "\\b(performance|security|scalability)\\b.*\\b(optimization|improvement)\\b"

    tokenRange:
      min: 500
      max: 1500

    fileCount:
      min: 5
      max: 15

  advanced:
    keywords:
      - "full system"
      - "complete rewrite"
      - "microservices"
      - "distributed system"
      - "end-to-end"
      - "from scratch"
      - "entire codebase"
      - "multi-service"
      - "infrastructure"

    patterns:
      - "\\b(complete|entire|full|whole)\\b.*\\b(rewrite|redesign|rebuild|migration)\\b"
      - "\\bmicroservices\\b"
      - "\\bdistributed\\b.*\\bsystem\\b"
      - "\\bfrom scratch\\b"

    tokenRange:
      min: 1500
      max: 999999

    fileCount:
      min: 15
      max: 999999

# Special task type overrides
# These override complexity detection for specific task types
taskTypes:
  planning:
    keywords:
      - "plan out"
      - "strategy"
      - "approach for"
      - "how should i"
      - "design approach"
      - "review"
      - "analyze"
      - "suggest"
    models:
      simple: zhipu/glm-4-flash
      complex: openai/o1

  codeReview:
    keywords:
      - "review"
      - "code review"
      - "check for issues"
      - "best practices"
      - "security review"
    models:
      default: anthropic/claude-sonnet-4-5-20250929

  debugging:
    keywords:
      - "debug"
      - "why is"
      - "error"
      - "not working"
      - "broken"
      - "issue with"
    models:
      default: anthropic/claude-sonnet-4-5-20250929

# Cost optimization settings
costOptimization:
  # Prefer cheaper models when possible
  enabled: true

  # If a task can be done by a cheaper model with similar quality, use it
  allowDowngrade: true

  # Maximum cost per request (in USD, approximate)
  maxCostPerRequest: 1.0

# Model fallback chain
# If primary model fails or is unavailable, try these in order
fallback:
  - anthropic/claude-sonnet-4-5-20250929
  - openai/gpt-4-turbo
  - zhipu/glm-4-flash
  - openai/gpt-4o-mini

# Overrides for specific file patterns
filePatternOverrides:
  # Use specialized models for certain file types
  - pattern: "**/*.sql"
    model: anthropic/claude-sonnet-4-5-20250929
    reason: "Database queries require careful attention"

  - pattern: "**/*.test.*"
    model: openai/gpt-4o-mini
    reason: "Tests can use faster, cheaper models"

  - pattern: "**/migrations/**"
    model: anthropic/claude-sonnet-4-5-20250929
    reason: "Database migrations are critical"

---

# OpenCode Intelligent Orchestrator

This configuration file controls the automatic model selection based on task complexity.

## How it works

1. **Complexity Detection**: The orchestrator analyzes your prompts using:
   - Keyword matching
   - Pattern recognition (regex)
   - Token counting
   - File count estimation
   - Code complexity patterns

2. **Model Selection**: Based on detected complexity, it selects the most appropriate model:
   - **Simple** tasks → Fast, cheap models (gpt-4o-mini, glm-4-flash)
   - **Medium** tasks → Balanced models (glm-4-flash, haiku)
   - **Complex** tasks → Powerful models (claude-sonnet-4-5)
   - **Advanced** tasks → Premium models (o1, claude-opus-4)

3. **Task Type Overrides**: Specific task types (planning, review, debugging) can override complexity-based selection

4. **Cost Optimization**: Automatically selects the cheapest model that can handle the task quality requirements

## Setup

1. Copy this file to one of:
   - Global: `~/.config/opencode/orchestrator.config.md`
   - Per-project: `.opencode/orchestrator.config.md`

2. Customize the model assignments in the `models` section

3. Adjust complexity indicators to match your workflow

4. Enable the orchestrator plugin (see plugin setup)

## Customization

Edit the sections above to match your:
- Available models and API keys
- Cost preferences
- Quality requirements
- Specific project needs

## Example Mappings (Based on Your Requirements)

```yaml
models:
  simple:
    model: zhipu/glm-4-flash  # or anthropic/claude-haiku-4

  medium:
    model: anthropic/claude-haiku-4-20250514

  complex:
    model: anthropic/claude-sonnet-4-5-20250929

  advanced:
    model: anthropic/claude-sonnet-4-5-20250929

  planning:
    simple: zhipu/glm-4-flash
    complex: openai/o1  # codex-5-high for planning
```
