# OpenCode Intelligent Orchestrator

**Automatic AI model selection for OpenCode based on task complexity and context.**

Save 60-70% on API costs by intelligently routing tasks to the most appropriate model. Uses cheap models for simple work, premium models for complex tasks.

## Features

- 🎯 **Agent-Activated**: Only runs with specific agents, no interference with normal workflow
- 🤖 **Context-Aware**: Analyzes task complexity, detects plans, tracks context size
- 💰 **Cost-Optimized**: Route simple tasks to free/cheap models (GLM 4.6)
- ⚡ **Performance Mode**: Use premium models for quality-critical work
- 📊 **Multi-Dimensional**: Strategy × Task Type × Complexity selection
- 🔄 **Fallback Support**: Per-level fallback chains for reliability
- 🎨 **Highly Configurable**: Customize every aspect of model selection

## Quick Start

### 1. Install Plugin

```bash
# Create directories
mkdir -p ~/.config/opencode/plugin
mkdir -p ~/.config/opencode/agent

# Copy plugin and agents
cp orchestrator.plugin.ts ~/.config/opencode/plugin/
cp agents/*.md ~/.config/opencode/agent/

# Copy configuration
cp orchestrator.config.md ~/.config/opencode/

# Install dependencies
npm install yaml
```

### 2. Configure Your Models

Edit `~/.config/opencode/orchestrator.config.md`:

```yaml
strategies:
  cost-optimized:
    coding-simple:
      simple: your-free-model        # e.g., glm-4.6
      medium: your-free-model
      complex:
        - your-premium-model         # e.g., claude-sonnet
        - your-free-model            # Fallback
```

### 3. Use the Agents

```bash
opencode

# Press Tab to switch agents
# Select: auto-optimized (cost mode) or auto-performance (quality mode)
```

## How It Works

### Agent-Activated Design

The orchestrator **only runs with specific agents** to prevent interference:

- **`auto-optimized`**: Cost-efficient mode (uses cheap models when possible)
- **`auto-performance`**: Quality mode (uses premium models for best results)
- **Other agents** (build, plan): Orchestrator stays inactive

### Multi-Dimensional Selection

Selects models using **Strategy × Task Type × Complexity**:

```
Model = strategies[agent_strategy][task_type][complexity]
```

**7 Task Types:**
- `coding-simple`: Implementation with existing plan
- `coding-complex`: Architectural/critical work
- `planning`: Design and strategy
- `debugging`: Error analysis
- `review`: Code review
- `documentation`: Docs and comments
- `general`: Questions and exploration

**4 Complexity Levels:**
- `simple`: Quick fixes, questions
- `medium`: Standard features
- `complex`: System changes, migrations
- `advanced`: Full rewrites, architecture

### Context-Aware Complexity

Automatically adjusts complexity based on context:

#### Plan Detection
```yaml
✓ Detailed plan exists in context
→ Reduce complexity by 1 level
→ medium → simple → use cheaper model
```

#### Subtask Detection
```yaml
✓ Prompt contains "implement step", "from plan"
→ Reduce complexity (implementation is simpler with plan)
```

#### Context Size
```yaml
< 50K tokens  → Reduce complexity (focused task)
50-100K       → Normal (no adjustment)
> 100K tokens → Raise complexity (multi-faceted task)
```

## Real-World Example

### Workflow: Plan → Implement

**Phase 1: Planning (auto-performance agent)**
```
Prompt: "Plan how to migrate invoice admin to unified system"

Analysis:
  Task: planning
  Complexity: complex → medium (context < 50K)
  Model: claude-sonnet-4-5 (performance mode)

Result:
  - Detailed 4-step plan created
  - Context grows to 50K tokens
```

**Phase 2: Implementation (auto-optimized agent)**
```
Prompt: "Implement step 1 from the plan"

Analysis:
  Task: coding-simple ("step 1", "from plan")
  Base Complexity: medium

  Context Adjustments:
    ✓ Plan detected (4 steps): medium → simple
    ✓ Subtask detected: confirmed simple
    ✓ Context 50K: normal (no change)

  Final: simple
  Model: glm-4.6 (FREE)

Result:
  - Successful implementation
  - 0 errors
  - $0 cost
```

**Savings**: 60-70% compared to using premium models for everything

## Configuration

### Strategy-Based Model Assignment

Configure models for each strategy, task type, and complexity:

```yaml
strategies:
  cost-optimized:
    coding-simple:
      simple: glm-4.6                    # Free
      medium: glm-4.6                    # Free
      complex:                           # Fallback array
        - claude-sonnet-4-5
        - glm-4.6
      advanced:                          # Multi-tier fallback
        - gpt-5-codex
        - claude-sonnet-4-5
        - glm-4.6

  performance-optimized:
    coding-simple:
      simple: claude-haiku               # Fast
      medium: claude-haiku
      complex:
        - claude-sonnet-4-5
        - claude-haiku
      advanced:
        - claude-sonnet-4-5
```

### Context-Aware Settings

```yaml
detection:
  contextAware:
    planAwareness:
      enabled: true
      planIndicators: ["step 1", "- [ ]", "1."]
      minStepsForReduction: 3

    subtaskDetection:
      enabled: true
      subtaskIndicators: ["implement step", "from plan"]

    contextSize:
      enabled: true
      smallContextThreshold: 50000   # <50K: reduce
      largeContextThreshold: 100000  # >100K: raise
```

### Agent-to-Strategy Mapping

```yaml
agentStrategies:
  auto-optimized: cost-optimized
  auto-performance: performance-optimized
```

## Usage Patterns

### Cost-Efficient Development

Use `auto-optimized` agent:

```
✓ Simple questions       → GLM (free)
✓ Medium coding with plan → GLM (free)
✓ Complex features       → Sonnet ($$$) → GLM fallback
✓ Documentation          → GLM (free)
```

**Estimated savings: 60-70%**

### Quality-Focused Development

Use `auto-performance` agent:

```
✓ Simple tasks     → Haiku (fast)
✓ Medium coding    → Sonnet (quality)
✓ Complex features → Sonnet (premium)
✓ Planning         → o1 (best reasoning)
```

**Focus: Speed + Quality over cost**

### Switch Between Modes

```bash
# Start with planning (quality mode)
Tab → auto-performance
> "Design the authentication system"
→ Uses o1 or Sonnet for planning

# Switch to implementation (cost mode)
Tab → auto-optimized
> "Implement step 1 from the plan"
→ Uses GLM (free) because plan exists

# Switch back for manual control
Tab → build
→ Orchestrator inactive, pick model manually
```

## File Pattern Overrides

Always use specific models for critical files:

```yaml
filePatternOverrides:
  - pattern: "**/security/**"
    model: claude-sonnet-4-5
    reason: "Security code is critical"

  - pattern: "**/*.sql"
    model: claude-sonnet-4-5
    reason: "Database queries require attention"

  - pattern: "**/*.test.*"
    taskTypeOverride: coding-simple
    reason: "Tests can use cheaper models"
```

## Custom Tool

Check what model would be selected:

```typescript
// In OpenCode
{
  "tool": "checkComplexity",
  "args": {
    "prompt": "Implement user authentication",
    "strategy": "cost-optimized"
  }
}

// Returns:
{
  "taskType": "coding-simple",
  "baseComplexity": "medium",
  "finalComplexity": "simple",
  "primaryModel": "glm-4.6",
  "contextAdjustments": ["Plan detected: medium → simple"]
}
```

## Agents

### auto-optimized

**Goal**: Minimize costs while maintaining quality

**Best for**:
- Exploration and prototyping
- Implementation with existing plans
- Documentation
- Simple features

**Model preferences**:
- Free/cheap models for simple/medium tasks
- Premium models only for complex/advanced

### auto-performance

**Goal**: Maximize quality and speed

**Best for**:
- Production code
- Critical features
- Complex planning
- Quality-sensitive work

**Model preferences**:
- Fast models (Haiku) for simple tasks
- Premium models (Sonnet, o1) for quality

## Installation

### Automated

```bash
./install.sh
```

The installer will:
1. Ask for global or project installation
2. Copy plugin and agent files
3. Install dependencies

### Manual

```bash
# Global installation
mkdir -p ~/.config/opencode/plugin ~/.config/opencode/agent
cp orchestrator.plugin.ts ~/.config/opencode/plugin/
cp agents/*.md ~/.config/opencode/agent/
cp orchestrator.config.md ~/.config/opencode/

# Install dependencies
npm install yaml

# Customize configuration
nano ~/.config/opencode/orchestrator.config.md
```

### Per-Project

```bash
mkdir -p .opencode/plugin .opencode/agent
cp orchestrator.plugin.ts .opencode/plugin/
cp agents/*.md .opencode/agent/
cp orchestrator.config.md .opencode/
```

## Output

The orchestrator provides transparent logging:

```
[Orchestrator V2.1] Task Analysis:
  Strategy: cost-optimized
  Task Type: coding-simple
  Base Complexity: medium
  Context Adjustments:
    - Plan detected: medium → simple
    - Subtask detected: confirmed simple
    - Normal context (50K tokens), no adjustment
  Final Complexity: simple
  Model: glm-4.6
  Fallbacks: (none)
  Reasoning:
    - Task type: coding-simple
    - Base complexity: medium
    - Detailed plan exists in context
    - Implementing subtask from plan
    - Selected from cost-optimized.coding-simple.simple
```

## Troubleshooting

### Orchestrator Not Activating

Check you're using an orchestrator agent:

```bash
# In OpenCode, press Tab
# You should see: auto-optimized, auto-performance

# If not, verify agent files exist:
ls ~/.config/opencode/agent/auto-*.md
```

### Wrong Model Selected

Enable verbose logging:

```yaml
logLevel: verbose
```

Review the analysis output to see reasoning.

### Plan Not Detected

Lower the threshold:

```yaml
planAwareness:
  minStepsForReduction: 2  # Was 3
```

Or add custom indicators:

```yaml
planAwareness:
  planIndicators:
    - "step 1"
    - "task 1"
    - "your custom indicator"
```

## Requirements

- OpenCode
- Node.js or Bun
- `yaml` package (`npm install yaml`)
- At least one AI provider configured

## License

MIT License - see [LICENSE](LICENSE)

## Contributing

Contributions welcome! Areas for improvement:

- Additional task type detection patterns
- Model performance benchmarking
- Cost tracking integration
- Custom scoring algorithms
- UI for configuration management

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Support

- **Issues**: [GitHub Issues](https://github.com/analoguezone/opencode-auto-model/issues)
- **Documentation**: See `orchestrator.config.md` for full configuration reference

---

**Save money. Maintain quality. Let the orchestrator choose.**
