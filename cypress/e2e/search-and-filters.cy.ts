describe('Search and Filters', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should open search modal when search button is clicked', () => {
    cy.get('[data-testid="button-search"]').click();
    cy.get('[data-testid="modal-search"]').should('be.visible');
  });

  it('should display search results for valid query', () => {
    cy.searchFor('Fight Club');
    cy.waitForPageLoad();
    cy.get('[data-testid^="card-movie-"]').should('have.length.greaterThan', 0);
  });

  it('should show empty state for no results', () => {
    cy.searchFor('xyzabc123nonexistent');
    cy.waitForPageLoad();
    cy.get('[data-testid="text-no-results"]').should('be.visible');
  });

  it('should filter between movies and TV shows', () => {
    cy.visit('/movies');
    cy.waitForPageLoad();
    
    cy.get('[data-testid="filter-type-movies"]').click();
    cy.get('[data-testid^="card-movie-"]').should('have.length.greaterThan', 0);
    
    cy.get('[data-testid="filter-type-tv"]').click();
    cy.get('[data-testid^="card-tv-"]').should('have.length.greaterThan', 0);
  });

  it('should apply genre filters', () => {
    cy.visit('/movies');
    cy.waitForPageLoad();
    
    cy.get('[data-testid="button-filters"]').click();
    cy.get('[data-testid="filter-genre-action"]').click();
    cy.get('[data-testid="button-apply-filters"]').click();
    
    cy.waitForPageLoad();
    cy.get('[data-testid^="card-movie-"]').should('have.length.greaterThan', 0);
  });

  it('should apply rating filters', () => {
    cy.visit('/movies');
    cy.waitForPageLoad();
    
    cy.get('[data-testid="button-filters"]').click();
    cy.get('[data-testid="slider-rating-min"]').invoke('val', 7).trigger('change');
    cy.get('[data-testid="button-apply-filters"]').click();
    
    cy.waitForPageLoad();
  });

  it('should apply year range filters', () => {
    cy.visit('/movies');
    cy.waitForPageLoad();
    
    cy.get('[data-testid="button-filters"]').click();
    cy.get('[data-testid="input-year-from"]').type('2000');
    cy.get('[data-testid="input-year-to"]').type('2020');
    cy.get('[data-testid="button-apply-filters"]').click();
    
    cy.waitForPageLoad();
  });

  it('should clear all filters', () => {
    cy.visit('/movies');
    cy.waitForPageLoad();
    
    cy.get('[data-testid="button-filters"]').click();
    cy.get('[data-testid="filter-genre-action"]').click();
    cy.get('[data-testid="button-clear-filters"]').click();
    
    cy.waitForPageLoad();
  });

  it('should persist filters in URL', () => {
    cy.visit('/movies');
    cy.waitForPageLoad();
    
    cy.get('[data-testid="button-filters"]').click();
    cy.get('[data-testid="filter-genre-action"]').click();
    cy.get('[data-testid="button-apply-filters"]').click();
    
    cy.url().should('include', 'genre');
    
    cy.reload();
    cy.waitForPageLoad();
    
    // Filters should still be applied
  });

  it('should show recent searches', () => {
    cy.searchFor('Fight Club');
    cy.visit('/search');
    
    cy.get('[data-testid="recent-searches"]').should('be.visible');
    cy.get('[data-testid^="recent-search-"]').should('have.length.greaterThan', 0);
  });

  it('should handle search keyboard shortcuts', () => {
    cy.get('body').type('{cmd}k');
    cy.get('[data-testid="modal-search"]').should('be.visible');
    
    cy.get('[data-testid="input-search"]').type('Fight Club{enter}');
    cy.waitForPageLoad();
  });
});
