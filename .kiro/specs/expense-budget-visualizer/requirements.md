# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly, single-page web application that allows students to track their daily spending. The application is built with plain HTML, CSS, and Vanilla JavaScript — no frameworks or backend server. All data is persisted in the browser's Local Storage. A pie chart powered by Chart.js (via CDN) provides a visual breakdown of spending by category. The app must be deployable on GitHub Pages and must function correctly in modern Chrome, Firefox, Edge, and Safari.

File structure:
- `index.html` — application entry point
- `css/style.css` — all styles
- `js/app.js` — all application logic

---

## Glossary

- **App**: The Expense & Budget Visualizer single-page web application.
- **Transaction**: A single spending record containing an ID, item name, amount, category, and timestamp.
- **Transaction_List**: The on-screen scrollable list that displays all saved Transactions.
- **Input_Form**: The HTML form used to submit a new Transaction.
- **Category**: A label grouping Transactions by spending type (e.g., Food, Transport, Fun).
- **Category_Manager**: The part of the App responsible for storing, providing, and extending the list of Categories.
- **Balance_Display**: The UI element that shows the sum of all Transaction amounts.
- **Chart**: The Chart.js pie chart that visualises spending distribution by Category.
- **Storage**: The browser's `localStorage` API used to persist Transaction data and Category data across sessions.
- **Validator**: The App module responsible for checking Input_Form field values before a Transaction is created.
- **Sort_Control**: The UI control that allows the user to reorder the Transaction_List.
- **Theme_Toggle**: The UI control that switches the App between light and dark display modes.

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a student, I want to enter an item name, amount, and category for a purchase, so that I can record my daily spending quickly.

#### Acceptance Criteria

1. THE Input_Form SHALL contain a text field for item name accepting up to 100 characters, a numeric field for amount, and a dropdown selector for category.
2. THE Input_Form SHALL populate the category dropdown with at minimum the categories: Food, Transport, and Fun on initial load.
3. WHEN the user submits the Input_Form with all fields populated with valid values, THE App SHALL create a new Transaction with the entered item name, amount, and selected category, and add it to the Transaction_List.
4. WHEN the user submits the Input_Form with one or more empty fields, THE Validator SHALL display an inline error message adjacent to each empty field and SHALL NOT create a Transaction.
5. WHEN the user submits the Input_Form with an amount value that is not a positive number in the range 0.01 to 999,999,999.99, THE Validator SHALL display an inline error message on the amount field and SHALL NOT create a Transaction.
6. WHEN the user submits the Input_Form successfully, THE Input_Form SHALL reset the item name field to empty, the amount field to empty, and the category dropdown to its default placeholder state.
7. IF the category dropdown contains no selectable options, THEN THE Input_Form SHALL display a message instructing the user to add a category before submitting and SHALL disable the submit button.

---

### Requirement 2: Transaction List

**User Story:** As a student, I want to see all my recorded transactions in a scrollable list, so that I can review my spending history at a glance.

#### Acceptance Criteria

1. WHEN the App initialises, THE Transaction_List SHALL display every Transaction stored in Storage in chronological order (most recent first).
2. WHEN a new Transaction is created, THE Transaction_List SHALL immediately render the new Transaction at the top of the list without requiring a page reload.
3. THE Transaction_List SHALL display each Transaction's item name (truncated to 50 characters with an ellipsis if longer), amount (prefixed with a currency symbol and formatted with two decimal places), and category.
4. WHEN the Transaction_List contains more items than fit in its visible area, THE Transaction_List SHALL scroll vertically to reveal remaining items.
5. THE Transaction_List SHALL display a Delete button for each Transaction entry.
6. WHEN the user activates the Delete button for a Transaction, THE App SHALL remove that Transaction from the Transaction_List and update the `ebv_transactions` Storage key to reflect the deletion.
7. WHEN a Transaction is deleted, THE App SHALL recalculate the Balance_Display and refresh the Chart to reflect the updated Transaction data.
8. IF Storage contains no Transactions, THEN THE Transaction_List SHALL display a placeholder message indicating that no transactions have been recorded.

---

### Requirement 3: Total Balance Display

**User Story:** As a student, I want to see my total spending at the top of the page, so that I always know how much I have spent.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all Transaction amounts formatted as currency with two decimal places, where the displayed value equals the arithmetic sum of all Transaction amounts rounded to two decimal places using half-up rounding.
2. WHEN a Transaction is added, THE Balance_Display SHALL update to reflect the new total before the next user interaction is accepted.
3. WHEN a Transaction is deleted, THE Balance_Display SHALL update to reflect the new total before the next user interaction is accepted.
4. WHILE Storage contains zero Transactions, THE Balance_Display SHALL display a total of 0.00.
5. IF the sum of all Transaction amounts is negative, THEN THE Balance_Display SHALL display the value preceded by a minus sign with two decimal places.

---

### Requirement 4: Pie Chart Visualisation

**User Story:** As a student, I want to see a pie chart of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL render a pie chart that groups Transaction amounts by Category, where each slice represents one Category's total amount as a proportion of all Transaction amounts.
2. THE Chart SHALL be rendered using the Chart.js library loaded via CDN.
3. WHEN a Transaction is added, THE Chart SHALL update to reflect the new spending distribution within 1 second of the operation completing.
4. WHEN a Transaction is deleted, THE Chart SHALL update to reflect the new spending distribution within 1 second of the operation completing.
5. THE Chart SHALL assign a unique colour to each Category slice such that no two slices in the chart share the same colour.
6. THE Chart SHALL display a legend that maps each colour to its Category label, with the legend remaining visible and fully readable for up to 10 Category entries.
7. WHILE Storage contains zero Transactions, THE Chart SHALL display no slices and a non-empty text message indicating there is no data to visualise.
8. IF a Category has no remaining Transactions after a deletion, THEN THE Chart SHALL remove that Category's slice and its corresponding legend entry from the pie chart.

---

### Requirement 5: Local Storage Persistence

**User Story:** As a student, I want my transactions to be saved between browser sessions, so that I do not lose my spending history when I close the tab.

#### Acceptance Criteria

1. WHEN a Transaction is created, THE App SHALL serialise the Transaction as JSON and write it to the Storage key `ebv_transactions`.
2. WHEN a Transaction is deleted, THE App SHALL update the `ebv_transactions` Storage key to reflect the deletion within 500 milliseconds of the deletion event.
3. WHEN the App initialises, THE App SHALL read the `ebv_transactions` Storage key and deserialise its contents to restore the Transaction_List, Balance_Display, and Chart within 1000 milliseconds.
4. IF the `ebv_transactions` Storage key contains malformed JSON, THEN THE App SHALL clear that Storage key and initialise with an empty Transaction_List, displaying an error message indicating that saved data could not be loaded.
5. THE App SHALL store each Transaction with the following fields: `id` (string UUID), `name` (string, 1–100 characters), `amount` (number, 0.01 to 999,999,999.99), `category` (string, 1–50 characters), `timestamp` (ISO 8601 date-time string).
6. WHEN custom categories are saved, THE App SHALL persist the custom category list in the Storage key `ebv_categories` as a JSON array of strings, containing no more than 50 entries each with a maximum length of 50 characters.
7. IF the Storage write operation fails (e.g. storage quota exceeded or access denied), THEN THE App SHALL display an error message indicating that the Transaction could not be saved and retain the Transaction in the current session's Transaction_List without writing to Storage.
8. IF the `ebv_transactions` Storage key is absent or empty when the App initialises, THEN THE App SHALL initialise with an empty Transaction_List without displaying an error.

---

### Requirement 6: Custom Categories (Optional Feature)

**User Story:** As a student, I want to add my own spending categories, so that I can tailor the app to my personal budget.

#### Acceptance Criteria

1. WHERE the custom categories feature is available, THE Category_Manager SHALL provide a UI control to add a new category by entering a custom label.
2. WHEN the user submits a new category label that is non-empty, does not exceed 50 characters, contains only alphanumeric characters and spaces, and does not duplicate an existing category (case-insensitive), THE Category_Manager SHALL add the label to the category dropdown and persist it to Storage, with a maximum of 20 custom categories stored.
3. WHEN the user submits a category label that is empty, exceeds 50 characters, contains invalid characters, or duplicates an existing category, THE Validator SHALL display an inline error message on the category input field indicating the specific reason the label was rejected.
4. WHEN the App initialises, THE Category_Manager SHALL merge the default categories (Food, Transport, Fun) with any custom categories retrieved from the `ebv_categories` Storage key; IF the `ebv_categories` key is absent or cannot be read, THEN THE Category_Manager SHALL initialise with only the default categories without displaying an error.
5. WHERE the custom categories feature is available, WHEN the user requests deletion of a custom category that is not referenced by any existing Transaction, THE Category_Manager SHALL remove that category from the dropdown and update the `ebv_categories` Storage key.
6. IF the user attempts to delete a custom category that is referenced by one or more Transactions, THEN THE Category_Manager SHALL display an error message stating that the category is in use and cannot be deleted, and the category and its referencing Transactions SHALL remain unchanged.

---

### Requirement 7: Transaction Sorting (Optional Feature)

**User Story:** As a student, I want to sort my transactions by amount or category, so that I can find and review specific spending patterns easily.

#### Acceptance Criteria

1. WHERE the sort feature is available, THE Sort_Control SHALL offer the following sort options: Amount (ascending), Amount (descending), Category (A–Z), and Category (Z–A).
2. WHEN the user selects a sort option, THE Transaction_List SHALL re-render all Transactions in the selected order within 500 milliseconds of the selection.
3. WHEN a new Transaction is added while a sort option is active, THE Transaction_List SHALL insert the new Transaction in the correct position according to the active sort order, with ties broken by most recent timestamp first.
4. WHEN the page loads, THE Sort_Control SHALL have no sort option selected, and THE Transaction_List SHALL display Transactions in chronological order (most recent first).

---

### Requirement 8: Dark / Light Mode Toggle (Optional Feature)

**User Story:** As a student, I want to switch between light and dark display modes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHERE the theme toggle is available, THE Theme_Toggle SHALL switch the App between a light colour scheme and a dark colour scheme.
2. WHERE the theme toggle is available, WHEN the user activates the Theme_Toggle, THE App SHALL apply the selected theme to all visible UI elements within 100 milliseconds of activation.
3. WHERE the theme toggle is available, WHEN the user activates the Theme_Toggle, THE App SHALL persist the selected theme preference in the Storage key `ebv_theme` with a value of either `"light"` or `"dark"`.
4. WHEN the App initialises, THE App SHALL read the `ebv_theme` Storage key and apply the stored theme preference; IF no stored preference exists or the stored value is not `"light"` or `"dark"`, THEN THE App SHALL apply the light theme by default.
5. WHERE the theme toggle is available, THE Theme_Toggle SHALL display a visible label or icon that reflects the currently active theme, updating within 100 milliseconds of any theme change.
6. IF the Storage key `ebv_theme` cannot be read or written, THEN THE App SHALL continue operating with the current in-session theme without displaying an error to the user.

---

### Requirement 9: Responsive Design

**User Story:** As a student, I want the app to look and work well on both my phone and my laptop, so that I can use it anywhere.

#### Acceptance Criteria

1. THE App SHALL render a fully usable layout on viewport widths from 320 px to 2560 px without horizontal scrolling, where "fully usable" means all interactive elements are reachable, no content is clipped or hidden, and all primary actions (add transaction, view balance, view chart) are accessible without horizontal scrolling.
2. WHILE the viewport width is less than 768 px, THE App SHALL display the Input_Form, Balance_Display, Transaction_List, and Chart stacked vertically in a single-column layout in that top-to-bottom order.
3. WHILE the viewport width is 768 px or greater, THE App SHALL arrange the Input_Form and Chart side by side in a two-column layout, with the Balance_Display placed above the Transaction_List and both occupying the remaining horizontal space outside the Input_Form and Chart columns.
4. THE App SHALL use relative units (rem, %, vw/vh) for font sizes and layout dimensions so that the interface scales correctly when browser zoom is set to any level from 100% to 200%, without content overflow or horizontal scrolling.
5. THE App SHALL ensure all interactive elements (buttons, inputs, dropdowns) have a minimum touch target size of 44 × 44 CSS pixels, where the target area includes any padding applied to the element.
6. THE App SHALL meet WCAG 2.1 AA colour contrast requirements (minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text and UI components) for all text and interactive elements in both light and dark themes.
7. WHEN the viewport width transitions across the 768 px breakpoint (in either direction), THE App SHALL switch between the single-column and two-column layouts without requiring a page reload.

---

### Requirement 10: Browser Compatibility

**User Story:** As a student, I want the app to work in any modern browser, so that I can use it regardless of which browser I have installed.

#### Acceptance Criteria

1. THE App SHALL function correctly in the latest stable releases of Chrome, Firefox, Edge, and Safari at the time of deployment, where "function correctly" means all acceptance criteria in this document pass without errors or visual defects in those browsers.
2. THE App SHALL use only Web APIs that are available without polyfills in the latest stable releases of Chrome, Firefox, Edge, and Safari.
3. IF the browser does not support `localStorage`, THEN THE App SHALL display a warning message visible within the main viewport before any user interaction, stating that data persistence is unavailable and the app may not function correctly.
4. THE App SHALL render without overlapping elements, clipped text, or missing interactive controls in all four target browsers at viewport widths from 320 px to 2560 px.

---

### Requirement 11: Static Deployment

**User Story:** As a student, I want to deploy the app to GitHub Pages with no server-side setup, so that I can share it as a public URL.

#### Acceptance Criteria

1. THE App SHALL consist solely of static files (HTML, CSS, and JavaScript) with no server-side runtime dependencies.
2. THE App SHALL load all external resources (Chart.js) via HTTPS CDN URLs so that no local build step is required.
3. THE App SHALL function correctly when served from a subdirectory path (e.g., `https://username.github.io/repo-name/`) without requiring path configuration changes.
4. THE App SHALL fully load and become interactive within 10 seconds on a standard broadband connection of 10 Mbps or higher.
5. IF any external CDN resource fails to load, THEN THE App SHALL display a visible error message indicating which feature is unavailable (e.g., "Chart could not be loaded") and continue to function for all non-chart features.
