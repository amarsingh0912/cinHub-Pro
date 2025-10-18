// Import commands
import './commands';

// Import React and mount
import { mount } from 'cypress/react18';

// Add custom commands for component testing
Cypress.Commands.add('mount', mount);

// Augment the Cypress namespace to include type definitions for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}
