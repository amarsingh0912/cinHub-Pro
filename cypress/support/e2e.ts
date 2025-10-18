// Import commands
import './commands';

// Disable uncaught exception handling for certain errors
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // when there are hydration errors or other non-critical errors
  if (err.message.includes('hydration')) {
    return false;
  }
  return true;
});

// Add custom assertions
beforeEach(() => {
  // Clear cookies and local storage before each test
  cy.clearCookies();
  cy.clearLocalStorage();
});

// Add accessibility testing
import 'cypress-axe';
