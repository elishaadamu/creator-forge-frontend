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

  it('updates campaign details in s2 when configuring cadence and instructions in s1', () => {
    // Open Phase Workspace
    cy.contains('button', 'Open Phase Workspace', { timeout: 15000 }).click({ force: true })

    // Navigate to Step 3: Campaign
    cy.contains('button', '3. Campaign', { timeout: 10000 }).click({ force: true })

    // Confirm Section 3. Creator Campaign Execution is displayed
    cy.contains('3. Creator Campaign Execution', { timeout: 10000 }).should('be.visible')

    // Click Sprint (7 posts)
    cy.contains('button', 'Sprint').click({ force: true })

    // Click Update Campaign
    cy.contains('button', /Update Campaign|Generate Campaign/i).click({ force: true })

    // Wait for generation to finish (Gemini LLM call + DB sync)
    cy.contains('Generating Campaign', { timeout: 45000 }).should('not.exist')

    // Verify 1. Schedule & Roadmap subtab shows 7 milestones
    cy.contains('button', '1. Schedule & Roadmap', { timeout: 10000 }).scrollIntoView().click({ force: true })
    cy.contains(/Milestone 7/i, { timeout: 10000 }).should('exist')

    // Verify 2. X Announcement Post subtab
    cy.contains('button', '2. X Announcement Post').click({ force: true })
    cy.get('textarea').should('not.have.value', '[object Object]')

    // Verify 3. Stories & Polls subtab
    cy.contains('button', '3. Stories & Polls').click({ force: true })
    cy.contains('Interactive 3-Story Sequence').should('be.visible')

    // Verify 4. Video Script subtab
    cy.contains('button', '4. Video Script').click({ force: true })
    cy.contains('60s Video Integration Mockup').should('be.visible')

    // Verify 5. Newsletter subtab
    cy.contains('button', '5. Newsletter').click({ force: true })
    cy.contains('1:1 Plain-Text Newsletter Preview').should('be.visible')
    cy.get('textarea').should('not.have.value', '[object Object]')

    // Verify 6. DM Outreach subtab
    cy.contains('button', '6. DM Outreach').click({ force: true })
    cy.contains('1:1 Direct Message Mockup').should('be.visible')
  })

  it('renders gamified Step 4 Run + Optimize with 3D badges, XP progress, and leaderboard', () => {
    // Open Phase Workspace
    cy.contains('button', 'Open Phase Workspace', { timeout: 15000 }).click({ force: true })

    // Navigate to Step 4: Optimize
    cy.contains('button', '4. Optimize', { timeout: 10000 }).click({ force: true })

    // Verify Gamified Mission Rocket Crest and level indicator
    cy.get('[data-testid="mission-level-crest"]', { timeout: 10000 }).should('be.visible')
    cy.contains(/LVL \d/i).should('be.visible')

    // Verify Gamified Telemetry Stat Cards
    cy.contains('Validation Engine Telemetry').should('be.visible')
    cy.contains('Traffic').should('be.visible')
    cy.contains('CTR').should('be.visible')
    cy.contains('Signups').should('be.visible')
    cy.contains('Presales').should('be.visible')
    cy.contains('Revenue').should('be.visible')
    cy.contains('Conversion').should('be.visible')

    // Verify Quests & Trophy Rack
    cy.contains('Phase 1 Validation Quests & Trophy Rack').should('be.visible')
    cy.get('[data-testid="quest-target-medallion"]').should('be.visible')
    cy.contains('Mission Uplink').should('be.visible')

    // Verify Channel Leaderboard
    cy.contains('Channel Attribution & Conversion Leaderboard').should('be.visible')
    cy.contains('Instagram Stories').should('be.visible')
    cy.contains('TikTok / Shorts').should('be.visible')
    cy.contains('X (Social Post)').should('be.visible')
    cy.contains('Email Newsletter').should('be.visible')

    // Verify Founding Members Ledger
    cy.contains('Founding Members Ledger').should('be.visible')
    cy.get('[data-testid="founding-trophy-pedestal"]').should('be.visible')

    // Capture screenshot of top gamified view
    cy.screenshot('gamified_step4_optimize_view')

    // Scroll to and capture Quests & Channel Leaderboard view
    cy.contains('Phase 1 Validation Quests & Trophy Rack').scrollIntoView()
    cy.screenshot('gamified_step4_quests_and_channels')

    // Scroll down to verify and capture Founding Members Trophy Pedestal
    cy.contains('Founding Members Ledger').scrollIntoView()
    cy.screenshot('gamified_step4_lower_sections')
  })
})
