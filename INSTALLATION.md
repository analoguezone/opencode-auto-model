# OpenCode Orchestrator Plugin Installation Guide

## Understanding Dependencies

### ❌ What You Tried (WRONG)
```bash
npm i fs/promises  # ERROR! This is a Node.js built-in, NOT an npm package
```

### ✅ What You Actually Need

**For Standalone Version (RECOMMENDED)**: **ZERO external dependencies!**

The standalone plugin (`orchestrator.plugin.standalone.ts`) uses:
- `fs/promises` - Node.js built-in ✅
- `fs` - Node.js built-in ✅
- `path` - Node.js built-in ✅
- No YAML parser - uses JSON instead ✅

**For Original Version**: Requires `yaml` package
```bash
npm install yaml
```

## Installation Options

### Option 1: Standalone Plugin (Recommended)

**Zero dependencies, works out of the box!**

1. **Copy the standalone plugin to OpenCode plugins directory:**
   ```bash
   # Create plugins directory if it doesn't exist
   mkdir -p ~/.config/opencode/plugins

   # Copy the standalone plugin
   cp orchestrator.plugin.standalone.ts ~/.config/opencode/plugins/orchestrator.plugin.ts
   ```

2. **(Optional) Copy JSON config for customization:**
   ```bash
   cp orchestrator.config.json ~/.config/opencode/plugins/
   ```

3. **Done! No npm install needed!**

### Option 2: Original Plugin (Requires YAML package)

1. **Install the yaml package in OpenCode plugins directory:**
   ```bash
   cd ~/.config/opencode/plugins
   npm init -y  # Create package.json if it doesn't exist
   npm install yaml
   ```

2. **Copy the original plugin:**
   ```bash
   cp orchestrator.plugin.v3.ts ~/.config/opencode/plugins/orchestrator.plugin.ts
   cp orchestrator.config.v3.md ~/.config/opencode/plugins/orchestrator.config.md
   ```

## Configuration

### Using JSON Config (Standalone Version)

The standalone plugin looks for `orchestrator.config.json` in the same directory as the plugin.

**Default config location:**
```
~/.config/opencode/plugins/orchestrator.config.json
```

**Minimal config example:**
```json
{
  "enabled": true,
  "logLevel": "normal",
  "agentStrategies": {
    "auto-optimized": "cost-optimized",
    "auto-performance": "performance-optimized"
  }
}
```

**Full config:** See `orchestrator.config.json` in this repository

### Using YAML Config (Original Version)

The original plugin looks for `orchestrator.config.md` (YAML frontmatter format).

**Default config location:**
```
~/.config/opencode/plugins/orchestrator.config.md
```

## Verification

### 1. Check Plugin is Loaded

Start OpenCode and look for initialization message:
```
[Orchestrator V3] Plugin initialized (standalone version)
```

### 2. Test with OPTIMIZE Toggle

```bash
# Start OpenCode with auto-optimized agent
opencode --agent auto-optimized

# Enable OPTIMIZE toggle (status bar or command palette)
# Then try a simple task:
> "fix typo in readme"

# You should see:
[Orchestrator V3] ✅ Selected: zai-coding-plan/glm-4.6 (coding-simple / simple)
```

## Troubleshooting

### "Cannot find module 'yaml'"

**Cause:** You're using the original plugin without installing the yaml package.

**Solution 1 (Recommended):** Use the standalone plugin instead:
```bash
cp orchestrator.plugin.standalone.ts ~/.config/opencode/plugins/orchestrator.plugin.ts
```

**Solution 2:** Install yaml package:
```bash
cd ~/.config/opencode/plugins
npm install yaml
```

### "Module parse failed: Unexpected token"

**Cause:** OpenCode might not support TypeScript plugins directly.

**Solution:** You may need to compile the plugin or use your forked OpenCode that supports TypeScript plugins.

### Plugin Not Running

**Check:**
1. ✅ Plugin file is in `~/.config/opencode/plugins/`
2. ✅ OPTIMIZE toggle is ON (status bar should show green "ON")
3. ✅ Using an agent mapped to a strategy (e.g., `auto-optimized`)
4. ✅ Config has `enabled: true`

**Debug:**
Set `logLevel: "verbose"` in config to see detailed output.

## Plugin Comparison

| Feature | Standalone | Original |
|---------|-----------|----------|
| Dependencies | **ZERO** | Requires `yaml` |
| Config Format | JSON | YAML (frontmatter) |
| Setup Time | Instant | Requires `npm install` |
| Functionality | Identical | Identical |
| Maintenance | Easier | Requires dependency updates |

## Recommended Setup

For most users, we recommend:

1. **Use the standalone plugin** (no dependencies)
2. **Use JSON config** for easy editing
3. **Enable verbose logging** initially to verify it's working
4. **Start with `auto-optimized` agent** to test cost savings

```bash
# Quick setup (3 commands)
mkdir -p ~/.config/opencode/plugins
cp orchestrator.plugin.standalone.ts ~/.config/opencode/plugins/orchestrator.plugin.ts
cp orchestrator.config.json ~/.config/opencode/plugins/

# Done! No npm install needed!
```

## Next Steps

1. Read `README.v3.md` for usage guide
2. Customize `orchestrator.config.json` with your preferred models
3. Test with different task types and complexities
4. Monitor cost savings in your model provider dashboard
