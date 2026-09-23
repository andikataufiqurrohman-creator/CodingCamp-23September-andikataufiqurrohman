# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement a zero-dependency single-page web application for tracking daily student spending. The app is built with plain HTML, CSS, and Vanilla JavaScript, using Chart.js (CDN) for the pie chart, and persists all data in `localStorage`. The implementation follows the MVC-lite / event-driven architecture defined in the design, with ten service namespaces inside `js/app.js`. Tests use Vitest + fast-check running in Node + jsdom.

---

## Tasks

- [x] 1. Set up project structure and testing scaffolding
  - Create `index.html`, `css/style.css`, `js/app.js`, and `tests/` directory tree (`tests/unit/`, `tests/property/`)
  - Initialise `package.json` with `vitest`, `@vitest/coverage-v8`, `jsdom`, and `fast-check` as dev-dependencies
  - Create `vitest.config.js` targeting `jsdom` environment
  - Define the `Transaction`, `CategoryStore`, `StorageLayout`, `ChartData`, and `SortOption` type comments / JSDoc shapes in `js/app.js` header
  - _Requirements: 1.1, 5.5, 11.1_

- [x] 2. Implement `StorageService` and `Validator`
  - [x] 2.1 Implement `StorageService` (`read`, `write`, `remove`) with `try/catch` guards
    - Handle `localStorage` unavailability, `JSON.parse` errors, and quota-exceeded write failures
    - Return `null` on read failure, `boolean` on write
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.7, 10.3_

  - [x] 2.2 Write unit tests for `StorageService`
    - Mock `localStorage`; test read/write/remove happy paths and all error branches
    - _Requirements: 5.1, 5.4, 5.7_

  - [x] 2.3 Implement `Validator` (`validateName`, `validateAmount`, `validateCategory`, `validateCategoryLabel`, `validateForm`)
    - `validateName`: non-empty, ≤ 100 chars; `validateAmount`: 0.01–999,999,999.99; `validateCategory`: non-empty; `validateCategoryLabel`: non-empty, ≤ 50 chars, alphanumeric + spaces, case-insensitive uniqueness
    - Return error string on failure, `null` on success
    - _Requirements: 1.4, 1.5, 6.3_

  - [x] 2.4 Write unit tests for `Validator`
    - Cover each field's specific error messages for every invalid input class; confirm `null` on valid inputs
    - _Requirements: 1.4, 1.5, 6.3_

  - [x] 2.5 Write property test for invalid inputs always rejected (Property 2)
    - **Property 2: Invalid inputs are always rejected**
    - **Validates: Requirements 1.4, 1.5**
    - `// Feature: expense-budget-visualizer, Property 2: Invalid inputs are always rejected`
    - _File: `tests/property/transactions.property.test.js`_

- [ ] 3. Implement `TransactionService` and `BalanceService`
  - [x] 3.1 Implement `TransactionService` (`init`, `getAll`, `add`, `remove`, `getCategoryTotals`)
    - `add` generates UUID v4 and ISO 8601 timestamp; `getCategoryTotals` sums amounts per category
    - _Requirements: 1.3, 2.1, 2.6, 5.1, 5.2, 5.5_

  - [ ] 3.2 Write unit tests for `TransactionService`
    - Test initial state, add, remove, `getCategoryTotals` with fixed dataset
    - _Requirements: 1.3, 2.6_

  - [ ] 3.3 Write property test for valid form submission always creates a transaction (Property 1)
    - **Property 1: Valid form submission always creates a transaction**
    - **Validates: Requirements 1.3**
    - `// Feature: expense-budget-visualizer, Property 1: Valid form submission always creates a transaction`
    - _File: `tests/property/transactions.property.test.js`_

  - [ ] 3.4 Write property test for transaction list init restores storage order (Property 4)
    - **Property 4: Transaction list init restores storage order**
    - **Validates: Requirements 2.1**
    - `// Feature: expense-budget-visualizer, Property 4: Transaction list init restores storage order`
    - _File: `tests/property/transactions.property.test.js`_

  - [ ] 3.5 Write property test for newly added transaction appears at the top (Property 5)
    - **Property 5: Newly added transaction appears at the top**
    - **Validates: Requirements 2.2**
    - `// Feature: expense-budget-visualizer, Property 5: Newly added transaction appears at the top`
    - _File: `tests/property/transactions.property.test.js`_

  - [ ] 3.6 Write property test for deletion removes transaction from list and storage (Property 7)
    - **Property 7: Deletion removes transaction from list and storage**
    - **Validates: Requirements 2.6, 5.2**
    - `// Feature: expense-budget-visualizer, Property 7: Deletion removes transaction from list and storage`
    - _File: `tests/property/transactions.property.test.js`_

  - [ ] 3.7 Write property test for transaction serialisation round-trip (Property 11)
    - **Property 11: Transaction serialisation round-trip preserves data**
    - **Validates: Requirements 5.1, 5.5**
    - `// Feature: expense-budget-visualizer, Property 11: Transaction serialisation round-trip preserves data`
    - _File: `tests/property/transactions.property.test.js`_

  - [x] 3.8 Implement `BalanceService` (`compute`, `format`)
    - `compute` sums amounts with half-up rounding (`Math.round(sum * 100) / 100`); `format` outputs `"Rp X,XXX.XX"` with minus sign for negatives
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.9 Write unit tests for `BalanceService`
    - Cover zero, positive, large, and negative values; test two-decimal rounding
    - _Requirements: 3.1, 3.5_

  - [ ] 3.10 Write property test for balance equals sum of all transaction amounts (Property 8)
    - **Property 8: Balance equals the sum of all transaction amounts**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - `// Feature: expense-budget-visualizer, Property 8: Balance equals the sum of all transaction amounts`
    - _File: `tests/property/transactions.property.test.js`_

- [ ] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement `CategoryService` and `SortService`
  - [ ] 5.1 Implement `CategoryService` (`init`, `getAll`, `getCustom`, `add`, `remove`, `isReferenced`)
    - Default categories `["Food", "Transport", "Fun"]` always present; max 20 custom entries; `add` rejects duplicates case-insensitively; `remove` blocks deletion if referenced by a transaction
    - _Requirements: 1.2, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 5.2 Write unit tests for `CategoryService`
    - Test default merge, add (valid/invalid), remove (unreferenced/referenced)
    - _Requirements: 6.2, 6.3, 6.4, 6.6_

  - [ ] 5.3 Write property test for category init merges defaults and custom storage (Property 12)
    - **Property 12: Category init merges defaults and custom storage**
    - **Validates: Requirements 6.4**
    - `// Feature: expense-budget-visualizer, Property 12: Category init merges defaults and custom storage`
    - _File: `tests/property/categories.property.test.js`_

  - [ ] 5.4 Write property test for valid custom category addition persists (Property 13)
    - **Property 13: Valid custom category addition persists**
    - **Validates: Requirements 6.2**
    - `// Feature: expense-budget-visualizer, Property 13: Valid custom category addition persists`
    - _File: `tests/property/categories.property.test.js`_

  - [ ] 5.5 Write property test for invalid custom category labels always rejected (Property 14)
    - **Property 14: Invalid custom category labels are always rejected**
    - **Validates: Requirements 6.3**
    - `// Feature: expense-budget-visualizer, Property 14: Invalid custom category labels are always rejected`
    - _File: `tests/property/categories.property.test.js`_

  - [ ] 5.6 Write property test for referenced categories cannot be deleted (Property 15)
    - **Property 15: Referenced categories cannot be deleted**
    - **Validates: Requirements 6.6**
    - `// Feature: expense-budget-visualizer, Property 15: Referenced categories cannot be deleted`
    - _File: `tests/property/categories.property.test.js`_

  - [ ] 5.7 Implement `SortService` (`sort`)
    - Return a sorted copy (do not mutate the original); sort options: `amount-asc`, `amount-desc`, `category-asc`, `category-desc`, `null` (default: timestamp descending); break ties by `timestamp` descending
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 5.8 Write unit tests for `SortService`
    - Test each of the four named options plus `null`; test tie-breaking by timestamp
    - _Requirements: 7.2, 7.3_

  - [ ] 5.9 Write property test for sort produces a correctly ordered list (Property 16)
    - **Property 16: Sort produces a correctly ordered list**
    - **Validates: Requirements 7.2, 7.3**
    - `// Feature: expense-budget-visualizer, Property 16: Sort produces a correctly ordered list`
    - _File: `tests/property/sort.property.test.js`_

- [ ] 6. Implement `ThemeService` and `ChartService`
  - [ ] 6.1 Implement `ThemeService` (`init`, `apply`, `toggle`, `getCurrent`)
    - Toggle `data-theme="dark"` attribute on `<html>`; persist to `ebv_theme`; default to `"light"` for missing/invalid values; swallow storage errors
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ] 6.2 Write unit tests for `ThemeService`
    - Test CSS attribute toggled on `<html>`, storage written, invalid stored value defaults to light
    - _Requirements: 8.4, 8.6_

  - [ ] 6.3 Write property test for theme persistence round-trip (Property 17)
    - **Property 17: Theme persistence round-trip**
    - **Validates: Requirements 8.3, 8.4**
    - `// Feature: expense-budget-visualizer, Property 17: Theme persistence round-trip`
    - _File: `tests/property/theme.property.test.js`_

  - [ ] 6.4 Implement `ChartService` (`init`, `update`, `assignColours`)
    - `init` creates the Chart.js pie instance on the canvas element; `update` destroys and re-creates (or calls `.update()`) with new `categoryTotals`; `assignColours` returns a deterministic palette of ≥ 20 distinct hex values, falling back to evenly-spaced HSL hues beyond 20 categories; detect CDN failure via `typeof Chart === 'undefined'` and show fallback message
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 11.5_

  - [ ] 6.5 Write unit tests for `ChartService`
    - Test `assignColours` returns correct count; every entry is a valid hex string; no two entries are identical
    - _Requirements: 4.5_

  - [ ] 6.6 Write property test for chart colour assignment is always unique (Property 10)
    - **Property 10: Chart colour assignment is always unique**
    - **Validates: Requirements 4.5**
    - `// Feature: expense-budget-visualizer, Property 10: Chart colour assignment is always unique`
    - _File: `tests/property/transactions.property.test.js`_

  - [ ] 6.7 Write property test for chart data groups transactions by category correctly (Property 9)
    - **Property 9: Chart data groups transactions by category correctly**
    - **Validates: Requirements 4.1, 4.8**
    - `// Feature: expense-budget-visualizer, Property 9: Chart data groups transactions by category correctly`
    - _File: `tests/property/transactions.property.test.js`_

- [ ] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Build `UIRenderer` and the HTML/CSS skeleton
  - [ ] 8.1 Author `index.html` — full semantic markup
    - Include: header with balance display and theme toggle; two-column main grid (form + chart column, balance + list column); `Input_Form` with name, amount, category fields and submit button; category manager panel (add / delete); `Sort_Control` `<select>`; transaction list `<ul>` with empty-state placeholder; Chart.js `<canvas>`; Chart.js CDN `<script>` with `onerror` handler; `<script src="js/app.js">`
    - All interactive elements must have labels and `aria-*` attributes for accessibility; minimum 44 × 44 px touch targets enforced via CSS classes
    - _Requirements: 1.1, 1.2, 2.4, 2.5, 2.8, 4.2, 4.6, 6.1, 7.1, 8.1, 8.5, 9.1, 9.5, 10.3, 11.1_

  - [ ] 8.2 Implement `UIRenderer` in `js/app.js`
    - `renderTransactionList(transactions)`: full re-render of `<ul>`, honouring 50-char truncation with ellipsis, currency formatting, delete button per row
    - `prependTransactionRow(tx)`: inserts single row at position 0
    - `removeTransactionRow(id)`: removes DOM node by `data-id`
    - `updateBalanceDisplay(formattedTotal)`: sets balance element text
    - `updateCategoryDropdown(categories)`: rebuilds `<select>` options
    - `showFieldError(fieldEl, message)` / `clearFieldErrors(formEl)`: inline error display
    - `showEmptyState(listEl)` / `showChartEmptyState()`: placeholder messages
    - `resetForm(formEl)`: clears fields and resets dropdown to placeholder
    - `updateSortControl(option)`: reflects active sort in `<select>` value
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 4.7, 6.3, 7.2_

  - [ ] 8.3 Write property test for transaction display format is always correct (Property 6)
    - **Property 6: Transaction display format is always correct**
    - **Validates: Requirements 2.3**
    - `// Feature: expense-budget-visualizer, Property 6: Transaction display format is always correct`
    - _File: `tests/property/transactions.property.test.js`_

  - [ ] 8.4 Write property test for form resets after every successful submission (Property 3)
    - **Property 3: Form resets after every successful submission**
    - **Validates: Requirements 1.6**
    - `// Feature: expense-budget-visualizer, Property 3: Form resets after every successful submission`
    - _File: `tests/property/transactions.property.test.js`_

  - [ ] 8.5 Author `css/style.css` — layout, theming, responsiveness
    - Mobile-first single-column layout; two-column grid at `@media (min-width: 768 px)`; CSS custom properties for light and dark themes keyed on `[data-theme="dark"]` on `<html>`; WCAG 2.1 AA contrast ratios in both themes; relative units (rem, %, vw/vh) throughout; 44 × 44 px minimum touch targets
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 9. Implement `App.init` — bootstrap and event wiring
  - [ ] 9.1 Implement `App.init` in `js/app.js`
    - Detect `localStorage` unavailability and show full-viewport banner before any other init
    - Call each service's `init()` in order: load transactions → `TransactionService.init`; load custom categories → `CategoryService.init`; `UIRenderer.renderTransactionList`; `BalanceService.compute` → `UIRenderer.updateBalanceDisplay`; `ChartService.init(canvasEl)` → `ChartService.update`; `ThemeService.init`
    - Handle malformed JSON in `ebv_transactions`: call `StorageService.remove`, init empty list, render error banner
    - Wire all event listeners: form submit (validate → add transaction → prepend row → update balance → update chart → reset form); delete button clicks (event delegation on list → remove transaction → remove row → update balance → update chart); sort `<select>` change (SortService → re-render list); theme toggle click (ThemeService.toggle → re-render toggle label); add-category form submit (CategoryService.add → update dropdown or show error); delete-category button clicks (CategoryService.remove → update dropdown or show error)
    - Disable submit button and show prompt when no categories exist (Req 1.7)
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.6, 2.7, 3.2, 3.3, 4.3, 4.4, 5.3, 5.4, 5.7, 6.1, 6.2, 6.5, 6.6, 7.2, 7.3, 7.4, 8.2, 8.3, 8.4, 8.6, 10.3, 11.5_

  - [ ] 9.2 Write unit tests for `App.init` edge cases
    - Test: malformed JSON clears storage and renders empty state; missing `ebv_theme` defaults to light; `localStorage` absent triggers visible banner
    - _Requirements: 5.4, 8.4, 10.3_

- [ ] 10. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Integration and GitHub Pages verification
  - [ ] 11.1 Verify static-asset paths and CDN references in `index.html`
    - Confirm all `href` and `src` attributes are relative so the app functions correctly when served from a subdirectory (e.g. `https://username.github.io/repo-name/`)
    - Add Chart.js CDN `<script>` with an `integrity` / `crossorigin` attribute and an `onerror` handler that calls `ChartService` fallback
    - _Requirements: 11.2, 11.3, 11.5_

  - [ ] 11.2 Wire sort into transaction add/delete flows
    - When a new transaction is added while a sort option is active, re-sort the list and insert the row at the correct position (not just prepend); when a transaction is deleted, re-sort the remaining list
    - _Requirements: 7.3_

  - [ ] 11.3 Write integration tests for `App.init` full-flow
    - Use jsdom to simulate form submit → check DOM row added at top, balance updated, chart update called
    - Use jsdom to simulate delete → check DOM row removed, balance updated, chart update called
    - _Requirements: 1.3, 2.2, 2.6, 3.2, 3.3, 4.3, 4.4_

- [ ] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP; they do not affect runtime functionality
- Every property test file must tag each test with a comment: `// Feature: expense-budget-visualizer, Property N: <text>`
- Property-based tests use `fc.assert(fc.property(...))` with a minimum of 100 runs per property
- The production files (`index.html`, `css/style.css`, `js/app.js`) must not import any test or Node.js module
- No build step: the app is served directly from the repository root on GitHub Pages
- `vitest --run` executes the full test suite once without watch mode

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.3"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.5", "3.1", "3.8"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.9", "3.10"] },
    { "id": 4, "tasks": ["5.1", "5.7"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "5.8", "5.9", "6.1", "6.4"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.5", "6.6", "6.7", "8.1"] },
    { "id": 7, "tasks": ["8.2", "8.5"] },
    { "id": 8, "tasks": ["8.3", "8.4", "9.1"] },
    { "id": 9, "tasks": ["9.2", "11.1", "11.2"] },
    { "id": 10, "tasks": ["11.3"] }
  ]
}
```
