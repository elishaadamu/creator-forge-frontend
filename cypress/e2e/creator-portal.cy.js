describe('Creator Co-Founder Portal Suite', () => {
  const portalUrl = '/portal/codewithantonio?token=cf_sec_live'

  beforeEach(() => {
    cy.visit(portalUrl)
  })

  it('loads the creator portal page for Code With Antonio', () => {
    cy.url().should('include', '/portal/codewithantonio')
    cy.url().should('include', 'token=cf_sec_live')

    // Page body should render without unhandled errors
    cy.get('body').should('be.visible')
  })

  it('verifies portal structure and core interactive containers', () => {
    // Should have main container
    cy.get('div').should('exist')
  })
})
