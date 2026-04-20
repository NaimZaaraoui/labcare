# NexLab UI Direction

## Purpose
This document defines a more realistic visual direction for NexLab so that the application feels less like a modern showcase app and more like a credible, efficient laboratory information system.

It has two goals:

1. Give an honest diagnosis of the current interface.
2. Define a concrete target style for future refactors.

This is not a branding document. It is a usability and product credibility document.

---

## Honest Diagnosis

### What Works Today

- The application already has a strong business backbone.
- Several pages feel serious in terms of workflow.
- Print reports are becoming more coherent and professional.
- The app is visually cleaner than many internal tools.

### What Feels Wrong For A Real LIS

#### 1. Too much visual styling

Many screens still rely on:

- large shadows
- many rounded corners
- nested cards inside cards
- too many distinct visual surfaces
- decorative accents that do not improve workflow

This makes some pages feel designed for presentation rather than daily laboratory use.

#### 2. Too much cognitive noise

On several screens, the user has to visually process:

- multiple containers
- multiple emphasis levels
- too many badges
- too many local color systems
- too much spacing around non-critical information

A real LIS should reduce interpretation effort.

#### 3. Inconsistent seriousness across pages

Some pages feel calm and operational.
Others still feel closer to:

- a dashboard demo
- a startup admin UI
- a stylized internal app

That inconsistency weakens product credibility.

#### 4. Too much “UI identity”, not enough “instrument identity”

A laboratory system should feel like:

- a work tool
- a controlled environment
- a reliable instrument panel

More than:

- a visually expressive product
- a design showcase

### Main Conclusion

NexLab is not too weak visually.
It is too expressive for the type of product it wants to be.

The next step is not “make it prettier”.
The next step is:

- make it calmer
- make it stricter
- make it more obvious
- make it more operational

---

## Target Product Feeling

NexLab should feel:

- stable
- clear
- compact
- deliberate
- quietly professional

It should not feel:

- playful
- decorative
- trendy
- over-designed
- visually busy

The reference mindset is:

"A laboratory team should trust this interface after five minutes."

---

## Visual Principles

### 1. Utility First

Every visual choice must help one of these:

- read faster
- compare faster
- enter data faster
- validate faster
- detect anomalies faster

If an element does not help workflow, simplify it.

### 2. Calm Hierarchy

There should be fewer visual intensity levels.

Preferred hierarchy:

- page title
- section title
- primary data
- secondary help text
- discreet metadata

Avoid many competing highlights on the same screen.

### 3. Data Above Decoration

The most visible elements should be:

- patient identity
- analysis status
- values
- abnormal flags
- validation state
- chronology

Not:

- icon blocks
- decorative cards
- shadows
- capsule labels everywhere

### 4. Color Only For Meaning

Colors should communicate:

- success
- warning
- error
- active selection

Not “energy”, “personality”, or “modernity”.

### 5. Consistency Over Originality

A LIS earns trust through repetition and predictability.

It is acceptable if pages feel slightly less exciting,
as long as they feel more coherent and easier to scan.

---

## Target Style Guide

### Layout

Preferred:

- clean grid layouts
- fewer wrappers
- larger information zones
- more direct content presentation

Avoid:

- card inside card inside card
- decorative spacing between every block
- too many isolated floating panels

### Corners

Current UI uses many `rounded-3xl` or similar.

Target:

- default panels: `rounded-2xl`
- secondary blocks: `rounded-xl`
- dense utility controls: `rounded-lg`

Use very large radii only when there is a clear reason.

### Shadows

Target:

- much lighter shadows
- often no shadow at all
- border + background contrast should carry the separation

Preferred pattern:

- `border`
- subtle background difference
- minimal shadow only for elevated modals or key top panels

### Borders

Borders should do more of the work.

Preferred:

- light neutral borders
- simple dividers
- subtle section separation

This is more credible for a LIS than relying on glow and depth.

### Typography

Target:

- quieter page titles
- stronger table/data typography
- less “hero header” feeling
- consistent uppercase micro-labels only where useful

Preferred:

- page title: clear, not theatrical
- metric values: strong and tabular where needed
- helper text: small and neutral

### Colors

Base palette should be mostly:

- white
- off-white
- slate / gray
- black

Accent color:

- use one main accent consistently
- use it for active tabs, primary actions, selected states

Status colors:

- red only for real problems
- amber only for warnings
- green only for explicit “good / validated / in-range”

Avoid broad use of multiple colorful panels on one screen.

### Icons

Icons should support orientation, not dominate.

Preferred:

- smaller icon count
- fewer decorative icon containers
- use icons mainly for action clarity and section orientation

### Tables

Tables should become more central in the product language.

Good LIS screens often rely on:

- strong rows
- predictable columns
- restrained hover states
- direct status indicators

Tables should feel like the primary work surface.

### Forms

Forms should feel:

- compact
- aligned
- low-noise

Prefer:

- fewer oversized containers
- clearer labels
- less decorative grouping

### Charts

Charts should be:

- analytical
- calm
- readable

Not:

- colorful widgets
- dashboard ornaments

For QC especially:

- time axis must be readable
- thresholds must dominate the visual logic
- anomaly colors should be meaningful, not abundant

---

## Concrete UI Translation

### Page Headers

Current issue:

- some headers still feel too styled or too spacious

Target:

- one clear title
- one short support line
- primary actions on the right
- optional back link

No decorative overload.

### Dashboard Panels

Current issue:

- too many premium-style cards

Target:

- fewer panels
- flatter surfaces
- stronger grouping by function

### Result Entry

Target:

- values and abnormal states should dominate visually
- supporting controls should recede
- reduce non-essential styling around secondary panels

### QC

Target:

- page centered on graph + recent interpretation
- historical detail hidden behind progressive disclosure
- chart style more scientific than decorative

### Inventory

Target:

- stronger table-driven interface
- less “panel gallery” feeling

### Settings

Target:

- more functional navigation
- less visual weight
- clearer distinction between ordinary settings and risky actions

---

## What To Reduce Globally

Across the app, reduce:

- shadow intensity
- large-radius usage
- colorful helper blocks
- decorative badges
- accent color repetition
- too many panel wrappers

---

## What To Increase Globally

Across the app, increase:

- alignment discipline
- table clarity
- information density where useful
- neutral surfaces
- border-based structure
- consistency of headers and actions

---

## Priority Refactor Order

If we apply this direction, the best order is:

1. analyses list
2. results form
3. patient detail
4. QC pages
5. inventory list/detail
6. settings pages

Reason:

- these pages define most of the daily product feeling

---

## Practical Rule For Future Work

Before changing a page, ask:

1. Does this page feel like a laboratory work tool?
2. Is the user’s eye drawn first to the operational information?
3. Are colors only used for meaning?
4. Can one visual layer be removed?
5. Can one card wrapper be removed?
6. Would a flatter version actually be better?

If the answer is yes, simplify.

---

## Final Position

NexLab does not need a more fashionable UI.

NexLab needs a more credible LIS UI.

That means:

- less style performance
- more operational confidence
- less visual ego
- more clarity, consistency, and restraint

This is the right direction if the goal is not just to impress,
but to be trusted in daily laboratory work.
