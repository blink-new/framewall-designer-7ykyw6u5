import { createClient } from '@blinkdotnew/sdk'

// Initialize Blink client with proper error handling
let blinkClient: ReturnType<typeof createClient> | null = null

try {
  blinkClient = createClient({
    projectId: 'framewall-designer-7ykyw6u5',
    authRequired: true
  })
} catch (error) {
  console.error('Failed to initialize Blink client:', error)
}

export const blink = blinkClient!