describe('Infinite Scroll', () => {
  beforeEach(() => {
    cy.visit('/movies');
    cy.waitForPageLoad();
  });

  it('should load initial set of movies', () => {
    cy.get('[data-testid^="card-movie-"]').should('have.length.greaterThan', 0);
  });

  it('should load more movies when scrolling to bottom', () => {
    const initialCount = Cypress.$('[data-testid^="card-movie-"]').length;
    
    cy.scrollTo('bottom');
    cy.wait(2000);
    
    cy.get('[data-testid^="card-movie-"]').should('have.length.greaterThan', initialCount);
  });

  it('should show loading indicator while fetching more', () => {
    cy.scrollTo('bottom');
    cy.get('[data-testid="loading-more"]').should('be.visible');
  });

  it('should stop loading when all results are fetched', () => {
    // Scroll multiple times to reach the end
    for (let i = 0; i < 10; i++) {
      cy.scrollTo('bottom');
      cy.wait(1000);
    }
    
    // Should show "no more results" message
    cy.get('[data-testid="text-no-more-results"]').should('be.visible');
  });

  it('should handle infinite scroll with filters applied', () => {
    cy.get('[data-testid="button-filters"]').click();
    cy.get('[data-testid="filter-genre-action"]').click();
    cy.get('[data-testid="button-apply-filters"]').click();
    cy.waitForPageLoad();
    
    const initialCount = Cypress.$('[data-testid^="card-movie-"]').length;
    
    cy.scrollTo('bottom');
    cy.wait(2000);
    
    cy.get('[data-testid^="card-movie-"]').should('have.length.greaterThan', initialCount);
  });

  it('should maintain scroll position after navigation', () => {
    cy.scrollTo('bottom');
    cy.wait(1000);
    
    const scrollPosition = Cypress.$(window).scrollTop();
    
    cy.get('[data-testid^="card-movie-"]').first().click();
    cy.go('back');
    cy.waitForPageLoad();
    
    // Scroll position should be restored
    cy.window().its('scrollY').should('be.greaterThan', 0);
  });

  it('should handle rapid scrolling without duplicate requests', () => {
    cy.scrollTo('bottom');
    cy.scrollTo('bottom');
    cy.scrollTo('bottom');
    cy.wait(2000);
    
    // Should not have duplicate cards
    cy.get('[data-testid^="card-movie-"]').then($cards => {
      const ids = $cards.map((i, el) => el.getAttribute('data-testid')).get();
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).to.equal(uniqueIds.length);
    });
  });
});
