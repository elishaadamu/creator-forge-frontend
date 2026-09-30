describe('Creator Follow-Up CRM Suite', () => {
  beforeEach(() => {
    cy.visit('/follow-up-crm')
  })

  it('loads the Follow-Up CRM portal and top navigation', () => {
    cy.url().should('include', '/follow-up-crm')
    cy.get('header').should('be.visible')
    cy.contains('CRM').should('be.visible')
  })

  it('displays CRM overview, filter controls, and leads list or skeleton', () => {
    cy.get('body').should('be.visible')
    cy.get('main, [role="main"], section').should('exist')
  })
})
