---
# OpenCode Orchestrator - User Configuration
# Based on: GPT-5 Codex Plan, Anthropic $20 Plan, GLM 4.5 Free Tier
# Optimized for: Cost efficiency + Quality

enabled: true
logLevel: normal
defaultModel: anthropic/claude-sonnet-4-5-20250929

detection:
  useTokenCount: true
  useCodePatterns: true
  useKeywords: true
  useAIEstimation: false

# Model Strategy:
# - Simple tasks: GLM 4.6 (free tier, fast)
# - Medium tasks: Claude Haiku 4 (cheap, good quality)
# - Complex builds: Claude Sonnet 4.5 (premium quality)
# - Advanced planning: GPT-5 Codex High (reasoning excellence)

models:
  simple:
    model: zhipu/glm-4-flash
    description: Quick questions, simple edits, basic tasks
    maxTokens: 4000
    temperature: 0.3

  medium:
    model: anthropic/claude-haiku-4-20250514
    description: Standard features, moderate refactoring
    maxTokens: 8000
    temperature: 0.5

  complex:
    model: anthropic/claude-sonnet-4-5-20250929
    description: Advanced implementation, critical code
    maxTokens: 16000
    temperature: 0.7

  advanced:
    model: anthropic/claude-sonnet-4-5-20250929
    description: System-wide changes, architecture
    maxTokens: 32000
    temperature: 0.7

  # Planning uses different models optimized for reasoning
  planning:
    simple: zhipu/glm-4-flash
    complex: openai/o1  # or your configured codex-5-high

indicators:
  simple:
    keywords:
      - "explain"
      - "what is"
      - "what does"
      - "how do i"
      - "show me"
      - "list"
      - "display"
      - "read"
      - "view"
      - "find"
      - "search"
      - "locate"
      - "typo"
      - "fix typo"
      - "fix spacing"
      - "add comment"
      - "remove comment"
      - "rename variable"
      - "simple question"

    patterns:
      - "^(what|where|when|who|why|how)\\s"
      - "\\bexplain\\b"
      - "\\bshow\\b.*\\bme\\b"
      - "\\blist\\b.*\\b(files|functions|classes)\\b"

    tokenRange:
      min: 0
      max: 250

    fileCount:
      max: 1

  medium:
    keywords:
      - "implement"
      - "create function"
      - "add feature"
      - "refactor this"
      - "optimize"
      - "improve"
      - "update"
      - "modify"
      - "change"
      - "fix bug"
      - "debug this"
      - "add test"
      - "write test"
      - "component"
      - "api endpoint"
      - "helper function"

    patterns:
      - "\\b(implement|create|add)\\b.*\\b(function|class|component|feature)\\b"
      - "\\bfix\\b.*\\bbug\\b"
      - "\\bwrite\\b.*\\b(test|tests)\\b"
      - "\\brefactor\\b.*\\b(function|class|file)\\b"

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
      - "rebuild"
      - "rewrite"
      - "integrate"
      - "integration"
      - "system"
      - "database schema"
      - "api design"
      - "performance optimization"
      - "security"
      - "scalability"
      - "multi-file"
      - "refactor all"
      - "update all"

    patterns:
      - "\\b(design|architect|migrate|rebuild)\\b.*\\b(system|application|service|api)\\b"
      - "\\bintegrate\\b.*\\bwith\\b"
      - "\\b(performance|security|scalability)\\b.*\\b(optimization|improvement)\\b"
      - "\\ball\\b.*\\b(files|components|services)\\b"

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
      - "distributed system"
      - "end-to-end"
      - "from scratch"
      - "entire codebase"
      - "entire application"
      - "multi-service"
      - "infrastructure"
      - "deployment pipeline"
      - "ci/cd"

    patterns:
      - "\\b(complete|entire|full|whole)\\b.*\\b(rewrite|redesign|rebuild|migration)\\b"
      - "\\bmicroservices\\b"
      - "\\bdistributed\\b.*\\bsystem\\b"
      - "\\bfrom scratch\\b"
      - "\\bentire\\b.*\\b(codebase|application|system)\\b"

    tokenRange:
      min: 1800
      max: 999999

    fileCount:
      min: 15
      max: 999999

# Task type overrides for specialized workflows
taskTypes:
  planning:
    keywords:
      - "plan out"
      - "plan how to"
      - "strategy"
      - "approach for"
      - "how should i"
      - "design approach"
      - "what's the best way"
      - "analyze"
      - "suggest approach"
      - "code review"
      - "review this"
    models:
      simple: zhipu/glm-4-flash
      complex: openai/o1  # Your Codex-5-high planner

  codeReview:
    keywords:
      - "review"
      - "code review"
      - "check for issues"
      - "best practices"
      - "security review"
      - "performance review"
      - "look for bugs"
    models:
      default: anthropic/claude-sonnet-4-5-20250929

  debugging:
    keywords:
      - "debug"
      - "why is"
      - "why isn't"
      - "error"
      - "not working"
      - "broken"
      - "issue with"
      - "problem with"
      - "fails when"
    models:
      default: anthropic/claude-sonnet-4-5-20250929

  documentation:
    keywords:
      - "document"
      - "write docs"
      - "add documentation"
      - "explain this code"
      - "add comments"
      - "readme"
    models:
      default: zhipu/glm-4-flash

  quickFix:
    keywords:
      - "quick fix"
      - "typo"
      - "rename"
      - "simple change"
      - "just"
    models:
      default: zhipu/glm-4-flash

costOptimization:
  enabled: true
  allowDowngrade: true
  maxCostPerRequest: 0.50  # $0.50 max per request

# Fallback chain if primary model fails
fallback:
  - anthropic/claude-sonnet-4-5-20250929
  - anthropic/claude-haiku-4-20250514
  - zhipu/glm-4-flash
  - openai/gpt-4o-mini

# File-specific model overrides
filePatternOverrides:
  # Critical files always use Sonnet
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
    reason: "Authentication code is critical"

  # Tests can use cheaper models
  - pattern: "**/*.test.*"
    model: zhipu/glm-4-flash
    reason: "Test files can use faster, cheaper models"

  - pattern: "**/*.spec.*"
    model: zhipu/glm-4-flash
    reason: "Spec files can use faster models"

  # Documentation uses cheap models
  - pattern: "**/*.md"
    model: zhipu/glm-4-flash
    reason: "Documentation can use cheaper models"

  - pattern: "**/README*"
    model: zhipu/glm-4-flash
    reason: "README files don't need premium models"

---

# Personal Orchestrator Configuration

This configuration optimizes for your specific setup:

## Model Tier Strategy

### Tier 1: Free/Cheap (GLM 4.6 Flash)
- ✅ Simple questions and explanations
- ✅ Quick fixes and typos
- ✅ Documentation
- ✅ Test file edits
- ✅ Basic file searches

**Cost**: Free
**Speed**: Very fast
**Quality**: Good for simple tasks

### Tier 2: Budget (Claude Haiku 4)
- ✅ Standard feature implementations
- ✅ Medium complexity refactoring
- ✅ Regular bug fixes
- ✅ Component creation
- ✅ API endpoint implementation

**Cost**: $0.25 / 1M input tokens, $1.25 / 1M output tokens
**Speed**: Fast
**Quality**: High quality for development work

### Tier 3: Premium (Claude Sonnet 4.5)
- ✅ Complex system implementations
- ✅ Architecture changes
- ✅ Critical security code
- ✅ Database work
- ✅ Performance optimization
- ✅ Code reviews

**Cost**: $3 / 1M input tokens, $15 / 1M output tokens
**Speed**: Moderate
**Quality**: Excellent for complex tasks

### Tier 4: Advanced Planning (GPT-5 Codex / o1)
- ✅ System-wide planning
- ✅ Complex architecture decisions
- ✅ Strategic code reviews
- ✅ Multi-step task planning
- ✅ Critical decision making

**Cost**: Premium reasoning model
**Speed**: Slower (reasoning time)
**Quality**: Best for planning and analysis

## Cost Optimization

With this setup, you'll:
1. Use GLM 4.6 for ~40% of tasks (free)
2. Use Claude Haiku for ~35% of tasks (cheap)
3. Use Claude Sonnet for ~20% of tasks (moderate)
4. Use GPT-5/o1 for ~5% of tasks (premium, planning only)

**Estimated monthly savings**: 60-70% compared to using Sonnet for everything

## Customization Tips

1. **Adjust thresholds**: Modify `tokenRange` values to shift tasks between tiers
2. **Add keywords**: Add project-specific keywords to improve detection
3. **File overrides**: Add patterns for your critical files
4. **Task types**: Create custom task types for your workflow

## Example Usage

```
You: "Explain what this function does"
→ GLM 4.6 (simple explanation)

You: "Implement a user authentication endpoint"
→ Claude Haiku 4 (medium implementation)

You: "Refactor the entire auth system for better security"
→ Claude Sonnet 4.5 (complex security work)

You: "Plan out a migration from monolith to microservices"
→ GPT-5/o1 (advanced planning)
```
