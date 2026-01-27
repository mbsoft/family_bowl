# Vitest Testing Setup

This project uses [Vitest](https://vitest.dev/) as the testing framework for unit and integration tests.

## Installation

The required dependencies are already installed. If you need to reinstall:

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/user-event @vitest/coverage-v8 @vitest/ui
```

## Running Tests

### Run tests in watch mode (development)
```bash
npm test
```

### Run tests once
```bash
npm test -- --run
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

This will generate coverage reports in the `coverage/` directory:
- `coverage/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format (for CI/CD)
- `coverage/coverage-summary.json` - JSON summary

## Test Coverage

### Current Coverage Thresholds

The project has minimum coverage thresholds set in `vitest.config.mjs`:
- Lines: 60%
- Functions: 60%
- Branches: 60%
- Statements: 60%

### Generating Coverage Badge

After running coverage, generate a badge for the README:

```bash
npm run coverage:badge
```

This will output a shields.io badge URL that you can add to your README.

### Displaying Coverage in README

#### Option 1: Static Badge (Manual Update)

Add a coverage badge to your README using shields.io:

```markdown
[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)](https://github.com/your-org/family_bowl)
```

Update the percentage manually after each coverage run.

#### Option 2: Dynamic Badge with Codecov (Recommended)

1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. Get your Codecov token
4. Add it as a GitHub secret: `CODECOV_TOKEN`
5. The CI workflow will automatically upload coverage
6. Add the badge to README:

```markdown
[![codecov](https://codecov.io/gh/mbsoft/family_bowl/branch/main/graph/badge.svg)](https://codecov.io/gh/mbsoft/family_bowl)
```

#### Option 3: GitHub Actions Badge

You can also create a custom badge that reads from coverage artifacts:

```markdown
![Coverage](https://github.com/mbsoft/family_bowl/workflows/Test/badge.svg?label=coverage)
```

## Writing Tests

### Test File Location

Place test files next to the code they test:
- `src/utils/constants.js` → `src/utils/__tests__/constants.test.js`
- `src/utils/superbowlLogos.js` → `src/utils/__tests__/superbowlLogos.test.js`

Or use the `.test.js` or `.spec.js` suffix:
- `src/utils/constants.test.js`

### Example Test

```javascript
import { describe, it, expect } from 'vitest';
import { toRomanNumeral } from '../superbowlLogos';

describe('toRomanNumeral', () => {
  it('should convert 1 to I', () => {
    expect(toRomanNumeral(1)).toBe('I');
  });
});
```

### Testing React Components

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- Push to `main` branch
- Pull requests to `main` branch

The CI workflow:
1. Runs linting
2. Builds the application
3. Runs tests with coverage
4. Uploads coverage to Codecov (if configured)

## Coverage Exclusions

The following are excluded from coverage:
- Next.js app router pages (test with E2E instead)
- Configuration files
- Test files themselves
- Scripts directory
- Node modules

See `vitest.config.mjs` for the full exclusion list.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Vitest with Next.js Guide](https://nextjs.org/docs/app/guides/testing/vitest)
