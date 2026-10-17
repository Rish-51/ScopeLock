# ScopeLock — Minimalist UI Color System & Claude Code Prompt

This guide provides a dedicated **Minimalist design system** for **ScopeLock (`v0.1.0`)**, stripping away neon glows and busy borders in favor of high-trust typography, subtle tactile surfaces, and surgical state verification.

---

## 1. Minimalist Color Tokens

ScopeLock uses an **Editorial Warm Minimalist ("Oat, Tangerine & Plum Purple")** system:

| UI Element / Surface | Warm Editorial ("Oat, Tangerine & Plum") | Purpose & Behavior |
| :--- | :--- | :--- |
| **Page Canvas (`--bg-canvas`)** | `#F7F4EB` (Warm Oat) | Soothing paper backdrop, zero glare |
| **Workspace Card (`--bg-surface`)** | `#FFFFFF` (Pure Card White) | Crisp elevated container |
| **Markdown Editor Well (`--bg-input`)** | `#EFECE4` (Recessed Soft Oat) | Code / monospaced input well |
| **Elevated Pills / Chips (`--bg-elevated`)** | `#EAE4D7` (Pebble Oat) | Preset brief chips & inactive tabs |
| **Subtle Hairline Borders (`--border-subtle`)** | `#DDD6C7` (Soft Oat Border) | Structural separation without noise |
| **Focus / Active Border (`--border-focus`)** | `#F97316` (Tangerine Focus) | High-contrast accessibility indicator |
| **Primary Text (`--text-primary`)** | `#2D0C30` (Deep Plum Purple) | Maximum contrast for headings, labels, and editor body |
| **Secondary Text (`--text-secondary`)** | `#65436A` (Plum-tinted Slate) | Subtitles, helper text, and placeholders |
| **Muted Metadata (`--text-muted`)** | `#8E7593` (Muted Plum Slate) | Char/token counts, version, footer links |
| **Primary CTA (`Scope with Local Gemma`)** | `#F97316` bg / `#FFFFFF` text | High-contrast, vibrant Tangerine action button |
| **Secondary CTA (`Load Instant Demo Replay`)** | `#FFFFFF` bg / `#7A407E` border | Understated Plum-bordered ghost action |
| **Verification Pill (`ZERO EGRESS`)** | `#F3E8F4` bg / `#581C61` text | Plum-branded privacy & telemetry assurance |
| **Active Contingency (`20%` Pill)** | `#F97316` bg / `#FFFFFF` text | Segmented control active state |

---

## 2. Minimalist Claude Code Prompt (Direct Implementation)

This prompt tells Claude Code to directly refactor ScopeLock to the minimalist system without adding any theme toggle or switcher clutter:

```text
Refactor ScopeLock's styling to a clean, high-precision Minimalist aesthetic. Eliminate default neon green glows, busy borders, and aggressive gradients, replacing them with a restrained typographic palette and semantic CSS design tokens.

### Step 1: Replace Hardcoded Colors with Semantic CSS Variables
In your root CSS stylesheet (e.g., globals.css or main.css), define these clean minimalist tokens:

:root {
  /* Surface & Canvas (Dark Minimalist Default) */
  --bg-canvas: #0c0d0f;
  --bg-surface: #131519;
  --bg-elevated: #1b1e24;
  --bg-input: #090a0c;

  /* Borders & Dividers */
  --border-subtle: #23272f;
  --border-strong: #333842;
  --border-focus: #e2e8f0;

  /* Typography */
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  /* Primary Action: Scope with Local Gemma 2B */
  --accent-primary-bg: #f8fafc;
  --accent-primary-fg: #090a0c;
  --accent-primary-hover: #e2e8f0;

  /* Secondary Action: Load Instant Demo Replay */
  --accent-secondary-bg: #131519;
  --accent-secondary-border: #334155;
  --accent-secondary-fg: #cbd5e1;
  --accent-secondary-hover: #1e2229;

  /* Status & Verification: Zero Content Egress & Offline Safe */
  --status-safe-bg: #0d281e;
  --status-safe-border: #154734;
  --status-safe-fg: #34d399;

  /* Active Segmented Controls (e.g. 20% Contingency, Active Tab) */
  --pill-active-bg: #e2e8f0;
  --pill-active-fg: #0c0d0f;

  /* Geometry & Shadows */
  --card-radius: 8px;
  --input-radius: 6px;
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 8px 24px rgba(0, 0, 0, 0.25);
}

/* (Optional Light Mode: Swiss Archival Ledger)
   If light mode is desired or toggled via prefers-color-scheme:
   --bg-canvas: #f6f5f0; --bg-surface: #ffffff; --bg-input: #efece6;
   --border-subtle: #dcd8ce; --text-primary: #141413; --text-secondary: #575652;
   --accent-primary-bg: #141413; --accent-primary-fg: #f6f5f0;
   --status-safe-bg: #e3efe8; --status-safe-border: #b7d7c4; --status-safe-fg: #1b5e3a;
*/

### Step 2: Apply Design Tokens to UI Components
Audit the components and map the tokens:

1. **Top Navbar & Hero**:
   - Set page background to `var(--bg-canvas)`.
   - Style the `Offline: telemetry off | ZERO CONTENT EGRESS` pill with `background: var(--status-safe-bg)`, `border: 1px solid var(--status-safe-border)`, and `color: var(--status-safe-fg)`. Remove any pulse or neon glow animations.
   - Use `var(--text-primary)` for the ScopeLock title and hero heading, and `var(--text-secondary)` for subtitles.
   - Style `Local-First • NDA-Safe • Verbatim Grounded` as a quiet badge using `var(--bg-elevated)` and `var(--border-subtle)`.

2. **Synthetic Brief Bar & Tabs**:
   - Container background: `var(--bg-surface)` with `1px solid var(--border-subtle)`.
   - Preset chips (`Mobile Pets MVP`, `Telehealth SaaS`, etc.): `background: var(--bg-elevated)`, `border: 1px solid var(--border-subtle)`, text `var(--text-secondary)`, with hover to `var(--text-primary)`.
   - Active tab (`Paste Text / Markdown`): `background: var(--bg-surface)`, text `var(--text-primary)`, `border-bottom: 2px solid var(--border-focus)`.
   - Inactive tab (`Upload PDF / MD / TXT`): text `var(--text-muted)`.
   - Character/token counter: monospace text in `var(--text-muted)`.

3. **Editor & Configuration Row**:
   - Brief textarea container: `background: var(--bg-input)` with `1px solid var(--border-subtle)` and inner padding. Text color `var(--text-primary)`. Focus state: `outline: none; border-color: var(--border-focus)`.
   - Hourly Rate input and currency selector: `background: var(--bg-input)`, `border: 1px solid var(--border-subtle)`.
   - Contingency buffer (15% / 20% / 25%): Style unselected pills with `background: transparent` and `color: var(--text-secondary)`. Style selected pill (`20%`) with `background: var(--pill-active-bg)` and `color: var(--pill-active-fg)` with subtle font-weight increase.
   - Target Architecture dropdown: `background: var(--bg-input)`, `border: 1px solid var(--border-subtle)`. Keep the small `OFFLINE SAFE` pill using `var(--status-safe-bg)` and `var(--status-safe-fg)`.

4. **Action Buttons**:
   - Secondary CTA (`Load Instant Demo Replay`): `background: var(--accent-secondary-bg)`, `border: 1px solid var(--accent-secondary-border)`, text `var(--accent-secondary-fg)`.
   - Primary CTA (`Scope with Local Gemma 2B`): `background: var(--accent-primary-bg)`, text `var(--accent-primary-fg)`, `font-weight: 600`, `border-radius: var(--input-radius)`. No drop-shadow glow.

5. **Footer**:
   - Single-line hairline border on top (`1px solid var(--border-subtle)`).
   - Text in `var(--text-muted)` with zero-egress icon matching `var(--status-safe-fg)`.

### Step 3: Polish & Verification
- Verify contrast ratios across text, buttons, and inputs meet WCAG AA standards.
- Ensure all hardcoded emerald/green utility classes (e.g. `bg-emerald-500`, `text-green-400`, `border-emerald-800`) are replaced by the semantic variables.
```