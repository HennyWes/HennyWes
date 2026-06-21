# VulnForge Configuration

VulnForge uses JSON files for scan configurations. These files are stored in the `vulnforge/config/` directory.

## Configuration Fields

- `programName` (string, required): The name of the HackerOne program.
- `scopeUrl` (string, optional): A URL to fetch scope rules from.
- `scopeRules` (string/object, optional): Raw scope rules (used if `scopeUrl` is not provided).
- `scanDepth` (string, required): The depth of the scan. Choices: `Low`, `Medium`, `High`.

## Example JSON Configuration

```json
{
  "programName": "Example Program",
  "scopeUrl": "https://hackerone.com/example/policy",
  "scanDepth": "Medium"
}
```

## Example YAML Import

You can import a configuration from a YAML file using `vulnforge init --file config.yaml`.

```yaml
programName: "Example Program"
scopeUrl: "https://hackerone.com/example/policy"
scanDepth: "High"
```

## CLI Usage

### Initialize a Program
```bash
vulnforge init
```
Or import from a file:
```bash
vulnforge init --file my-config.json
```

### Start a Scan
```bash
vulnforge scan --config example-program.json
```
