describe('Combined Multi-URL Launch & Operations Suite', () => {
  it('1. Loads Project OS with specific project and creator params', () => {
    cy.visit('/project-os?project=proj_1790690869474&creator=0321fbdf-3df0-4855-800a-a6ed5e9ddbaa')
    cy.url().should('include', 'project=proj_1790690869474')
    cy.url().should('include', 'creator=0321fbdf-3df0-4855-800a-a6ed5e9ddbaa')
    cy.contains('PROJECT OS').should('be.visible')
    cy.contains('CREATOR FORGE').should('be.visible')
  })

  it('2. Loads Follow-Up CRM & Inbound Replies console', () => {
    cy.visit('/follow-up-crm')
    cy.url().should('include', '/follow-up-crm')
    cy.get('header').should('be.visible')
    cy.contains('CRM').should('be.visible')
  })

  it('3. Loads Creator Co-Founder Portal for codewithantonio with live token', () => {
    cy.visit('/portal/codewithantonio?token=cf_sec_live')
    cy.url().should('include', '/portal/codewithantonio')
    cy.url().should('include', 'token=cf_sec_live')
    cy.get('body').should('be.visible')
  })
})
