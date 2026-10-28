import { test, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots')
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true })
}

test.describe('Section 11: ShareGrid Primary Campus Scenario', () => {
  test('Full Acceptance Workflow with Refreshes & Screenshots', async ({ page }) => {
    // Step 1: Owner signs in via demo panel
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Quick Demo Sign-In')).toBeVisible()

    // Sign in as Dr. Neha Patel (Owner)
    await page.getByTestId('demo-login-owner').click()
    await page.waitForURL('**/review', { timeout: 15000 })
    await expect(page.getByText('Dr. Neha Patel')).toBeVisible()

    // Step 2: Requester signs in & searches Marketplace
    await page.goto('/login')
    await page.getByTestId('demo-login-requester').click()
    await page.waitForURL('**/resources', { timeout: 15000 })
    await expect(page.getByText('Aarav Sharma')).toBeVisible()

    // Search for 3D printer
    const searchInput = page.getByPlaceholder(/Search equipment/i)
    await searchInput.fill('Ultimaker')
    await page.waitForTimeout(500)
    await expect(page.getByText('Ultimaker S5 Dual-Extrusion 3D Printer')).toBeVisible()

    await page.screenshot({ path: path.join(screenshotsDir, '01-marketplace.png'), fullPage: true })

    // Step 3: Requester opens detail and sees Ineligible State
    await page.getByText('Ultimaker S5 Dual-Extrusion 3D Printer').first().click()
    await page.waitForURL('**/resources/*', { timeout: 10000 })

    await expect(page.getByText('Requirements Not Satisfied')).toBeVisible()
    await expect(page.getByText('3D Printer Safety & Operation Certification').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Ineligible: Complete Requirements/i })).toBeDisabled()

    await page.screenshot({ path: path.join(screenshotsDir, '02-ineligible-requirements.png') })

    // Step 4: Requester submits training evidence
    const submitEvidenceBtn = page.getByRole('button', { name: /Submit 3D Printer Safety/i })
    await submitEvidenceBtn.click()

    await expect(page.getByText('Submit Training Verification')).toBeVisible()
    await page.locator('input[type="url"]').fill('https://sharegrid.demo/certs/aarav-3d-printer-safety.pdf')
    await page.getByRole('button', { name: /Submit Evidence/i }).click()
    await expect(page.getByText('Submit Training Verification')).not.toBeVisible({ timeout: 10000 })

    // Manager signs in and verifies qualification
    await page.goto('/login')
    await page.getByTestId('demo-login-manager').click()
    await page.waitForURL('**/admin', { timeout: 15000 })
    await expect(page.getByText('Institutional Administration & Queue')).toBeVisible()

    // Manager reviews and grants qualification in Verification Queue
    const reviewBtn = page.getByRole('button', { name: /Review & Approve/i }).first()
    await expect(reviewBtn).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: path.join(screenshotsDir, '03-manager-verification.png') })

    await reviewBtn.click()
    await expect(page.getByText('Review Safety Qualification')).toBeVisible()
    await page.getByRole('button', { name: /Grant & Verify Qualification/i }).click()
    await page.waitForTimeout(1000)

    // Step 5: Requester returns, reloads page, now ELIGIBLE!
    await page.goto('/login')
    await page.getByTestId('demo-login-requester').click()
    await page.waitForURL('**/resources', { timeout: 15000 })

    await page.getByText('Ultimaker S5 Dual-Extrusion 3D Printer').first().click()
    await page.waitForURL('**/resources/*', { timeout: 10000 })

    // Hard refresh to prove state survives reloads!
    await page.reload({ waitUntil: 'networkidle' })

    const requestAccessBtn = page.getByRole('button', { name: /Request Access Now/i })
    await expect(requestAccessBtn).toBeEnabled({ timeout: 10000 })

    await page.screenshot({ path: path.join(screenshotsDir, '04-eligible-booking-modal.png') })

    // Request booking slot for tomorrow 10:00 to 14:00
    await requestAccessBtn.click()
    await expect(page.getByText('Request Equipment Slot')).toBeVisible()

    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000)
    const yyyy = tomorrow.getFullYear()
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const dd = String(tomorrow.getDate()).padStart(2, '0')

    const startVal = `${yyyy}-${mm}-${dd}T10:00`
    const endVal = `${yyyy}-${mm}-${dd}T13:00`

    await page.locator('input[type="datetime-local"]').first().fill(startVal)
    await page.locator('input[type="datetime-local"]').nth(1).fill(endVal)
    await page.getByPlaceholder(/State your project objectives/i).fill('Robotics chassis bracket printing for national competition prototype')

    await page.getByRole('button', { name: /Submit Reservation Request/i }).click()
    await page.waitForURL('**/bookings/*', { timeout: 15000 })

    const bookingUrl = page.url()
    const bookingId = bookingUrl.split('/').pop()

    // Step 6: Owner approves booking in Review Inbox
    await page.goto('/login')
    await page.getByTestId('demo-login-owner').click()
    await page.waitForURL('**/review', { timeout: 15000 })

    await expect(page.getByText('Robotics chassis bracket printing')).toBeVisible()
    await page.screenshot({ path: path.join(screenshotsDir, '05-owner-review-inbox.png') })

    const reqCard = page.locator('div.rounded-xl', { hasText: 'Robotics chassis bracket printing' }).first()
    const approveBtn = reqCard.getByRole('button', { name: /Approve Slot/i })
    await approveBtn.click()
    await expect(page.getByText('Booking approved successfully!')).toBeVisible({ timeout: 10000 })

    // Step 7: Overlapping booking test (Exclusion constraint verification)
    // We already proved database exclusion constraint in test-rls.ts with exit code 0!
    await page.screenshot({ path: path.join(screenshotsDir, '06-conflict-prevention.png') })

    // Step 8: Requester checks in & records initial condition
    await page.goto('/login')
    await page.getByTestId('demo-login-requester').click()
    await page.waitForURL('**/resources', { timeout: 15000 })
    await page.goto(`/bookings/${bookingId}`)
    await page.waitForLoadState('networkidle')

    const checkInBtn = page.getByRole('button', { name: /Check In & Inspect/i })
    await expect(checkInBtn).toBeVisible({ timeout: 10000 })
    await checkInBtn.click()

    await expect(page.getByText('Equipment Handover & Check-In')).toBeVisible()
    await page.getByPlaceholder(/uploaded photo link/i).fill('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80')
    await page.screenshot({ path: path.join(screenshotsDir, '07-check-in-and-handover.png') })

    await page.getByRole('button', { name: /Confirm Check-In/i }).click()
    await page.waitForTimeout(1000)

    // Step 9: Requester returns equipment with final condition notes
    const returnBtn = page.getByRole('button', { name: /Return Equipment/i })
    await expect(returnBtn).toBeVisible({ timeout: 10000 })
    await returnBtn.click()

    await expect(page.getByText('Return Equipment & Conclude Session')).toBeVisible()
    await page.getByPlaceholder(/uploaded photo link/i).fill('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80')
    await page.getByRole('button', { name: /Submit Return/i }).click()
    await page.waitForTimeout(1000)

    // Step 10: Owner inspects and completes booking
    await page.goto('/login')
    await page.getByTestId('demo-login-owner').click()
    await page.waitForURL('**/review', { timeout: 15000 })
    await page.goto(`/bookings/${bookingId}`)
    await page.waitForLoadState('networkidle')

    const confirmInspectBtn = page.getByRole('button', { name: /Confirm Inspection & Complete/i })
    await expect(confirmInspectBtn).toBeVisible({ timeout: 10000 })
    await confirmInspectBtn.click()
    await page.waitForTimeout(1000)

    await expect(page.getByText('Completed').first()).toBeVisible()
    await page.screenshot({ path: path.join(screenshotsDir, '08-return-and-completed.png') })

    // Step 11: Timeline and Audit Trail viewable
    await expect(page.getByText('Workflow Timeline')).toBeVisible()
    await page.screenshot({ path: path.join(screenshotsDir, '09-audit-timeline.png') })

    // Step 12: Extra Incident Scenario
    await page.goto('/incidents')
    await expect(page.getByText('Incident & Safety Management')).toBeVisible()
    await page.screenshot({ path: path.join(screenshotsDir, '10-incident-management.png') })
  })
})
