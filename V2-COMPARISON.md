# V2 Multi-Dimensional Selection - Solving the Flexibility Problem

## The Problem You Identified

### V1 Issues:
1. ✗ **No agent differentiation**: `auto-optimized` and `auto-performance` used same models
2. ✗ **Too limited**: Fixed complexity → model mapping
3. ✗ **Not context-aware**: GLM 4.6 can't be "good for medium coding but not medium planning"
4. ✗ **Inflexible**: Can't express "GPT-5 medium for cost planning, GPT-5 high for performance planning"

## V2 Solution: Multi-Dimensional Selection

### Architecture: Strategy × Task Type × Complexity

```
strategies[agent_strategy][task_type][complexity] → model
```

### Example Configuration

```yaml
strategies:
  cost-optimized:
    coding:
      simple: zhipu/glm-4-flash
      medium: zhipu/glm-4-flash    # ✓ GLM is GOOD for medium coding!
      complex: anthropic/claude-sonnet-4-5-20250929

    planning:
      simple: zhipu/glm-4-flash
      medium: zhipu/glm-4-flash    # ✓ GLM can do moderate planning
      complex: openai/gpt-5        # ✓ GPT-5 MEDIUM for cost mode

  performance-optimized:
    coding:
      simple: anthropic/claude-haiku-4-20250514  # ✓ Haiku for speed
      medium: anthropic/claude-sonnet-4-5-20250929  # ✓ Sonnet for quality
      complex: anthropic/claude-sonnet-4-5-20250929

    planning:
      simple: anthropic/claude-haiku-4-20250514
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: openai/o1           # ✓ GPT-5 HIGH (o1) for performance mode
```

## Real-World Examples

### Example 1: Medium Coding Task

**Prompt:** "Implement user authentication with JWT"

#### V1 (Broken):
```
auto-optimized agent:
  complexity: medium
  model: claude-haiku (from global models.medium)

auto-performance agent:
  complexity: medium
  model: claude-haiku (SAME - no differentiation!)
```

#### V2 (Fixed):
```
auto-optimized agent:
  strategy: cost-optimized
  task_type: coding (detected "implement")
  complexity: medium
  model: zhipu/glm-4-flash
  reasoning: cost-optimized.coding.medium
  ✓ Saves money, GLM is good enough for this!

auto-performance agent:
  strategy: performance-optimized
  task_type: coding
  complexity: medium
  model: anthropic/claude-sonnet-4-5-20250929
  reasoning: performance-optimized.coding.medium
  ✓ Uses premium model for quality
```

### Example 2: Complex Planning Task

**Prompt:** "Design a microservices architecture for our monolith"

#### V1 (Broken):
```
auto-optimized agent:
  complexity: complex
  model: claude-sonnet (from global models.complex)

auto-performance agent:
  complexity: complex
  model: claude-sonnet (SAME - no differentiation!)
```

#### V2 (Fixed):
```
auto-optimized agent:
  strategy: cost-optimized
  task_type: planning (detected "design", "architecture")
  complexity: complex
  model: openai/gpt-5
  reasoning: cost-optimized.planning.complex
  ✓ Uses GPT-5 medium reasoning (cheaper than o1)

auto-performance agent:
  strategy: performance-optimized
  task_type: planning
  complexity: complex
  model: openai/o1
  reasoning: performance-optimized.planning.complex
  ✓ Uses o1 (GPT-5 high) for best reasoning
```

### Example 3: Medium Planning Task

**Prompt:** "Plan out the database schema for user profiles"

#### V1 (Broken):
```
auto-optimized:
  complexity: medium
  task_type: planning (detected)
  model: ??? (taskTypes.planning.simple or complex, nothing for medium)
  ✓ Limited fallback logic
```

#### V2 (Fixed):
```
auto-optimized agent:
  strategy: cost-optimized
  task_type: planning
  complexity: medium
  model: zhipu/glm-4-flash
  reasoning: cost-optimized.planning.medium
  ✓ GLM can handle moderate planning, save money!

auto-performance agent:
  strategy: performance-optimized
  task_type: planning
  complexity: medium
  model: anthropic/claude-sonnet-4-5-20250929
  reasoning: performance-optimized.planning.medium
  ✓ Higher quality for important planning
```

## Flexibility Examples

### Your Specific Requirements

#### Requirement 1: GLM 4.6 for medium coding (cost mode)

```yaml
strategies:
  cost-optimized:
    coding:
      medium: zhipu/glm-4-flash  # ✓ Achievable!
```

#### Requirement 2: GLM 4.6 NOT for medium planning (use carefully)

```yaml
strategies:
  cost-optimized:
    coding:
      medium: zhipu/glm-4-flash     # ✓ GLM for coding
    planning:
      medium: zhipu/glm-4-flash     # Can still use GLM if you want
      # OR
      medium: anthropic/claude-haiku-4-20250514  # Or upgrade to Haiku
```

#### Requirement 3: GPT-5 medium for cost planning, GPT-5 high for performance planning

```yaml
strategies:
  cost-optimized:
    planning:
      complex: openai/gpt-5         # ✓ GPT-5 medium (codex)

  performance-optimized:
    planning:
      complex: openai/o1            # ✓ GPT-5 high (o1 reasoning)
```

#### Requirement 4: Haiku for simple tasks in performance mode

```yaml
strategies:
  performance-optimized:
    coding:
      simple: anthropic/claude-haiku-4-20250514  # ✓ Fast + quality
    general:
      simple: anthropic/claude-haiku-4-20250514  # ✓ All simple tasks
```

#### Requirement 5: Sonnet for advanced coding

```yaml
strategies:
  cost-optimized:
    coding:
      advanced: anthropic/claude-sonnet-4-5-20250929  # ✓ Premium for critical

  performance-optimized:
    coding:
      advanced: anthropic/claude-sonnet-4-5-20250929  # ✓ Same (already premium)
```

## Comparison Table

| Scenario | V1 Result | V2 Result | Difference |
|----------|-----------|-----------|------------|
| Medium coding (cost) | Haiku $$ | GLM FREE | ✓ Cost savings |
| Medium coding (perf) | Haiku $$ | Sonnet $$$ | ✓ Better quality |
| Complex planning (cost) | Sonnet $$$ | GPT-5 $$$$ | ✓ Better reasoning |
| Complex planning (perf) | Sonnet $$$ | o1 $$$$$ | ✓ Best reasoning |
| Simple tasks (cost) | GLM FREE | GLM FREE | Same |
| Simple tasks (perf) | GLM FREE | Haiku $$ | ✓ Faster + quality |
| Medium planning (cost) | ??? | GLM FREE | ✓ Defined path |
| Medium planning (perf) | ??? | Sonnet $$$ | ✓ Quality planning |

## Task Type Detection

V2 detects 6 task types automatically:

1. **coding**: implement, create, refactor, function, class
2. **planning**: plan, design, architecture, strategy
3. **debugging**: debug, fix, error, bug, not working
4. **review**: review, check, analyze, evaluate
5. **documentation**: document, explain, readme, guide
6. **general**: fallback for questions, exploration

### Detection Example

```
Prompt: "Implement OAuth2 authentication"
→ Keywords: "implement", "authentication"
→ Task Type: coding ✓
→ Complexity: medium
→ Strategy: cost-optimized
→ Model: zhipu/glm-4-flash

Prompt: "Plan the OAuth2 integration approach"
→ Keywords: "plan", "integration", "approach"
→ Task Type: planning ✓
→ Complexity: medium
→ Strategy: cost-optimized
→ Model: zhipu/glm-4-flash (or upgrade if you prefer)
```

## File Pattern Overrides

V2 supports task type overrides:

```yaml
filePatternOverrides:
  - pattern: "**/*.test.*"
    taskTypeOverride: coding  # Tests are coding, not review
    # Let strategy matrix decide: cost→GLM, perf→Sonnet

  - pattern: "**/*.md"
    taskTypeOverride: documentation
    # cost→GLM, perf→Haiku

  - pattern: "**/security/**"
    model: anthropic/claude-sonnet-4-5-20250929  # Always premium
    reason: "Security is critical"
```

## Migration Path

### Option 1: Use V2 Plugin (Recommended)

```bash
# Use the new V2 plugin
cp orchestrator.plugin.v2.ts ~/.config/opencode/plugin/orchestrator.plugin.ts

# Use V2 config
cp orchestrator.config.v2.md ~/.config/opencode/orchestrator.config.md
```

### Option 2: Keep V1, Add Strategy Support

Update V1 plugin to read `strategies` config and map agents properly.

## Configuration Flexibility

### Custom Strategies

Add your own strategies:

```yaml
strategies:
  ultra-cost-optimized:
    coding:
      simple: zhipu/glm-4-flash
      medium: zhipu/glm-4-flash
      complex: zhipu/glm-4-flash     # Even complex uses GLM!
      advanced: anthropic/claude-haiku-4-20250514  # Minimal upgrade

agentStrategies:
  my-budget-agent: ultra-cost-optimized
```

### Per-Project Strategies

```yaml
# .opencode/orchestrator.config.md (local project)
strategies:
  production-quality:
    coding:
      simple: anthropic/claude-sonnet-4-5-20250929  # Always premium
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: anthropic/claude-opus-4-20250514    # Even better
      advanced: anthropic/claude-opus-4-20250514
```

### Mix and Match

```yaml
strategies:
  hybrid:
    coding:
      simple: zhipu/glm-4-flash          # Free for simple
      medium: anthropic/claude-haiku-4-20250514  # Budget for medium
      complex: anthropic/claude-sonnet-4-5-20250929  # Premium for complex
      advanced: anthropic/claude-sonnet-4-5-20250929
    planning:
      simple: zhipu/glm-4-flash
      medium: anthropic/claude-sonnet-4-5-20250929  # Jump to premium early
      complex: openai/o1
      advanced: openai/o1
```

## Summary

### V1 Problems:
- ✗ No agent differentiation
- ✗ Single-dimension selection (complexity only)
- ✗ Can't express context-dependent preferences
- ✗ Limited flexibility

### V2 Solutions:
- ✓ **Multi-dimensional**: Strategy × Task Type × Complexity
- ✓ **Agent differentiation**: Different strategies per agent
- ✓ **Context-aware**: GLM for coding, not planning (if you want)
- ✓ **Fully flexible**: Configure every cell independently
- ✓ **Task type detection**: Automatic classification
- ✓ **File pattern support**: Override by file type
- ✓ **Custom strategies**: Add your own

### Your Requirements Met:
- ✓ GLM 4.6 for medium coding (cost mode)
- ✓ GLM 4.6 for moderate planning (cost mode)
- ✓ Sonnet for advanced coding
- ✓ Haiku for simpler tasks (performance mode)
- ✓ GPT-5 medium for complex planning (cost mode)
- ✓ GPT-5 high (o1) for complex planning (performance mode)

## Next Steps

1. Review `orchestrator.config.v2.md` for full configuration
2. Review `orchestrator.plugin.v2.ts` for implementation
3. Customize the strategy matrix for your needs
4. Test with both `auto-optimized` and `auto-performance` agents
5. Observe the differences in model selection

The V2 architecture gives you **complete control** over the Strategy × Task Type × Complexity space!
