# Changelog

All notable changes to the OpenCode Orchestrator Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-15

### Added

- Initial release of OpenCode Orchestrator Plugin
- Automatic model selection based on task complexity
- Multi-factor complexity detection:
  - Keyword matching
  - Pattern recognition (regex)
  - Token count analysis
  - Code complexity analysis
  - File count estimation
- Task type override system for specialized workflows:
  - Planning tasks
  - Code review tasks
  - Debugging tasks
  - Documentation tasks
  - Quick fixes
- File pattern overrides for critical files
- Cost optimization features:
  - Smart model downgrade when appropriate
  - Maximum cost per request limiting
  - Fallback chain for model failures
- Comprehensive logging system (silent, minimal, normal, verbose)
- Custom `checkComplexity` tool for manual analysis
- TypeScript type definitions
- Two example configurations:
  - Generic example for all users
  - User-optimized example (GPT-5 Codex + Claude + GLM)
- Automated installation script
- Full documentation:
  - Comprehensive README
  - Quick Start Guide
  - Inline code comments

### Configuration Options

- Support for global configuration (`~/.config/opencode/orchestrator.config.md`)
- Support for per-project configuration (`.opencode/orchestrator.config.md`)
- Markdown configuration format with YAML frontmatter
- Alternative YAML configuration format

### Detection Features

- Four complexity levels: simple, medium, complex, advanced
- Configurable indicators for each level
- Weighted scoring system
- Confidence scoring
- Task type detection and override
- File pattern-based overrides

### Cost Optimization

- Estimated 60-70% cost savings for typical workloads
- Intelligent model tier selection
- Cost per request limiting
- Downgradable model selection

### Developer Experience

- Transparent decision-making with detailed reasoning
- Real-time logging of model selection
- Custom tool for complexity checking
- Easy customization via configuration
- Examples for common use cases

## [Unreleased]

### Planned Features

- [ ] Machine learning-based complexity detection
- [ ] A/B testing support for model comparison
- [ ] Integration with cost tracking APIs
- [ ] Model performance benchmarking
- [ ] Web UI for configuration management
- [ ] Support for model ensembles
- [ ] Automatic configuration optimization based on usage patterns
- [ ] Support for custom scoring algorithms
- [ ] Integration with OpenCode analytics
- [ ] Multi-language support for keywords
- [ ] Context-aware model selection (based on conversation history)
- [ ] User feedback integration for improving selection

---

[1.0.0]: https://github.com/analoguezone/opencode-auto-model/releases/tag/v1.0.0
