# Maestro Test Flows for Spline CLI

Automated test flows for the Spline CLI Editor using Maestro.

## Setup

### Install Maestro

```bash
# On macOS
brew tap mobile-dev-inc/tap
brew install maestro

# On Linux/Windows
curl -Ls "https://get.maestro.mobile.dev" | bash
```

### Verify Installation

```bash
maestro --version
```

## Running Tests

### Run All Tests

```bash
maestro test .maestro/
```

### Run Specific Test

```bash
# Connection test
maestro test .maestro/01-connect-flow.yaml

# Projects listing
maestro test .maestro/02-projects-flow.yaml

# Inspect commands
maestro test .maestro/03-inspect-flow.yaml

# Batch operations
maestro test .maestro/04-batch-operations-flow.yaml

# Screenshot capture
maestro test .maestro/05-screenshot-flow.yaml

# Code execution
maestro test .maestro/06-exec-code-flow.yaml

# Viewer server
maestro test .maestro/07-viewer-flow.yaml

# Full workflow
maestro test .maestro/08-full-workflow-flow.yaml

# Fetch account (NEW)
maestro test .maestro/09-fetch-account.yaml

# Fetch by name (NEW)
maestro test .maestro/10-fetch-by-name.yaml

# Fetch list (NEW)
maestro test .maestro/11-fetch-list.yaml
```

### Run with Cloud

Upload and run tests on Maestro Cloud:

```bash
maestro cloud --apiKey YOUR_API_KEY .maestro/
```

## Test Flows

### 01-connect-flow.yaml
Tests the connection functionality:
- Connect with token
- Verify user email displayed
- Check success message

### 02-projects-flow.yaml
Tests project listing:
- List all projects
- Verify demo projects appear
- Check project IDs

### 03-inspect-flow.yaml
Tests scene inspection:
- Inspect objects
- Inspect materials
- Inspect cameras
- Verify output formatting

### 04-batch-operations-flow.yaml
Tests batch operations:
- Batch update multiple objects
- Clone objects
- Verify operation success

### 05-screenshot-flow.yaml
Tests screenshot capture:
- Capture with custom dimensions
- Verify file creation
- Check output path

### 06-exec-code-flow.yaml
Tests code execution:
- Execute inline JavaScript
- Execute from file
- Verify success messages

### 07-viewer-flow.yaml
Tests live preview viewer:
- Start viewer server
- Verify server responds
- Check URL accessibility

### 08-full-workflow-flow.yaml
Tests complete workflow:
- Connect → List → Open → Inspect → Batch → Screenshot
- Verifies all commands work together
- End-to-end integration test

### 09-fetch-account.yaml
Tests opening Spline account:
- Open account home page
- Verify browser opens
- Check URL displayed

### 10-fetch-by-name.yaml
Tests opening project by name:
- Search for project by name
- Open matching project
- Verify project found and opened

### 11-fetch-list.yaml
Tests listing all projects:
- Fetch project list
- Verify projects found
- Check project count display

## CI/CD Integration

### GitHub Actions

```yaml
name: Maestro Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash
      - name: Run tests
        run: maestro test .maestro/
```

### GitLab CI

```yaml
test:
  script:
    - curl -Ls "https://get.maestro.mobile.dev" | bash
    - maestro test .maestro/
```

## Writing New Tests

### Test Structure

```yaml
appId: com.terminal.spline-cli
---
# Test description
- launchApp
- runScript: |
    your-command-here
- assertVisible: "Expected output"
```

### Best Practices

1. **Test isolation**: Each test should be independent
2. **Clear assertions**: Assert on specific, meaningful output
3. **Setup state**: Ensure prerequisites (e.g., open project before editing)
4. **Clean up**: Remove test files/data after tests
5. **Descriptive names**: Use clear flow names and comments

### Example: Custom Test

```yaml
appId: com.terminal.spline-cli
---
# Test: Custom Material Application
- launchApp
- runScript: |
    spline-edit open project-1
    spline-edit materials apply Cube "metallic-blue"
- assertVisible: "Material applied"
- assertVisible: "Cube"
```

## Debugging

### Run in Debug Mode

```bash
maestro test --debug .maestro/01-connect-flow.yaml
```

### View Logs

```bash
maestro test --verbose .maestro/
```

### Interactive Mode

```bash
maestro studio
```

## Continuous Testing

### Watch Mode

Run tests automatically on file changes:

```bash
maestro test --watch .maestro/
```

### Scheduled Tests

Use cron or task scheduler:

```bash
# Run every hour
0 * * * * cd /path/to/spline-cli-editor && maestro test .maestro/
```

## Troubleshooting

**Tests failing?**
- Check Spline CLI is globally installed: `which spline-edit`
- Verify .env credentials are set
- Ensure ports are available (8080, 8081)

**Viewer tests timing out?**
- Increase sleep duration in flow
- Check firewall settings
- Verify localhost access

**Permission errors?**
- Run with appropriate permissions
- Check file system access

## Resources

- [Maestro Documentation](https://maestro.mobile.dev)
- [Spline CLI Docs](../README.md)
- [Test Examples](https://github.com/mobile-dev-inc/maestro/tree/main/maestro-test)

---

**Happy Testing! 🧪✨**
