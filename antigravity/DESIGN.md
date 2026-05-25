---
name: Operational Intelligence Light
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#603e39'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#956d67'
  outline-variant: '#ebbbb4'
  surface-tint: '#c00100'
  primary: '#bc0100'
  on-primary: '#ffffff'
  primary-container: '#eb0000'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a8'
  secondary: '#00658d'
  on-secondary: '#ffffff'
  secondary-container: '#2dbcfe'
  on-secondary-container: '#004866'
  tertiary: '#924800'
  on-tertiary: '#ffffff'
  tertiary-container: '#b75b00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#930100'
  secondary-fixed: '#c6e7ff'
  secondary-fixed-dim: '#82cfff'
  on-secondary-fixed: '#001e2d'
  on-secondary-fixed-variant: '#004c6b'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb785'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#723700'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 24px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max-width: 1440px
---

## Brand & Style

This design system is built for the high-stakes environment of industrial mining, where clarity and rapid information processing are critical. The brand personality is **authoritative, precise, and stable**. It balances an enterprise-grade utility with a premium aesthetic to ensure that operators and decision-makers feel a sense of security and control.

The visual style is **Corporate / Modern** with a focus on high-density data visualization. It employs a light-mode interface to maximize legibility under various lighting conditions typical of site offices. The interface prioritizes functional safety through a strict semiotic use of color, ensuring that operational telemetry is instantly decodable.

## Colors

The palette is derived from core brand assets, used with functional intentionality.

*   **Primary Red (#FF0000):** Reserved exclusively for branding elements, critical alerts (*Alertas Críticas*), and high-priority actions.
*   **Sky Blue (#00AEEF):** Used as the primary interactive and informational color. It represents telemetry, neutral data states, and primary navigation focus.
*   **Vibrant Orange (#FF8200):** Utilized for warning states (*Advertencias*) and secondary accents that require attention without signifying immediate danger.
*   **Forest Green (#00A94F):** Indicates nominal operations (*Estado Nominal*), success feedback, and safe environmental parameters.
*   **Surface & Background:** A clean `#FFFFFF` surface is paired with a `#F8F9FA` background to create subtle depth without visual noise.

## Typography

The system utilizes **Inter** for its exceptional legibility in data-heavy environments. The typeface offers a neutral, professional tone that avoids the "robotic" feel of monospaced fonts while maintaining clear character distinction for numerical data.

All interface language is in **Spanish**. Headlines should use sentence case (*Caso de oración*) for improved readability. For data visualization metrics, the "Data-LG" style is optimized for telemetry displays where numerical value prominence is paramount.

## Layout & Spacing

This design system uses a **Fluid Grid** model to accommodate high-density data visualizations across varying screen sizes. 

*   **Desktop:** 12-column grid with 24px gutters.
*   **Tablet:** 8-column grid with 16px gutters.
*   **Mobile:** 4-column grid with 16px gutters.

Spacing follows a strict 4px baseline shift to maintain a mathematical rhythm. High-density layouts (such as operational logs) should use the 4px and 8px units for tight grouping, while structural page elements should use 24px and 32px units to provide necessary whitespace for visual "breathing room."

## Elevation & Depth

To maintain an "enterprise-safe" aesthetic, elevation is conveyed through **Tonal Layers** and **Low-contrast Outlines** rather than aggressive shadows.

1.  **Level 0 (Background):** `#F8F9FA` - The canvas for the application.
2.  **Level 1 (Cards/Panels):** `#FFFFFF` - Used for content containers. Features a 1px border in `#E4E7EB`.
3.  **Level 2 (Floating Elements):** Used for the bottom navigation bar. Includes an ambient, highly-diffused shadow (`0 12px 32px rgba(0,0,0,0.08)`) and a glassmorphism effect (Backdrop Blur: 10px) to distinguish it from the content layer.
4.  **Level 3 (Overlays/Modals):** High-contrast boundaries with a 20% opacity black backdrop to focus user attention on critical inputs.

## Shapes

The shape language is **Rounded**, utilizing a 0.5rem (8px) base radius. This softens the industrial nature of the platform, making the data feel more approachable and modern. 

*   **Standard Components:** 8px radius (Buttons, Input fields, Cards).
*   **Large Containers:** 16px radius (`rounded-lg`).
*   **Navigation Bar:** Fully rounded (Pill-shaped) to align with the minimalist floating style.

## Components

### Navigation (Barra de Navegación)
The primary navigation is a floating, pill-shaped bar located at the bottom of the viewport. It uses a semi-transparent white background with a backdrop blur. Icons are professional 24px line icons. The active state is indicated by a Sky Blue color shift and a subtle indicator line or background glow.

### Buttons (Botones)
*   **Primary:** Sky Blue background with white text for standard actions. Red background only for "Acción Crítica."
*   **Secondary:** White background with a 1px Sky Blue border.
*   **States:** Hover states should involve a 10% darkening of the base color.

### Data Chips (Indicadores)
Small, rounded pills used for status indicators:
*   **Nominal:** Green background (10% opacity) with Green text.
*   **Advertencia:** Orange background (10% opacity) with Orange text.
*   **Crítico:** Red background (10% opacity) with Red text.

### Input Fields (Campos de Entrada)
Clear, outlined fields with labels in "Label-MD" style. Active focus states must use a 2px Sky Blue border. Errors are shown with Red text and a Red border.

### Telemetry Cards (Tarjetas de Telemetría)
Cards for displaying sensor data should feature the "Data-LG" typography for the primary value, with a small sparkline chart utilizing the Sky Blue color to show 24-hour trends.