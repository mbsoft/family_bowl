# Best Approach for Improving Test Coverage (31% → 60%+)

## Current Status
- **Overall Coverage:** 31%
- **Utils:** 92% ✅ (well tested)
- **Lib:** 0% (needs testing)
- **Hooks:** 0% (needs testing)  
- **Components:** 0% (needs testing)

## Recommended Priority Order

### ✅ Phase 1: Pure Utility Functions (EASIEST - Start Here!)
**Target: +15-20% coverage | Effort: 2-3 hours**

These are the easiest to test - no mocking, no React, just pure functions:

1. **`src/lib/auth.js`** ✅ **DONE** - 24 tests created
   - `validateCredentials()` - Pure function
   - `login()`, `logout()` - Simple localStorage operations
   - `isAuthenticated()`, `isAdmin()`, `getCurrentUser()` - Simple getters

2. **`src/lib/export.js`** ⚠️ **PARTIAL** - XLSX mocking is complex
   - Skip complex XLSX tests for now
   - Test error cases (no submissions, no bets) ✅
   - Focus on other lib files first

**Coverage Gain:** ~10-15% from auth.js alone

### ✅ Phase 2: Custom Hooks (MEDIUM)
**Target: +5-10% coverage | Effort: 1-2 hours**

3. **`src/hooks/useDialog.js`** ✅ **DONE** - 11 tests created
   - Test state management
   - Test showDialog/hideDialog functions

**Coverage Gain:** ~3-5%

### ✅ Phase 3: Simple Components (MEDIUM)
**Target: +5-10% coverage | Effort: 2-3 hours**

4. **`src/components/SuperBowlLogo.jsx`** ✅ **MOSTLY DONE** - 12/13 tests passing
   - Simple presentational component
   - Test rendering with different props
   - Test edge cases

5. **`src/components/Alert.js`** - Next target
   - Test rendering
   - Test visibility states
   - Test close functionality

6. **`src/components/Footer.js`** - Simple footer
   - Basic rendering test

**Coverage Gain:** ~5-10%

### ⚠️ Phase 4: Complex Components (HARDER)
**Target: +5-10% coverage | Effort: 3-4 hours**

7. **`src/components/BetInput.js`** - Form input component
   - Test different bet types
   - Test validation logic
   - Test onChange handlers

8. **`src/components/AlertDialog.js`** - Dialog component
   - Test open/close states
   - Test button interactions

**Coverage Gain:** ~5-10%

### ⚠️ Phase 5: Library Functions with Mocks (COMPLEX)
**Target: +5-10% coverage | Effort: 4-6 hours**

9. **`src/lib/storage.js`** - Database API wrappers
   - Mock fetch calls
   - Test error handling
   - Test data transformation

10. **`src/lib/db.js`** - Database initialization
    - Mock database client
    - Test schema creation

**Coverage Gain:** ~5-10%

## Quick Wins Summary

### Already Completed ✅
- ✅ `src/lib/auth.js` - 24 tests (should give ~10% coverage)
- ✅ `src/hooks/useDialog.js` - 11 tests (should give ~3% coverage)
- ✅ `src/components/SuperBowlLogo.jsx` - 12 tests (should give ~2% coverage)

**Estimated current coverage after fixes:** ~46-50%

### Next Steps (In Order)

1. **Fix remaining test issues** (5 minutes)
   - Fix XLSX mock in export.test.js (or skip complex tests)
   - Fix SuperBowlLogo test assertions

2. **Add Alert.js tests** (30 minutes)
   - Simple component, easy to test
   - Should add ~2-3% coverage

3. **Add Footer.js tests** (15 minutes)
   - Very simple component
   - Should add ~1% coverage

4. **Add BetInput.js tests** (1-2 hours)
   - More complex but important component
   - Should add ~3-5% coverage

## Testing Best Practices

### 1. Start Simple
- Test pure functions first (no dependencies)
- Test simple components before complex ones
- Test error cases and edge cases

### 2. Mock Strategically
- Mock external APIs (fetch, database)
- Mock browser APIs (localStorage, window)
- Don't over-mock - test real behavior when possible

### 3. Test Behavior, Not Implementation
✅ Good: "Should return true when user is admin"  
❌ Bad: "Should call localStorage.getItem with 'auth_user'"

### 4. Use Descriptive Test Names
```javascript
it('should return null for years before 1967', () => {
  // test code
});
```

### 5. Test Edge Cases
- Null/undefined inputs
- Empty arrays/objects
- Boundary values
- Error conditions

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/lib/__tests__/auth.test.js

# Run tests in watch mode (recommended while writing)
npm test
```

## Coverage Goals

- **Current:** 31%
- **After Phase 1-3:** ~50-55% (with current tests)
- **Target:** 60% (meet threshold)
- **Stretch:** 75%+ (excellent coverage)

## What NOT to Test (Low Priority)

- Next.js app router pages (use E2E tests instead)
- Configuration files
- Simple getters/setters without logic
- Third-party library code
- Complex XLSX operations (skip for now)

## Tips for Faster Coverage Gains

1. **Focus on Phase 1** - Pure functions give quick wins
2. **Test one file at a time** - Complete one module before moving on
3. **Use coverage report** - See exactly which lines need tests
4. **Run tests frequently** - Catch issues early
5. **Write tests as you code** - Don't wait until the end

## Example: Adding Tests for Alert.js

```javascript
// src/components/__tests__/Alert.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Alert from '../Alert';

describe('Alert component', () => {
  it('should not render when isOpen is false', () => {
    const { container } = render(
      <Alert isOpen={false} onClose={vi.fn()} message="Test" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render message when open', () => {
    render(<Alert isOpen={true} onClose={vi.fn()} message="Test message" />);
    expect(screen.getByText('Test message')).toBeTruthy();
  });

  // Add more tests...
});
```

## Next Actions

1. ✅ Fix remaining test failures (export.test.js, SuperBowlLogo.test.jsx)
2. ✅ Add Alert.js tests
3. ✅ Add Footer.js tests
4. ✅ Add BetInput.js tests
5. ✅ Re-run coverage to see progress

After completing these, you should be at **50-60% coverage**!
