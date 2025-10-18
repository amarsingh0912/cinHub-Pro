describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display login button when not authenticated', () => {
    cy.get('[data-testid="button-login"]').should('be.visible');
  });

  it('should open login modal when login button is clicked', () => {
    cy.get('[data-testid="button-login"]').click();
    cy.get('[data-testid="modal-auth"]').should('be.visible');
  });

  it('should show validation errors for invalid credentials', () => {
    cy.get('[data-testid="button-login"]').click();
    cy.get('[data-testid="input-email"]').type('invalid-email');
    cy.get('[data-testid="input-password"]').type('123');
    cy.get('[data-testid="button-submit-login"]').click();
    
    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('should login successfully with valid credentials', () => {
    cy.login('test@example.com', 'password123');
    cy.get('[data-testid="button-user-menu"]').should('be.visible');
  });

  it('should persist login state after page reload', () => {
    cy.login('test@example.com', 'password123');
    cy.reload();
    cy.get('[data-testid="button-user-menu"]').should('be.visible');
  });

  it('should logout successfully', () => {
    cy.login('test@example.com', 'password123');
    cy.logout();
    cy.get('[data-testid="button-login"]').should('be.visible');
  });

  it('should switch between login and signup forms', () => {
    cy.get('[data-testid="button-login"]').click();
    cy.get('[data-testid="link-signup"]').click();
    cy.get('[data-testid="form-signup"]').should('be.visible');
    
    cy.get('[data-testid="link-login"]').click();
    cy.get('[data-testid="form-login"]').should('be.visible');
  });

  it('should handle forgot password flow', () => {
    cy.get('[data-testid="button-login"]').click();
    cy.get('[data-testid="link-forgot-password"]').click();
    cy.get('[data-testid="form-forgot-password"]').should('be.visible');
    
    cy.get('[data-testid="input-email"]').type('test@example.com');
    cy.get('[data-testid="button-submit-forgot-password"]').click();
    
    cy.get('[data-testid="message-success"]').should('be.visible');
  });
});
