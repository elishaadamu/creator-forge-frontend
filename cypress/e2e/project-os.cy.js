describe('Project OS Operations Suite', () => {
  const targetUrl = '/project-os?project=proj_1790690869474&creator=0321fbdf-3df0-4855-800a-a6ed5e9ddbaa'

  beforeEach(() => {
    cy.visit(targetUrl)
  })

  it('loads the Project OS command center with requested project and creator params', () => {
    // URL assertions
    cy.url().should('include', 'project=proj_1790690869474')
    cy.url().should('include', 'creator=0321fbdf-3df0-4855-800a-a6ed5e9ddbaa')

    // Header assertions
    cy.contains('CREATOR FORGE').should('be.visible')
    cy.contains('PROJECT OS').should('be.visible')
    
    // Back navigation to Acquisition OS
    cy.get('a[href="/launch"]').should('exist')
  })

  it('renders operations workspace elements and action controls', () => {
    // Body should be loaded
    cy.get('body').should('be.visible')
    
    // Command bar should be sticky at top
    cy.get('header').should('be.visible')
  })
})
