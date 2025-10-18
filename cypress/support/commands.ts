/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login a user
       * @example cy.login('email@example.com', 'password')
       */
      login(email: string, password: string): Chainable<void>;
      
      /**
       * Custom command to logout a user
       * @example cy.logout()
       */
      logout(): Chainable<void>;
      
      /**
       * Custom command to wait for page to be fully loaded
       * @example cy.waitForPageLoad()
       */
      waitForPageLoad(): Chainable<void>;
      
      /**
       * Custom command to search for a movie or TV show
       * @example cy.searchFor('Fight Club')
       */
      searchFor(query: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/');
  cy.get('[data-testid="button-login"]').click();
  cy.get('[data-testid="input-email"]').type(email);
  cy.get('[data-testid="input-password"]').type(password);
  cy.get('[data-testid="button-submit-login"]').click();
  cy.wait(1000);
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="button-user-menu"]').click();
  cy.get('[data-testid="button-logout"]').click();
});

Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid*="loading"]', { timeout: 10000 }).should('not.exist');
  cy.get('[data-testid*="skeleton"]', { timeout: 10000 }).should('not.exist');
});

Cypress.Commands.add('searchFor', (query: string) => {
  cy.get('[data-testid="input-search"]').clear().type(query);
  cy.get('[data-testid="button-search"]').click();
  cy.wait(500);
});

export {};
