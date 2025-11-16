# Quick Start Guide

Get the OpenCode Orchestrator Plugin running in 5 minutes.

## Prerequisites

- OpenCode installed and configured
- At least one AI provider configured (Anthropic, OpenAI, etc.)
- Node.js or Bun installed

## Installation

### Option 1: Automated Installation (Recommended)

```bash
# Clone or download this repository
cd opencode-auto-model

# Run the installer
./install.sh
```

The installer will:
1. Ask if you want global or project-specific installation
2. Copy the plugin files to the right location
3. Let you choose a configuration template
4. Install dependencies

### Option 2: Manual Installation

```bash
# 1. Create plugin directory (global)
mkdir -p ~/.config/opencode/plugin

# 2. Copy plugin file
cp orchestrator.plugin.ts ~/.config/opencode/plugin/

# 3. IMPORTANT: Install agents
mkdir -p ~/.config/opencode/agent
cp agents/auto-optimized.md ~/.config/opencode/agent/
cp agents/auto-performance.md ~/.config/opencode/agent/

# 4. Copy configuration
cp orchestrator.config.user-example.md ~/.config/opencode/orchestrator.config.md

# 5. Install dependencies
npm install yaml
# or: bun add yaml
```

## Configuration

### Step 1: Choose Your Models

Edit `~/.config/opencode/orchestrator.config.md` and set your models:

```yaml
models:
  simple:
    model: zhipu/glm-4-flash  # Your cheapest/free model
  medium:
    model: anthropic/claude-haiku-4-20250514  # Budget model
  complex:
    model: anthropic/claude-sonnet-4-5-20250929  # Premium model
  advanced:
    model: openai/o1  # Your best reasoning model
```

### Step 2: Activate an Orchestrator Agent

Start OpenCode and **switch to an orchestrator agent**:

```bash
opencode

# Press Tab to cycle through agents
# Or type: /models
# Select: auto-optimized (for cost savings)
```

### Step 3: Test It

Try some prompts and watch the orchestrator in action:

1. **Simple**: "What does this function do?"
   - Should use your cheapest model (GLM 4.6)

2. **Medium**: "Implement a user login endpoint"
   - Should use your medium model (Claude Haiku)

3. **Complex**: "Refactor the entire auth system"
   - Should use your premium model

You'll see output like:

```
[Orchestrator] Task Analysis:
  Complexity: medium
  Model: anthropic/claude-haiku-4-20250514
  Reasoning:
    - Found 2 medium keywords: implement, login
    - Token count (420) fits medium range (250-600)
    - Matched 1 medium patterns
```

## Common Configurations

### Budget-Conscious Setup

Minimize costs by using free/cheap models:

```yaml
models:
  simple:
    model: zhipu/glm-4-flash
  medium:
    model: zhipu/glm-4-flash
  complex:
    model: anthropic/claude-haiku-4-20250514
  advanced:
    model: anthropic/claude-sonnet-4-5-20250929
```

### Quality-First Setup

Use premium models for everything important:

```yaml
models:
  simple:
    model: openai/gpt-4o-mini
  medium:
    model: anthropic/claude-sonnet-4-5-20250929
  complex:
    model: anthropic/claude-opus-4-20250514
  advanced:
    model: openai/o1
```

### Balanced Setup (Recommended)

Optimize cost vs. quality:

```yaml
models:
  simple:
    model: zhipu/glm-4-flash  # Free
  medium:
    model: anthropic/claude-haiku-4-20250514  # Cheap
  complex:
    model: anthropic/claude-sonnet-4-5-20250929  # Premium
  advanced:
    model: openai/o1  # Ultra-premium
```

## Customization Tips

### Adjust Complexity Thresholds

If tasks are being classified incorrectly:

```yaml
indicators:
  medium:
    tokenRange:
      min: 250
      max: 600  # ← Increase to classify more tasks as "simple"
```

### Add Your Own Keywords

Add project-specific keywords:

```yaml
indicators:
  complex:
    keywords:
      # Default keywords...
      - "design"
      - "architecture"
      # Your custom keywords:
      - "microservice"
      - "kubernetes"
      - "scaling"
```

### Override Specific Files

Always use premium models for critical files:

```yaml
filePatternOverrides:
  - pattern: "**/payment/**"
    model: anthropic/claude-opus-4-20250514
    reason: "Payment code is critical"
```

## Troubleshooting

### Plugin Not Working

1. Check plugin is loaded:
```bash
ls ~/.config/opencode/plugin/orchestrator.plugin.ts
```

2. Check config exists:
```bash
ls ~/.config/opencode/orchestrator.config.md
```

3. Enable verbose logging in config:
```yaml
logLevel: "verbose"
```

### Wrong Model Selected

1. Check the reasoning output
2. Adjust thresholds in your config
3. Add more keywords for your use case

### Dependencies Error

Install required packages:
```bash
npm install yaml
# or
bun add yaml
```

## What's Next?

- Read the full [README.md](README.md) for advanced features
- Customize your configuration for your specific workflow
- Join the discussion and share your config optimizations

## Getting Help

- Check the [README.md](README.md) for detailed documentation
- Review example configurations
- Open an issue on GitHub

---

**Happy coding with optimized AI models!** 🚀
