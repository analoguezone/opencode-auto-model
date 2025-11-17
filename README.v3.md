# OpenCode Orchestrator Plugin V3.0

**FINALLY WORKING!** 🎉

This plugin now works with the `prompt.before` hook implemented in your forked OpenCode!

## What Changed in V3

### V1-V2 (Didn't Work)
- ❌ Tried to use `tool.execute.before` - too late, model already selected
- ❌ Tried to use `event` hook - no access to modify model
- ❌ No hook existed BEFORE LLM call

### V3 (Works!)
- ✅ Uses `prompt.before` hook - fires BEFORE LLM call
- ✅ Can override model selection dynamically
- ✅ Respects OPTIMIZE toggle in OpenCode UI
- ✅ Clean, simple implementation
- ✅ Actually intercepts and changes the model!

## Prerequisites

You MUST use your **forked OpenCode** with the `prompt.before` hook implemented. Stock OpenCode will NOT work.

### Build Your Forked OpenCode

```bash
cd /path/to/your/forked/opencode
npm install
npm run build
npm link  # Make it available globally
```

## Installation

### 1. Copy Plugin and Config

```bash
# Copy to your OpenCode plugins directory
cp orchestrator.plugin.v3.ts ~/.config/opencode/plugin/orchestrator.plugin.ts
cp orchestrator.config.v3.md ~/.config/opencode/orchestrator.config.md
```

### 2. Enable in OpenCode Config

Edit `~/.config/opencode/opencode.json`:

```json
{
  "plugin": [
    "file:///Users/YOUR_USERNAME/.config/opencode/plugin/orchestrator.plugin.ts"
  ]
}
```

Or if using TypeScript directly:

```json
{
  "plugin": {
    "orchestrator": {
      "enabled": true
    }
  }
}
```

### 3. Enable Optimization Toggle

In OpenCode:
1. Press `Cmd+O` (command palette)
2. Type "toggle model"
3. Select "Toggle model optimization (ON/OFF)"
4. Status bar should show: **OPTIMIZE: ON** (green)

## Usage

### Basic Flow

```bash
# Start OpenCode with your forked build
opencode --agent auto-optimized

# The plugin will:
# 1. Check if OPTIMIZE is ON
# 2. Analyze your prompt
# 3. Select the optimal model
# 4. Override OpenCode's default model

# Example prompts:

# Simple task → Uses GLM 4.6 (free!)
> "fix typo in readme"
[Orchestrator V3] Detected coding-simple task
[Orchestrator V3] Base complexity: simple
[Orchestrator V3] ✅ Selected: zai-coding-plan/glm-4.6

# Complex task → Uses Sonnet 4.5
> "refactor the authentication system to use JWT with role-based permissions"
[Orchestrator V3] Detected coding-complex task
[Orchestrator V3] Base complexity: advanced
[Orchestrator V3] ✅ Selected: openai/gpt-5-codex-high

# Planning task → Uses GPT-5
> "design a microservices architecture for this e-commerce platform"
[Orchestrator V3] Detected planning task
[Orchestrator V3] Base complexity: advanced
[Orchestrator V3] ✅ Selected: openai/gpt-5-codex-high
```

### With Plan Detection

```bash
# Step 1: Create plan (uses expensive model)
> "Create a detailed plan for adding user authentication"
[Orchestrator V3] ✅ Selected: openai/gpt-5-codex-high

# Step 2: Implement (detects plan, reduces complexity, uses cheap model!)
> "Implement step 1 from the plan above"
[Orchestrator V3] Detected coding-simple task
[Orchestrator V3] Base complexity: medium
[Orchestrator V3] Plan detected: medium → simple
[Orchestrator V3] ✅ Selected: zai-coding-plan/glm-4.6
```

### Turn Off Optimization

```bash
# Toggle optimization OFF
# Press Cmd+O → "toggle model optimization"
# Status bar shows: OPTIMIZE: OFF (gray)

# Now all prompts use default model
> "fix typo"
[Orchestrator V3] Optimization disabled by user (toggle OFF)
# Uses default model (Claude Sonnet 4.5)
```

## Configuration

Edit `~/.config/opencode/orchestrator.config.md` to customize:

### Agent Strategies

```yaml
agentStrategies:
  auto-optimized: cost-optimized   # Uses cheap models when possible
  auto-performance: performance-optimized  # Always uses best models
  build: cost-optimized
  general: balanced
```

### Model Selection Matrix

Example for `cost-optimized` strategy:

```yaml
strategies:
  cost-optimized:
    coding-simple:
      simple: zai-coding-plan/glm-4.6       # Free!
      medium: zai-coding-plan/glm-4.6       # Free!
      complex: anthropic/claude-sonnet-4-5-20250929
      advanced: openai/gpt-5-codex-high

    planning:
      simple: zai-coding-plan/glm-4.6
      medium: anthropic/claude-sonnet-4-5-20250929
      complex: openai/gpt-5-codex-high      # Deep thinking
      advanced: openai/gpt-5-codex-high
```

### Task Type Detection

```yaml
taskTypeIndicators:
  coding-simple:
    keywords:
      - fix
      - update
      - add
      - typo

  coding-complex:
    keywords:
      - refactor
      - architecture
      - migrate
```

### Complexity Detection

```yaml
indicators:
  simple:
    keywords:
      - quick
      - simple
      - minor
    tokenRange:
      min: 0
      max: 100

  advanced:
    keywords:
      - architecture
      - comprehensive
    tokenRange:
      min: 600
      max: 999999
```

## Real-World Example

### Before Orchestrator

```bash
opencode  # Using default Sonnet 4.5 for everything

> "fix typo in readme"
# Uses Sonnet 4.5 → Costs money

> "implement user auth"
# Uses Sonnet 4.5 → Costs money

> "design microservices architecture"
# Uses Sonnet 4.5 → Good choice

Total cost: High (3 expensive calls)
```

### After Orchestrator

```bash
opencode --agent auto-optimized  # OPTIMIZE: ON

> "fix typo in readme"
# Uses GLM 4.6 → FREE! ✅

> "implement user auth"
# Uses GLM 4.6 → FREE! ✅

> "design microservices architecture"
# Uses GPT-5 → Premium quality ✅

Total cost: Low (1 expensive call, 2 free)
Quality: Same or better!
```

## Cost Savings Calculator

Assuming:
- Sonnet 4.5: $3 per million tokens
- GPT-5: $5 per million tokens
- GLM 4.6: FREE (0.25× multiplier)

### Example Day (50 prompts)

**Without Orchestrator:**
- 50 prompts × Sonnet 4.5 = $150 (if each uses ~1M tokens)

**With Orchestrator:**
- 10 complex prompts × GPT-5 = $50
- 20 medium prompts × Sonnet 4.5 = $60
- 20 simple prompts × GLM 4.6 = $0

**Savings: $40/day = $1,200/month!** 💰

## Debugging

### Check if Plugin Loaded

Look for this on OpenCode startup:

```
[Orchestrator V3] ✅ Plugin loaded and enabled
[Orchestrator V3] Will respect OPTIMIZE toggle
[Orchestrator V3] Loaded config from /Users/.../.config/opencode/orchestrator.config.md
```

### Verbose Logging

Edit config:

```yaml
logLevel: verbose  # Change from "normal"
```

You'll see:

```
[Orchestrator V3] Analyzing prompt for agent: auto-optimized
[Orchestrator V3] Detected coding-simple task
[Orchestrator V3] Base complexity: simple
[Orchestrator V3] Task: coding-simple, Complexity: simple, Strategy: cost-optimized
[Orchestrator V3] ✅ Selected: zai-coding-plan/glm-4.6
[Orchestrator V3]    Fallbacks: anthropic/claude-sonnet-4-5-20250929
```

### Verify Model Override

Check OpenCode's response header - it should show the model the orchestrator selected, not the default.

### Common Issues

**Plugin doesn't load:**
- Check file path in `opencode.json`
- Ensure you're using your forked OpenCode build
- Check for syntax errors: `npm run build` in plugin directory

**Models don't change:**
- Check if OPTIMIZE toggle is ON (status bar)
- Verify `enabled: true` in config
- Check console for orchestrator logs
- Make sure `prompt.before` hook exists in your OpenCode fork

**Config not found:**
- Check file exists: `ls ~/.config/opencode/orchestrator.config.md`
- Verify YAML syntax (use a validator)
- Check console for config loading errors

## Architecture

```
User types prompt
       ↓
OpenCode receives it
       ↓
Agent.get() resolves agent (e.g., "auto-optimized")
       ↓
🆕 prompt.before hook fires ← ORCHESTRATOR RUNS HERE!
       ↓
Orchestrator:
  1. Check optimizeEnabled flag
  2. Detect task type (coding, planning, etc.)
  3. Detect complexity (simple, medium, complex, advanced)
  4. Look up model in strategy matrix
  5. Override output.model
       ↓
OpenCode uses the overridden model
       ↓
LLM call with optimal model ✅
```

## Contributing to OpenCode

Since you've already implemented `prompt.before` in your fork, consider:

1. **Clean up the implementation**
2. **Add tests**
3. **Write documentation**
4. **Submit PR to OpenCode**

This would benefit the entire OpenCode community!

## Future Enhancements

Potential improvements:
- [ ] Context size tracking (reduce complexity if >100K tokens)
- [ ] Real-time cost tracking
- [ ] Model performance analytics
- [ ] Auto-learning from user approvals/rejections
- [ ] Integration with OpenCode's native model selection UI

## Credits

- **Research**: Extensive investigation of OpenCode and Droid architectures
- **Implementation**: Custom `prompt.before` hook in OpenCode fork
- **Plugin**: Orchestrator V3 using the new hook
- **Inspiration**: Droid's `UserPromptSubmit` hook

## License

MIT

---

**Questions?** Check the implementation guide: `OPENCODE_HOOK_IMPLEMENTATION_GUIDE.md`

**Contributing?** See your forked OpenCode repo for the `prompt.before` hook implementation.
