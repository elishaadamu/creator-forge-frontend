describe('Creator Launch OS - Complete /launch Workflow Suite', () => {
  beforeEach(() => {
    cy.visit('/launch')
  })

  it('loads the /launch command center with header navigation and 6-step stepper', () => {
    // Assert main title or navigation items exist
    cy.contains('Acquisition OS').should('be.visible')
    cy.contains('Project OS').should('be.visible')
    cy.contains('Co-Builders ($50)').should('be.visible')

    // Verify all 6 pipeline steps are present in the stepper
    cy.contains('Step 01').should('be.visible')
    cy.contains('Campaign Setup').should('be.visible')
    cy.contains('Step 02').should('be.visible')
    cy.contains('Find & Qualify').should('be.visible')
    cy.contains('Step 03').should('be.visible')
    cy.contains('Direct Outreach').should('be.visible')
    cy.contains('Step 04').should('be.visible')
    cy.contains('Interested Review').should('be.visible')
    cy.contains('Step 05').should('be.visible')
    cy.contains('Audience & Ideas').should('be.visible')
    cy.contains('Step 06').should('be.visible')
    cy.contains('Pitch & Select').should('be.visible')
  })

  it('navigates seamlessly across all 6 steps in the pipeline', () => {
    // Step 1: Initial state
    cy.contains('Campaign Setup').should('be.visible')

    // Step 2: Find & Qualify
    cy.contains('button', 'Find & Qualify').click()
    cy.contains('Step 02').should('be.visible')

    // Step 3: Direct Outreach
    cy.contains('button', 'Direct Outreach').click()
    cy.contains('Step 03').should('be.visible')

    // Step 4: Interested Review
    cy.contains('button', 'Interested Review').click()
    cy.contains('Step 04').should('be.visible')

    // Step 5: Audience & Ideas
    cy.contains('button', 'Audience & Ideas').click()
    cy.contains('Step 05').should('be.visible')

    // Step 6: Pitch & Select
    cy.contains('button', 'Pitch & Select').click()
    cy.contains('Step 06').should('be.visible')

    // Return to Step 1
    cy.contains('button', 'Campaign Setup').click()
    cy.contains('Step 01').should('be.visible')
  })

  it('supports direct step deep linking via URL query parameters', () => {
    // Direct link to step 2
    cy.visit('/launch?step=2')
    cy.url().should('include', 'step=2')
    cy.contains('Step 02').should('be.visible')

    // Direct link to step 4
    cy.visit('/launch?step=4')
    cy.url().should('include', 'step=4')
    cy.contains('Step 04').should('be.visible')

    // Direct link to step 5
    cy.visit('/launch?step=5')
    cy.url().should('include', 'step=5')
    cy.contains('Step 05').should('be.visible')
  })

  it('provides working navigation links to ProjectOS and Participation Manager', () => {
    cy.get('a[href*="/project-os"]').should('exist')
    cy.get('a[href="/participation-manager"]').should('exist').and('have.attr', 'href', '/participation-manager')
  })
})
