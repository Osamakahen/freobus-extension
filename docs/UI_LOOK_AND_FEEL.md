# FreoWallet UI Look and Feel Guide

## Color Palette

### Brand Colors
- Gold Gradient: `linear-gradient(135deg, #FFD700, #FFA500)`
- Gold Gradient Hover: `linear-gradient(135deg, #FFE55C, #FFB347)`
- Gold Light: `#FFD700`
- Gold Dark: `#B8860B`

### Text Colors
- Primary Text: `#1A1A1A`
- Secondary Text: `#4A4A4A`
- Muted Text: `#64748b`

### Background Colors
- Light Background: `#FFFFFF`
- Dark Background: `#F8F8F8`
- Token Item Background: `#f8fafc`

### Status Colors
- Error: `#DC2626`
- Success: `#059669`
- Network Indicator: `#22c55e`

## Typography

### Font Family
- Primary Font: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`
- Monospace Font: Used for addresses and technical information

### Font Sizes
- Hero Title: `28px`
- Section Headers: `24px`
- Balance Amount: `32px`
- Regular Text: `14px`
- Small Text: `12px`

### Font Weights
- Bold: `700`
- Semi-bold: `600`
- Medium: `500`
- Regular: `400`

## Layout

### Container
- Popup Width: `360px`
- Popup Height: `600px`
- Base Padding: `16px`

### Spacing
- Small Gap: `8px`
- Medium Gap: `12px`
- Large Gap: `16px`
- Extra Large Gap: `24px`
- Section Gap: `32px`

### Border Radius
- Small: `4px`
- Medium: `8px`
- Large: `12px`
- Extra Large: `16px`
- Pill: `32px`
- Circle: `50%`

## Components

### Buttons

#### Primary Action Button
- Gold gradient background
- White text
- Padding: `12px`
- Border radius: `8px`
- Hover effect: Scale transform

#### Secondary Button
- Border: `1px solid #2563eb`
- Background: transparent
- Color: `#2563eb`
- Border radius: `20px`
- Hover: Filled background

#### Icon Button
- Size: `48px`
- Gold gradient background
- White icon color
- Border radius: `12px`
- Hover: Translate up and shadow

### Cards & Containers

#### Feature Card
- Background: `rgba(255, 255, 255, 0.8)`
- Border: `1px solid rgba(255, 215, 0, 0.1)`
- Border radius: `12px`
- Hover: Transform up and shadow
- Padding: `16px`

#### Token Item
- Background: `#f8fafc`
- Border radius: `12px`
- Padding: `12px`
- Hover: Translate X

### Navigation

#### Tabs
- Underline style
- Active indicator: Gold gradient
- Font weight: `500`
- Padding: `12px`

#### Network Selector
- Semi-transparent background
- Border radius: `32px`
- Status indicator dot
- Dropdown with white background

### Icons & Visual Elements

#### Wallet Icon
- Size: `32px` (standard), `64px` (large)
- Circular shape
- Blue background (`#2563eb`)
- White inner element

#### Network Indicator
- Size: `8px`
- Border radius: `50%`
- Success color: `#22c55e`

## Animations

### Transitions
- Standard duration: `0.2s`
- Long duration: `0.3s`
- Easing: `ease`

### Hover Effects
- Scale: `1.1`
- Translate Y: `-2px`
- Translate X: `4px`
- Shadow increase
- Background color change

### Loading States
- Spinner animation
- Opacity reduction
- Disabled state styling

## Accessibility

### Focus States
- Visible focus rings
- High contrast support
- Forced colors mode support

### Text Contrast
- Minimum contrast ratio compliance
- Clear text hierarchy
- Readable font sizes

### Interactive Elements
- Clear hover states
- Adequate touch targets
- Keyboard navigation support

## Responsive Design

### Breakpoints
- Popup is fixed size
- Internal scrolling for overflow content
- Flexible grid layouts

### Layout Adaptation
- Grid to stack transformation
- Flexible spacing system
- Preserved touch targets

## Empty States

### Style
- Centered layout
- Large emoji icon
- Clear heading
- Helpful description
- Action button when applicable

## Error States

### Error Messages
- Red background: `#fee2e2`
- Red border: `#ef4444`
- Red text: `#dc2626`
- Clear error description
- Padding: `8px 12px`

## Loading States

### Spinner
- Circular animation
- Border style loading
- Blue accent color
- White background
- Centered alignment 