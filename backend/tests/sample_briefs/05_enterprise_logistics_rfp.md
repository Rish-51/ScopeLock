# Request for Proposals (RFP): Global Freight & Fleet Telematics Platform

## 1. Executive Summary & Project Intent
Apex Global Logistics operates a multi-modal fleet of over 4,500 commercial vehicles across North America and Western Europe. This Request for Proposal (RFP) solicits competitive bids from qualified independent software consultants and specialized agencies to design, architect, and deploy a next-generation real-time fleet telematics, predictive dispatch, and driver compliance platform (internal code name: FleetPulse).

## 2. Technical Architecture & Ingestion Requirements
The contractor shall design an event-driven telemetry ingestion engine capable of processing high-frequency CAN bus sensor packets transmitted over cellular 4G/5G modems.
- **Protocol Support:** MQTT over TLS 1.3 and CoAP ingestion with message deduplication and dead-letter queues.
- **Geofencing & Spatial Queries:** High-resolution polygonal geofencing with sub-500ms ingress/egress notifications.
- **Fuel Optimization:** Integration with Cummins, Volvo, and Detroit Diesel telemetry APIs to calculate real-time fuel efficiency scores.

## 3. Regulatory & Hours of Service (HOS) Compliance
Federal Motor Carrier Safety Administration (FMCSA) Electronic Logging Device (ELD) mandate compliance is mandatory for all operations in the United States.
- The platform must compute running 70-hour / 8-day rolling driving limits according to 49 CFR Part 395 regulations.
- Immediate automated driver violation warnings must trigger 60 minutes prior to mandatory rest break expiration.
- Cryptographically signed inspection logs must be exportable on demand for roadside Department of Transportation (DOT) audits.

## 4. Multi-Tenant Dispatch & Route Planning
- Dynamic routing engine optimizing multi-stop drops against historical traffic congestion data and live weather alerts from the National Weather Service API.
- Live two-way driver dispatch messaging with read receipts and automated dispatch assignment confirmations.
- Automated carrier rate confirmation sheets and bill of lading (BOL) digital document scanning with optical character recognition (OCR).

## 5. Security, Infrastructure & Scalability
- Zero Trust network architecture with OAuth 2.0 / OIDC role-based access control (RBAC).
- ISO 27001 and SOC 2 Type II compliance controls must be auditable throughout the software lifecycle.
- The database architecture must guarantee 99.99% operational uptime with automatic multi-region failover.

## 6. Commercial Terms & Submission Requirements
Bids must include itemized hourly rate schedules, milestone deliverables, assumptions regarding client-provided sensor hardware, and warranty terms for 90 days post-launch.
- "The vendor must provide 24/7 dedicated telephone support at no additional cost for the lifetime of the software."
- "All future feature additions and third-party API adjustments requested by regional directors shall be included under the initial fixed fee."
