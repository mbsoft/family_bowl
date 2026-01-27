# Test Coverage Improvement Strategy

**Current Coverage: 31%** | **Target: 60%+**

## Current Status Breakdown

| Category | Coverage | Lines of Code | Priority |
|----------|----------|--------------|----------|
| **Utils** | 92% ✅ | ~200 | Low (well tested) |
| **Lib** | 0% | ~800 | **HIGH** (business logic) |
| **Hooks** | 0% | ~65 | **MEDIUM** (reusable logic) |
| **Components** | 0% | ~400 | **MEDIUM** (UI components) |

## Recommended Approach (Priority Order)

### ✅ Phase 1: Test Pure Utility Functions (Quick Wins) 
**Target: +15-20% coverage | Effort: 2-3 hours**

**Status: IN PROGRESS** - Example tests created

1. **`src/lib/auth.js`** ✅ **DONE** - 24 tests created
   - Authentication utilities
   - localStorage operations
   - Credential validation
   - **Coverage gain: ~8-10%**

2. **`src/lib/export.js`** ⚠️ **PARTIAL** - Tests created but need XLSX mock fixes
   - Excel export logic
   - Data transformation
   - Error handling
   - **Coverage gain: ~3-5%**

**Next steps:**
- Fix XLSX mocking in export.test.js (or skip complex XLSX tests for now)
- Focus on testing error cases and validation logic

### 🎯 Phase 2: Test Custom Hooks (Medium Complexity)
**Target: +5-10% coverage | Effort: 1-2 hours**

**Status: IN PROGRESS** - Example tests created

3. **`src/hooks/useDialog.js`** ✅ **DONE** - 11 tests created
   - Dialog state management
   - Alert state management
   - **Coverage gain: ~3-5%**

### 🎯 Phase 3: Test React Components (Higher Complexity)
**Target: +10-15% coverage | Effort: 4-6 hours**

**Status: IN PROGRESS** - Example tests created

4. **`src/components/SuperBowlLogo.jsx`** ⚠️ **PARTIAL** - 9/13 tests passing
   - Simple presentational component
   - Props validation
   - Rendering logic
   - **Coverage gain: ~2-3%**

5. **`src/components/Alert.js`** - Not started
   - Alert visibility states
   - Close functionality
   - Type variations
   - **Coverage gain: ~2-3%**

6. **`src/components/Footer.js`** - Not started
   - Simple footer component
   - **Coverage gain: ~1%**

7. **`src/components/BetInput.js`** - Not started
   - Form input component
   - Different bet types
   - Validation logic
   - **Coverage gain: ~5-7%**

### ⚠️ Phase 4: Test Library Functions with Mocks (Complex)
**Target: +5-10% coverage | Effort: 3-4 hours**

8. **`src/lib/storage.js`** - Not started
   - Database API wrappers
   - Mock fetch calls
   - Error handling
   - **Coverage gain: ~8-12%**

9. **`src/lib/db.js`** - Not started
   - Database initialization
   - Schema creation
   - **Coverage gain: ~2-3%**

## Quick Wins Strategy

### Immediate Actions (Next 1-2 hours):

1. **Fix existing test issues:**
   - Fix XLSX mocking in `export.test.js` (or simplify to test error cases only)
   - Fix remaining SuperBowlLogo test assertions

2. **Add simple component tests:**
   - `Alert.js` - Test rendering and visibility
   - `Footer.js` - Test basic rendering

3. **Add storage.js tests (partial):**
   - Test error handling paths
   - Test data transformation functions
   - Skip complex API mocking for now

### Expected Results:
- **Current:** 31% coverage
- **After Phase 1 fixes:** ~40% coverage
- **After Phase 2:** ~45% coverage  
- **After Phase 3 (simple components):** ~50% coverage
- **After Phase 4 (partial):** ~55-60% coverage

## Testing Best Practices

### 1. Start with Error Cases
Error handling is often untested but critical:
```javascript
it('should return error when no submissions exist', () => {
  getAllSubmissions.mockReturnValue([]);
  const result = exportSubmissionsToXLSX();
  expect(result.success).toBe(false);
});
```

### 2. Test Edge Cases
- Null/undefined inputs
- Empty arrays/objects
- Boundary values
- Invalid data formats

### 3. Mock External Dependencies
- API calls (fetch)
- localStorage (already mocked in setup)
- Third-party libraries (XLSX, etc.)

### 4. Test Behavior, Not Implementation
✅ Good: "Should return error when no submissions"  
❌ Bad: "Should call getAllSubmissions once"

## Example Test Patterns

### Testing Pure Functions (Easiest)
```javascript
describe('functionName', () => {
  it('should handle valid input', () => {
    expect(functionName(validInput)).toBe(expectedOutput);
  });
  
  it('should handle invalid input', () => {
    expect(functionName(null)).toBeNull();
  });
});
```

### Testing Hooks
```javascript
describe('useCustomHook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCustomHook());
    expect(result.current.state).toBe(defaultValue);
  });
});
```

### Testing Components
```javascript
describe('Component', () => {
  it('should render with props', () => {
    const { container } = render(<Component prop="value" />);
    expect(container.querySelector('.class')).toBeTruthy();
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/lib/__tests__/auth.test.js

# Run with coverage
npm run test:coverage

# Run in watch mode (recommended while writing)
npm test
```

## Coverage Goals

- **Week 1:** 40-45% (Fix existing tests + add simple tests)
- **Week 2:** 50-55% (Add component tests)
- **Week 3:** 60%+ (Meet threshold, add storage tests)

## Files Created

Example test files are provided to get you started:

1. ✅ `src/lib/__tests__/auth.test.js` - 24 tests (working)
2. ⚠️ `src/lib/__tests__/export.test.js` - 6 tests (needs XLSX mock fixes)
3. ✅ `src/hooks/__tests__/useDialog.test.js` - 11 tests (working)
4. ⚠️ `src/components/__tests__/SuperBowlLogo.test.jsx` - 13 tests (9 passing)

## Next Steps

1. **Fix existing test issues** (30 min)
   - Simplify export.test.js to focus on error cases
   - Fix SuperBowlLogo test assertions

2. **Add Alert.js tests** (30 min)
   - Test rendering
   - Test visibility states
   - Test close functionality

3. **Add Footer.js tests** (15 min)
   - Simple rendering test

4. **Add partial storage.js tests** (1-2 hours)
   - Test error handling
   - Test data transformation
   - Skip complex API mocking initially

This should get you to **~45-50% coverage** quickly!
