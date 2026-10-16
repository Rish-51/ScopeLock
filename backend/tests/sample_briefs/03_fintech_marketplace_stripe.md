# Technical Brief: GearRent Marketplace

## Business Overview
GearRent is a peer-to-peer equipment rental marketplace connecting audiovisual professionals with camera, lighting, and audio equipment owners.

## Core Financial & Operational Requirements
1. **Multi-Vendor Onboarding:** Custom onboarding flow via Stripe Connect Custom accounts, collecting KYC identification, tax IDs, and verified bank routing details.
2. **Escrow & Split Payouts:** Renters pay total equipment rental fees plus a refundable security deposit. Funds must be held in escrow until rental return confirmation, after which our platform takes a 12% commission and automatically transfers remaining funds to the owner.
3. **Identity Verification:** Automated identity verification via Stripe Identity or Persona before any equipment over $1,000 value can be requested.
4. **Damage Deposit Holds:** Ability to capture partial or full security deposits within 72 hours of return if damages are reported.
5. **Realtime Availability Calendar:** Instant booking lock and reservation holding to prevent double booking.

## Edge Cases & Scope Ambiguities
- "We need support for international wire transfers and crypto payments sometime soon."
- "If someone damages a camera, we want the app to handle the insurance claims automatically."
- "The marketplace should be ultra responsive with zero latency."
