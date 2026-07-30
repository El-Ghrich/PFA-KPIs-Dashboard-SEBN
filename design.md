# Design System — Production Dashboard

## Design Philosophy

- **Less is more** — maximize whitespace, minimize visual noise
- **Clear hierarchy** — guide the eye from most to least important
- **Data-first** — let numbers speak, not decorations
- **Consistent** — users know where to find information

---

## 1. Layout

| Region | Width | Notes |
|--------|-------|-------|
| Sidebar | 240px fixed | White background, border-right |
| Main content | `calc(100vw - 240px)` | Max 1440px, centered |
| Content padding | 32px (desktop), 20px (tablet), 16px (mobile) | |
| Grid columns | 12-column (flexbox-based) | Gap: 20px |

Layout structure:
```
┌──────────┬──────────────────────────────────────────────┐
│          │  ┌─ Header ──────────────────────────────┐  │
│ SIDEBAR  │  │  Title · subtitle · timestamp          │  │
│ 240px    │  └────────────────────────────────────────┘  │
│          │  ┌─ Filter Bar ──────────────────────────┐  │
│ Nav      │  │  [Location] [Project] [Year] [Reset]  │  │
│ items    │  │  [Apply]                              │  │
│          │  └────────────────────────────────────────┘  │
│          │  ┌─ Week Navigators ─────────────────────┐  │
│          │  │  ◀ CW27 · Jul 14–20 ▶  |  COMPARE    │  │
│          │  └────────────────────────────────────────┘  │
│          │  ┌──────┐┌──────┐┌──────┐┌──────┐         │
│          │  │ KPI  ││ KPI  ││ KPI  ││ KPI  │         │
│          │  └──────┘└──────┘└──────┘└──────┘         │
│          │  ┌─ Production Chart ────────────────────┐  │
│          │  │  Last 8 Week Trend                    │  │
│          │  │  [chart]                              │  │
│          │  └────────────────────────────────────────┘  │
│          │  ┌─ Alarms & Events ─────────────────────┐  │
│          │  │  [table]                              │  │
│          │  └────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────┘
```

---

## 2. Color Palette

### Base
| Token | Value | Usage |
|-------|-------|-------|
| `--color-surface` | `#f8fafc` | Page background |
| Card bg | `#ffffff` | Card/container backgrounds |
| `--color-on-surface` | `#0f172a` | Primary text |
| `--color-on-surface-variant` | `#64748b` | Secondary text |
| Tertiary text | `#94a3b8` | Labels, timestamps |

### Accents
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#3b82f6` | Buttons, active states, links |
| Success | `#22c55e` | Positive trends, good status |
| Warning | `#f59e0b` | Warnings, medium alerts |
| Danger | `#ef4444` | Errors, critical status |
| Info | `#8b5cf6` | Informational badges |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `--color-border-card` | `#e2e8f0` | Card borders, dividers |
| Input border | `#e2e8f0` | Form controls |

---

## 3. Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Dashboard title | 20px | 700 (bold) | `#0f172a` |
| Section heading | 16px | 600 (semibold) | `#0f172a` |
| Card title | 11px | 600 | `#64748b` |
| KPI value | 28px | 700 | `#0f172a` |
| KPI unit | 13px | 500 | `#94a3b8` |
| Comparison value | 13px | 700 | green/red |
| Chart axis labels | 11px | 500 | `#94a3b8` |
| Table header | 11px | 600 (uppercase) | `#64748b` |
| Table cell | 13px | 400 | `#0f172a` |
| Filter label | 10px | 600 (uppercase) | `#64748b` |
| Button text | 13px | 600 | — |

---

## 4. Component Styles

### Cards
- Background: `#ffffff`
- Border-radius: 12px (rounded-2xl)
- Shadow: `0 1px 3px rgba(0,0,0,0.06)`
- Hover: `0 4px 12px rgba(0,0,0,0.08)` with 300ms transition
- Padding: 20px (p-5)
- No inner borders

### KPI Cards
- Label above value (uppercase, small)
- Value: 28px bold tabular-nums
- Unit: 13px, secondary color, next to value
- Comparison: top-right, two lines (diff + vs CW), with animated arrow
- Hover: subtle lift shadow
- No icons, no decorations

### Buttons
| Type | Style |
|------|-------|
| Primary | `bg-[#3b82f6] text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:opacity-90` |
| Secondary | `border border-[#e2e8f0] text-[#64748b] rounded-lg px-4 py-2 hover:bg-[#f1f5f9]` |
| Text | `text-[#3b82f6] text-[13px] font-semibold hover:underline` |

### Form Controls
- Border: `#e2e8f0`, rounded-lg
- Focus: ring-2 `#3b82f6`
- Height: 36-40px
- Dropdown: custom chevron, no browser defaults

### Tables
- Header: uppercase, 11px, `#64748b`, no background
- Rows: 13px, `#0f172a`
- No vertical borders
- Subtle horizontal border between rows (`#f1f5f9`)
- Hover: `#f8fafc` row highlight
- Right-aligned numbers, left-aligned text
- Padding: 10px 16px

### Charts
- Gridlines: `#f1f5f9` (very subtle)
- No 3D effects or heavy borders
- Clean tooltips: white bg, shadow, 8px radius
- Legend: top, compact, usePointStyle
- Colors from palette (blue-500 bars, green-500 lines, etc.)

### WeekNavigator
- Card-like container with side padding
- Chevron buttons on each side
- Clickable center area opens week dropdown
- "Current Week" button or "compare" label prefix

---

## 5. Spacing System

| Token | Value |
|-------|-------|
| Page padding | 32px (desktop) |
| Card padding | 20px (p-5) |
| Card gap | 20px |
| Grid gap | 20px |
| Element spacing (within cards) | 8-12px |
| Stack spacing (between sections) | 24px |
| Table cell padding | 10px 16px |

---

## 6. Shadows

| Level | Value |
|-------|-------|
| Card (rest) | `0 1px 3px rgba(0,0,0,0.06)` |
| Card (hover) | `0 4px 12px rgba(0,0,0,0.08)` |
| Dropdown | `0 4px 16px rgba(0,0,0,0.12)` |
| Modal | `0 8px 32px rgba(0,0,0,0.16)` |

---

## 7. Animation

- Duration: 300ms ease
- Properties: opacity, transform, box-shadow
- No flashy or decorative animations
- Skeleton loading for async content
- Arrow float animation: 2.5s ease-in-out infinite, opacity 0.4→1

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Desktop | ≥1024px | Full sidebar + 12-col grid |
| Tablet | 768-1023px | Collapsed sidebar, 2-col KPIs |
| Mobile | <768px | Hidden sidebar (hamburger), single column |
