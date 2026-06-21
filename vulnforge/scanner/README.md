# VulnForge Scanner Modules

This directory contains the core scanning and recon modules for the VulnForge AI agent.

## Modules

### Scope Parser (`scope_parser.py`)

Responsible for reading and interpreting HackerOne program scope rules. It identifies allowed and excluded targets to ensure the scanner remains within legal and program-defined boundaries.

#### Usage

```python
from scope_parser import ScopeParser

# Load from a local JSON file (e.g., exported from HackerOne API)
parser = ScopeParser()
parser.load_from_file('program_scope.json')
result = parser.parse()

allowed_domains = parser.get_allowed_domains()
print(f"Allowed domains: {allowed_domains}")
```

#### Running Tests

```bash
pytest test_scope_parser.py
```

## Guardrails

- **Scope-aware:** Always filters for assets where `eligible_for_submission` is `True`.
- **Exclusion handling:** Parses and stores `scope_exclusions` for reference by other modules.
