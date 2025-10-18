describe('Movie Details Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should navigate to movie details when clicking a movie card', () => {
    cy.waitForPageLoad();
    cy.get('[data-testid^="card-movie-"]').first().click();
    cy.url().should('include', '/movie/');
  });

  it('should display movie title and overview', () => {
    cy.visit('/movie/550'); // Fight Club
    cy.waitForPageLoad();
    
    cy.get('[data-testid="text-movie-title"]').should('be.visible');
    cy.get('[data-testid="text-movie-overview"]').should('be.visible');
  });

  it('should display movie poster and backdrop', () => {
    cy.visit('/movie/550');
    cy.waitForPageLoad();
    
    cy.get('[data-testid="img-poster"]').should('be.visible');
    cy.get('[data-testid="img-backdrop"]').should('be.visible');
  });

  it('should display movie rating and metadata', () => {
    cy.visit('/movie/550');
    cy.waitForPageLoad();
    
    cy.get('[data-testid="text-rating"]').should('be.visible');
    cy.get('[data-testid="text-release-date"]').should('be.visible');
    cy.get('[data-testid="text-runtime"]').should('be.visible');
  });

  it('should display cast members', () => {
    cy.visit('/movie/550');
    cy.waitForPageLoad();
    
    cy.get('[data-testid^="card-cast-"]').should('have.length.greaterThan', 0);
  });

  it('should display similar movies', () => {
    cy.visit('/movie/550');
    cy.waitForPageLoad();
    
    cy.scrollTo('bottom');
    cy.get('[data-testid="section-similar"]').should('be.visible');
  });

  it('should allow adding to favorites', () => {
    cy.login('test@example.com', 'password123');
    cy.visit('/movie/550');
    cy.waitForPageLoad();
    
    cy.get('[data-testid="button-favorite"]').click();
    cy.get('[data-testid="toast-success"]').should('be.visible');
  });

  it('should allow adding to watchlist', () => {
    cy.login('test@example.com', 'password123');
    cy.visit('/movie/550');
    cy.waitForPageLoad();
    
    cy.get('[data-testid="button-watchlist"]').click();
    cy.get('[data-testid="dialog-watchlist"]').should('be.visible');
  });

  it('should play trailer when trailer button is clicked', () => {
    cy.visit('/movie/550');
    cy.waitForPageLoad();
    
    cy.get('[data-testid="button-play-trailer"]').click();
    cy.get('[data-testid="modal-trailer"]').should('be.visible');
  });

  it('should handle non-existent movie gracefully', () => {
    cy.visit('/movie/999999999');
    cy.get('[data-testid="text-error"]').should('be.visible');
  });

  it('should display user reviews', () => {
    cy.visit('/movie/550');
    cy.waitForPageLoad();
    
    cy.scrollTo('bottom');
    cy.get('[data-testid="section-reviews"]').should('be.visible');
  });

  it('should allow posting a review when authenticated', () => {
    cy.login('test@example.com', 'password123');
    cy.visit('/movie/550');
    cy.waitForPageLoad();
    
    cy.get('[data-testid="button-write-review"]').click();
    cy.get('[data-testid="textarea-review"]').type('Great movie!');
    cy.get('[data-testid="input-rating"]').click();
    cy.get('[data-testid="button-submit-review"]').click();
    
    cy.get('[data-testid="toast-success"]').should('be.visible');
  });

  it('should be accessible', () => {
    cy.visit('/movie/550');
    cy.waitForPageLoad();
    cy.injectAxe();
    cy.checkA11y();
  });
});
