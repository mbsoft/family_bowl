# Test Coverage Display Options for README

This document outlines different options for displaying test coverage in your README.md file.

## Current Status

✅ Vitest is configured and working
✅ Coverage reports are generated in `coverage/` directory
✅ CI workflow runs tests and generates coverage
✅ Coverage thresholds are set to 60% minimum

## Option 1: Static Badge (Simplest)

Use a static shields.io badge that you update manually after each coverage run.

### Steps:
1. Run coverage: `npm run test:coverage`
2. Generate badge: `npm run coverage:badge`
3. Copy the badge URL from the output
4. Add to README:

```markdown
[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)](https://github.com/mbsoft/family_bowl)
```

**Pros:** Simple, no external services needed
**Cons:** Requires manual updates

## Option 2: Codecov (Recommended)

Use Codecov for automatic coverage tracking and badges.

### Setup Steps:

1. **Sign up at [codecov.io](https://codecov.io)**
   - Connect your GitHub account
   - Add your repository

2. **Get your Codecov token**
   - Go to repository settings
   - Copy the upload token

3. **Add GitHub Secret**
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Add new secret: `CODECOV_TOKEN` with your token value

4. **Add badge to README:**

```markdown
[![codecov](https://codecov.io/gh/mbsoft/family_bowl/branch/main/graph/badge.svg)](https://codecov.io/gh/mbsoft/family_bowl)
```

**Pros:** Automatic updates, historical tracking, detailed reports
**Cons:** Requires external service account

## Option 3: GitHub Actions Artifact Badge

Create a custom workflow that generates a badge from coverage data.

### Setup:

1. **Create `.github/workflows/coverage-badge.yml`:**

```yaml
name: Coverage Badge

on:
  workflow_run:
    workflows: ["CI"]
    types:
      - completed

jobs:
  badge:
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'success'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: coverage
          run-id: ${{ github.event.workflow_run.id }}
      - uses: tj-actions/coverage-badge@v2
        with:
          output: coverage-badge.svg
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'Update coverage badge'
          file_pattern: 'coverage-badge.svg'
```

2. **Update CI workflow to upload coverage artifact:**

```yaml
- name: Upload coverage
  uses: actions/upload-artifact@v4
  with:
    name: coverage
    path: coverage/
```

3. **Add badge to README:**

```markdown
![Coverage](coverage-badge.svg)
```

**Pros:** Self-hosted, automatic updates
**Cons:** More complex setup, requires workflow configuration

## Option 4: Shields.io Dynamic Badge with JSON Endpoint

Create a simple JSON endpoint that serves coverage data, then use shields.io to display it.

### Setup:

1. **Create a GitHub Pages site or API endpoint** that serves coverage data
2. **Use shields.io endpoint badge:**

```markdown
![Coverage](https://img.shields.io/endpoint?url=https://your-domain.com/coverage.json)
```

**Pros:** Customizable, can serve from your own domain
**Cons:** Requires hosting an endpoint

## Option 5: Coverage Summary Table (Manual)

Add a coverage summary table that you update periodically.

### Add to README:

```markdown
## Test Coverage

| Category | Coverage |
|----------|----------|
| Lines | 85% |
| Functions | 82% |
| Branches | 78% |
| Statements | 85% |

*Last updated: [Date]*
```

**Pros:** Detailed breakdown, no external dependencies
**Cons:** Manual updates required

## Recommended Approach

For this project, I recommend **Option 2 (Codecov)** because:
- ✅ Automatic updates after each CI run
- ✅ Historical tracking of coverage trends
- ✅ Detailed reports and file-by-file breakdown
- ✅ Free for public repositories
- ✅ Easy to set up (just add the token)

## Quick Start with Codecov

1. Visit https://codecov.io and sign in with GitHub
2. Add your repository
3. Copy the upload token
4. Add it as `CODECOV_TOKEN` in GitHub Secrets
5. The CI workflow is already configured to upload coverage
6. Add this badge to your README:

```markdown
[![codecov](https://codecov.io/gh/mbsoft/family_bowl/branch/main/graph/badge.svg)](https://codecov.io/gh/mbsoft/family_bowl)
```

The badge will automatically update after each CI run!

## Current Coverage

After running `npm run test:coverage`, you can see:
- Overall coverage: ~13% (only utility functions tested so far)
- Utils coverage: ~92% (well tested!)
- Components, lib, hooks: 0% (not yet tested)

To improve coverage, add tests for:
- React components (using React Testing Library)
- Library functions (auth, storage, etc.)
- Custom hooks
