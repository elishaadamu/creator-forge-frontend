// ***********************************************************
// Cypress E2E Support file
// Loaded automatically before your test files.
// ***********************************************************

import './commands'

// Ignore benign uncaught exceptions from third-party scripts if any
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false
})
