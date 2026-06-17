# Test IDs Documentation

This document lists all `data-testid` and `id` attributes added to the application for testing and debugging purposes.

## Layout Components

### Sidebar (`src/components/layout/Sidebar.jsx`)
- `main-sidebar` - Main sidebar container
- `sidebar-header` - Sidebar header section
- `sidebar-toggle-btn` - Burger menu toggle button (desktop)
- `sidebar-brand` - Brand/logo area
- `sidebar-profile` - User profile section
- `profile-avatar` - User avatar
- `profile-name` - User full name
- `profile-role` - User role
- `profile-login` - User login
- `sidebar-nav` - Navigation section
- `nav-section-label` - Navigation section label
- `nav-vacancies` - Vacancies navigation link
- `nav-candidates` - Candidates navigation link
- `nav-recruitment` - Recruitment navigation link
- `nav-analytics` - Analytics navigation link
- `sidebar-support` - Support section

### Topbar (`src/components/layout/Topbar.jsx`)
- `topbar` - Topbar container
- `topbar-left` - Left section of topbar
- `topbar-sidebar-toggle` - Sidebar toggle button (mobile)
- `topbar-breadcrumbs` - Breadcrumbs display
- `topbar-actions` - Right section with actions
- `topbar-search` - Search button
- `topbar-notifications` - Notifications button
- `topbar-user-name` - Current user name
- `topbar-logout` - Logout button

## Pages

### Vacancies Page (`src/pages/Vacancies.jsx`)
- `vacancies-page` - Page container
- `vacancies-header` - Page header
- `vacancies-title` - Page title
- `vacancies-create-btn` - Create vacancy button
- `vacancies-search` - Search input
- `vacancies-list` - Vacancies list container
- `vacancies-counter` - Items counter (e.g., "Showing 1-12 of 150")
- `vacancies-pagination` - Pagination controls
- `vacancy-card-{id}` - Individual vacancy card
- `vacancy-edit-btn-{id}` - Edit button for vacancy
- `vacancy-delete-btn-{id}` - Delete button for vacancy

### Candidates Page (`src/pages/Candidates.jsx`)
- `candidates-page` - Page container
- `candidates-header` - Page header
- `candidates-title` - Page title
- `candidates-create-btn` - Create candidate button
- `candidates-search` - Search input
- `candidates-list` - Candidates list container
- `candidates-counter` - Items counter
- `candidates-pagination` - Pagination controls
- `candidate-card-{id}` - Individual candidate card
- `candidate-edit-btn-{id}` - Edit button for candidate
- `candidate-delete-btn-{id}` - Delete button for candidate

### Vacancy Detail Page (`src/pages/VacancyDetail.jsx`)
- `vacancy-detail-page` - Page container
- `vacancy-detail-header` - Header section
- `vacancy-detail-title` - Vacancy title
- `vacancy-detail-back-btn` - Back button
- `vacancy-detail-edit-btn` - Edit button
- `vacancy-detail-delete-btn` - Delete button
- `vacancy-detail-info` - Information section
- `vacancy-detail-description` - Description
- `vacancy-detail-skills` - Required skills
- `vacancy-detail-applications` - Applications list
- `vacancy-application-card-{id}` - Individual application
- `vacancy-application-status-{id}` - Status badge
- `vacancy-application-actions-{id}` - Action buttons

### Candidate Detail Page (`src/pages/CandidateDetail.jsx`)
- `candidate-detail-page` - Page container
- `candidate-detail-header` - Header section
- `candidate-detail-name` - Candidate name
- `candidate-detail-back-btn` - Back button
- `candidate-detail-edit-btn` - Edit button
- `candidate-detail-delete-btn` - Delete button
- `candidate-detail-info` - Information section
- `candidate-detail-contact` - Contact information
- `candidate-detail-skills` - Skills
- `candidate-detail-resume` - Resume text
- `candidate-detail-applications` - Applications list

### Recruitment Flow Page (`src/pages/RecruitmentFlow.jsx`)
- `recruitment-page` - Page container
- `recruitment-header` - Page header
- `recruitment-flow-list` - Flow steps list
- `recruitment-step-card-{id}` - Individual step card
- `recruitment-add-question-btn` - Add question button
- `recruitment-link-vacancy-btn` - Link vacancy button

### Analytics Page (`src/pages/Analytics.jsx`)
- `analytics-page` - Page container
- `analytics-header` - Page header
- `analytics-metrics` - Metrics cards
- `analytics-chart` - Charts section
- `analytics-report` - Reports section

## Common Components

### Wizard Components
- `wizard-overlay` - Wizard modal overlay
- `wizard-content` - Wizard content area
- `wizard-close-btn` - Close button
- `wizard-next-btn` - Next step button
- `wizard-prev-btn` - Previous step button
- `wizard-submit-btn` - Submit button

### Cards
- `card-{type}` - Generic card with type identifier
- `card-header` - Card header
- `card-body` - Card body
- `card-footer` - Card footer
- `card-actions` - Card actions container

### Forms
- `form-input-{name}` - Form input field
- `form-select-{name}` - Form select dropdown
- `form-textarea-{name}` - Form textarea
- `form-checkbox-{name}` - Form checkbox
- `form-submit-btn` - Form submit button

## Usage Examples

### Testing with React Testing Library
```javascript
// Click on create vacancy button
fireEvent.click(screen.getByTestId('vacancies-create-btn'));

// Search for a vacancy
fireEvent.change(screen.getByTestId('vacancies-search'), { target: { value: 'Developer' } });

// Navigate to candidates
fireEvent.click(screen.getByTestId('nav-candidates'));

// Delete a vacancy
fireEvent.click(screen.getByTestId('vacancy-delete-btn-123'));
```

### Testing with Cypress
```javascript
// Click on create vacancy button
cy.get('[data-testid="vacancies-create-btn"]').click();

// Search for a vacancy
cy.get('[data-testid="vacancies-search"]').type('Developer');

// Navigate to candidates
cy.get('[data-testid="nav-candidates"]').click();

// Check sidebar is open
cy.get('#main-sidebar').should('not.have.class', 'closed');

// Toggle sidebar
cy.get('#sidebar-toggle-btn').click();
cy.get('#main-sidebar').should('have.class', 'closed');
```

## CSS Classes for Testing

### Sidebar States
- `.sidebar.open` - Sidebar is visible
- `.sidebar.closed` - Sidebar is hidden

### Responsive Breakpoints
- `@media (max-width: 768px)` - Mobile view
- `@media (max-width: 1300px)` - Tablet view

## Notes

1. All interactive elements should have either `data-testid` or `id` attributes
2. Dynamic IDs (like vacancy IDs) use pattern: `{entity}-action-{id}`
3. Use `data-testid` for test-specific selectors
4. Use `id` for layout and structural elements
5. Class names follow BEM-like convention for consistency
