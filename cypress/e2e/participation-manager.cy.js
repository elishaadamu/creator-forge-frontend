describe('Creator Participation Manager E2E', () => {
  beforeEach(() => {
    cy.visit('/participation-manager')
  })

  it('loads the participation console and displays Co-Builder pass controls', () => {
    // Assert page title / header text
    cy.contains('Creator Participation & Co-Builder Console').should('be.visible')
    
    // Check that Pass Fee quick-edit button exists and displays fee amount
    cy.contains('Pass Fee:').should('be.visible')
    cy.contains('Edit').should('be.visible')
  })

  it('opens and closes the Default Pass Fee modal', () => {
    // Click the Pass Fee edit trigger
    cy.contains('button', 'Pass Fee:').click()

    // Modal should be visible
    cy.contains('Default Pass Fee').should('be.visible')
    cy.contains('Quick Presets').should('be.visible')
    cy.contains('$50').should('be.visible')

    // Click Cancel to dismiss
    cy.contains('button', 'Cancel').click()
    cy.contains('Default Pass Fee').should('not.exist')
  })
})
