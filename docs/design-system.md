---
name: Academic Transit
colors:
  surface: '#fbf8fd'
  surface-dim: '#dbd9de'
  surface-bright: '#fbf8fd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f7'
  surface-container: '#efedf1'
  surface-container-high: '#e9e7ec'
  surface-container-highest: '#e3e2e6'
  on-surface: '#1b1b1f'
  on-surface-variant: '#44464f'
  inverse-surface: '#303034'
  inverse-on-surface: '#f2f0f4'
  outline: '#757780'
  outline-variant: '#c5c6d0'
  surface-tint: '#4b5d8c'
  primary: '#011844'
  on-primary: '#ffffff'
  primary-container: '#1a2e5a'
  on-primary-container: '#8496c9'
  inverse-primary: '#b3c6fb'
  secondary: '#964900'
  on-secondary: '#ffffff'
  secondary-container: '#fc820c'
  on-secondary-container: '#5e2c00'
  tertiary: '#2d1500'
  on-tertiary: '#ffffff'
  tertiary-container: '#4b2700'
  on-tertiary-container: '#c38c5c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b3c6fb'
  on-primary-fixed: '#011945'
  on-primary-fixed-variant: '#334573'
  secondary-fixed: '#ffdcc6'
  secondary-fixed-dim: '#ffb786'
  on-secondary-fixed: '#311300'
  on-secondary-fixed-variant: '#723600'
  tertiary-fixed: '#ffdcc1'
  tertiary-fixed-dim: '#f7ba86'
  on-tertiary-fixed: '#2e1500'
  on-tertiary-fixed-variant: '#663d13'
  background: '#fbf8fd'
  on-background: '#1b1b1f'
  surface-variant: '#e3e2e6'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 16px
  margin-desktop: 40px
  gutter: 16px
---

## Brand & Style
This design system is built upon the pillars of reliability, safety, and academic professionalism. It is designed to serve a university ecosystem where students, faculty, and shuttle operators require immediate clarity and frictionless navigation.

The aesthetic follows a **Corporate / Modern** direction. It balances the authoritative weight of traditional university branding with the agile, clean interfaces of modern mobility SaaS. The visual language is intentionally unobtrusive, prioritizing utility and data density to ensure users can track rides and manage schedules with confidence. The emotional response is one of organized efficiency—moving the user from "where am I?" to "my ride is here" with calm precision.

## Colors
The palette leverages a deep Navy Blue as the primary anchor, establishing trust and institutional authority. Accent Orange is used sparingly but decisively for primary actions (CTAs) and notifications to ensure high visibility against the white and grey backgrounds.

The semantic system is strictly enforced for status communication:
- **Primary:** Navigation headers, active states, and brand identifiers.
- **Accent:** Booking buttons, "Request Ride," and critical interactive highlights.
- **Surface:** Used for card backgrounds and page-level sectioning to differentiate content from the pure white base.
- **Status Tints:** Pending utilizes Amber (#FFBF00) for caution, Active uses Success Green, Cancelled uses Danger Red, and Completed defaults to a neutral mid-grey (#757575) to signify a closed state.

## Typography
This design system utilizes **Inter** exclusively to ensure maximum legibility across mobile and web platforms. The typographic scale is optimized for information-heavy screens, such as route lists and driver dashboards.

- **Headings:** Always set to 600 weight. Used for page titles, card headers, and significant data points (like ETA).
- **Body:** Always set to 400 weight. Used for descriptions, addresses, and secondary metadata.
- **Labels:** Used for buttons and status badges. These may utilize the 600 weight at smaller sizes (12px) to maintain readability against colored backgrounds.

## Layout & Spacing
The system utilizes an **8px linear grid** to maintain vertical rhythm.

- **Mobile:** A fluid layout with a fixed 16px side margin. Content cards span the full width minus margins.
- **Web/Desktop:** A fixed-fluid hybrid. The main content area sits beside a fixed 280px sidebar.
- **Rhythm:** Use 16px (md) spacing between related elements within a card and 24px (lg) spacing between distinct sections or cards.

## Elevation & Depth
Depth in this design system is created through a combination of **Tonal Layering** and **Subtle Shadows**.

- **Level 0 (Flat):** The main background (#FFFFFF).
- **Level 1 (Subtle):** The Surface Grey (#F5F6FA) used for background regions or containers that don't require interaction.
- **Level 2 (Raised):** Interactive cards. These feature a 1px border in a slightly darker grey (#E0E2E8) and a soft shadow: `0px 4px 12px rgba(26, 46, 90, 0.05)`. The shadow uses a tiny percentage of the Navy Primary color to keep the "clean" university aesthetic from feeling disconnected.
- **Level 3 (Overlay):** Modals and bottom sheets. These use a more pronounced shadow: `0px 8px 24px rgba(0, 0, 0, 0.12)`.

## Shapes
The shape language is defined by a consistent **12px (0.75rem)** border radius for all primary containers and cards. This radius strikes a balance between the friendliness of a consumer app and the structure of an institutional tool.

- **Buttons:** Follow the 12px radius, unless they are secondary icon buttons which may be circular.
- **Status Badges:** Use a fully pill-shaped radius (infinite) to distinguish them from interactive buttons.
- **Input Fields:** Match the 12px radius of cards for visual harmony.

## Components

### Navigation
- **Top App Bar:** Solid Navy Blue (#1A2E5A) background with White icons and text. This provides a constant anchor for the university brand.
- **Bottom Navbar:** Role-specific configurations.
    - *Student:* Home, My Rides, Tracking, Profile.
    - *Driver:* Shift, Routes, Notifications, Profile.
    - *Visuals:* White background, 1px top border, active icons in Accent Orange.
- **Web Sidebar:** Fixed 280px width, Navy Blue background or Light Grey with Navy active states.

### Interactive Elements
- **Primary Button:** Accent Orange background, White text, 12px radius, 600 weight font.
- **Status Badges:** Small, pill-shaped indicators.
    - **Pending:** Amber background (low opacity) with dark amber text.
    - **Active:** Green background (low opacity) with dark green text.
    - **Cancelled:** Red background (low opacity) with dark red text.
    - **Completed:** Light grey background with dark grey text.
- **Cards:** White background, 12px radius, subtle shadow, 16px internal padding.

### Input & Feedback
- **Input Fields:** Surface Light Grey background, no border (or very subtle grey border), 12px radius. Active state indicated by a 2px Primary Navy outline.
- **List Items:** Separated by 1px light grey dividers, featuring 16px padding to ensure touch targets are accessible for students on the move.
