# Doctor Appointment App - Design System v1.0

**Status:** Production Ready  
**Last Updated:** May 18, 2026

---

## 🎨 Brand Identity

### Color Palette

#### Primary Colors (Healthcare Professional)
```
Brand Blue:
  - 50:  #f0f9ff
  - 100: #e0f2fe
  - 200: #bae6fd
  - 300: #7dd3fc
  - 400: #38bdf8
  - 500: #0ea5e9 (Primary Brand)
  - 600: #0284c7 (Hover)
  - 700: #0369a1 (Active)
  - 900: #082f49

Usage: Primary CTAs, headers, links, primary navigation
```

#### Semantic Colors
```
Success (Green):   #10b981  - Confirmations, positive actions
Warning (Amber):   #f59e0b  - Cautions, pending states  
Error (Red):       #ef4444  - Errors, destructive actions
Info (Blue):       #3b82f6  - Information, help text
```

#### Neutral Palette (Surfaces & Text)
```
Foreground:
  - Primary text:    #1f2937 (gray-800)
  - Secondary text:  #6b7280 (gray-500)
  - Muted text:      #9ca3af (gray-400)

Surfaces:
  - Surface-50:  #fafaf9
  - Surface-100: #f5f5f4
  - Surface-200: #e7e5e4
  - Surface-300: #d6d3d1
  - Card shadow:  rgba(0, 0, 0, 0.05)
  
Dark Mode:
  - Background:      #0f172a
  - Card background: #1e293b
  - Text primary:    #f1f5f9
  - Text secondary:  #cbd5e1
```

### Typography

#### Font Families
```
Primary (Headings, UI):    Inter, system-ui, sans-serif
Secondary (Body):          Merriweather, Georgia, serif
Monospace (Code):          'JetBrains Mono', 'Courier New'

Font weights:
  - 400: Regular (body text)
  - 500: Medium (labels, emphasis)
  - 600: Semibold (subheadings)
  - 700: Bold (headings)
  - 800: Extrabold (large headlines)
```

#### Type Scale
```
Display:     48px / 1.2 line-height (h-screen scale)
Large:       32px / 1.3 line-height
Heading 1:   28px / 1.3 line-height
Heading 2:   24px / 1.35 line-height
Heading 3:   20px / 1.4 line-height
Body:        16px / 1.5 line-height (minimum for accessibility)
Small:       14px / 1.5 line-height
Tiny:        12px / 1.4 line-height (use sparingly)

Letter spacing:
  - Headings: -0.02em (tight)
  - Body:     0em (normal)
  - Labels:   0.02em (slight tracking)
```

---

## 📐 Spacing & Layout

### Spacing Scale (4pt Grid)
```
xs:    4px    (micro-spacing)
sm:    8px    (component gaps)
md:    16px   (section padding)
lg:    24px   (layout padding)
xl:    32px   (major sections)
2xl:   48px   (page sections)
```

### Breakpoints
```
xs:   320px  (small phones)
sm:   640px  (tablets portrait)
md:   768px  (tablets landscape)
lg:   1024px (small laptops)
xl:   1280px (large screens)
2xl:  1536px (ultra-wide)
```

### Content Widths
```
Container max-width:  1200px (lg)
Reading measure:      70 chars (18-20px font)
Mobile safe area:     16px left/right padding
Safe area (notch):    Respect top/bottom safe insets on mobile
```

---

## 🎯 Component System

### Button Component

#### Variants
```typescript
<Button variant="primary">
  Book Doctor
</Button>

<Button variant="secondary">
  Cancel
</Button>

<Button variant="ghost">
  Learn more
</Button>

<Button variant="danger">
  Delete appointment
</Button>
```

#### States
```
Default:  bg-brand-500, text-white
Hover:    bg-brand-600 (lifted shadow)
Active:   bg-brand-700
Disabled: opacity-50, cursor-not-allowed
Loading:  spinner + disabled state
```

#### Specifications
```
Height:        44px (touch-friendly minimum)
Padding:       12px 20px
Border-radius: 8px (rounded corners, not pill)
Font-weight:   600 (semibold)
Transition:    150ms ease-out
Min-width:     120px
```

### Card Component

```typescript
<Card className="hover:shadow-lg">
  <Card.Header>
    <h3>Appointment Details</h3>
  </Card.Header>
  <Card.Content>
    {children}
  </Card.Content>
  <Card.Footer>
    <Button>Confirm</Button>
  </Card.Footer>
</Card>
```

#### Specifications
```
Background:      white / dark-800
Border:          1px solid gray-200 / dark-700
Border-radius:   12px
Padding:         20px
Shadow:          0 1px 3px rgba(0,0,0,0.1)
Hover shadow:    0 10px 25px rgba(0,0,0,0.1)
Transition:      shadow 300ms ease-out
```

### Input Component

```typescript
<Input
  type="email"
  placeholder="your@email.com"
  label="Email Address"
  error={errors.email}
  helperText="We'll never share your email"
/>
```

#### Specifications
```
Height:          44px
Padding:         12px 16px
Font-size:       16px (prevents iOS auto-zoom)
Border:          2px solid gray-300
Border-focus:    2px solid brand-500
Border-error:    2px solid error-500
Border-radius:   8px
Transition:      150ms ease-out
Label color:     gray-700 / dark-200
Helper text:     12px, gray-500
Error message:   12px, error-500
```

### Modal/Dialog Component

```typescript
<Modal open={isOpen} onClose={onClose}>
  <Modal.Header>
    <h2>Confirm Appointment</h2>
  </Modal.Header>
  <Modal.Content>
    {children}
  </Modal.Content>
  <Modal.Footer>
    <Button variant="secondary">Cancel</Button>
    <Button>Confirm</Button>
  </Modal.Footer>
</Modal>
```

#### Specifications
```
Backdrop:        rgba(0, 0, 0, 0.5)
Modal max-width: 500px (sm) / 600px (md) / 800px (lg)
Border-radius:   16px
Padding:         24px
Enter animation: scale(0.95) + opacity
Duration:        200ms ease-out
Exit animation:  scale(0.95) + opacity
Duration:        150ms ease-in
Keyboard:        ESC to close
Focus:           Trap focus inside modal
```

### Badge Component

```typescript
<Badge variant="success">Confirmed</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Cancelled</Badge>
<Badge variant="info">Upcoming</Badge>
```

#### Specifications
```
Padding:         4px 12px
Font-size:       12px
Font-weight:     600
Border-radius:   20px (pill-shaped)
Background:      semantic color at opacity 10%
Text:            semantic color (full opacity)
```

---

## ✨ Animation & Motion

### Duration Scale
```
Micro:      100ms  (hover feedback, small state changes)
Fast:       150ms  (button clicks, small modals)
Default:    200ms  (standard transitions)
Slow:       300ms  (page transitions, large movements)
Leisurely:  400ms+ (only for special sequences)
```

### Easing Functions
```
ease-out:    cubic-bezier(0.4, 0, 0.2, 1)  ← Entering elements
ease-in:     cubic-bezier(0.4, 0, 1, 1)    ← Exiting elements
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)  ← Continuous motion
```

### Common Animations

#### Button Press
```typescript
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}
transition={{ duration: 0.15 }}
```

#### Modal Entrance
```typescript
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ duration: 0.2 }}
```

#### List Item Stagger
```typescript
staggerChildren: 0.05
delayChildren: 0.1
```

#### Page Transition
```typescript
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3 }}
```

---

## 🌙 Dark Mode

### Implementation Strategy
```typescript
// Tailwind config
const theme = {
  extend: {
    colors: {
      // Light mode (default)
      // Dark mode colors auto-prefixed with 'dark:'
    }
  }
}

// HTML attributes
<html className="dark">
```

### Color Adjustments for Dark Mode
```
Surface backgrounds → Darker (gray-900 → gray-800)
Text colors         → Lighter (gray-900 → gray-50)
Borders             → Lighter (gray-200 → gray-700)
Shadows             → Soften (less contrast needed)
Accent colors       → Slightly desaturated
```

### Testing Dark Mode
```
1. Test contrast: Primary text 4.5:1, secondary text 3:1
2. Test readability: No washed out colors
3. Test on all pages and components
4. Test with reduced-motion enabled
5. Verify brand colors remain recognizable
```

---

## ♿ Accessibility (WCAG 2.1 AA)

### Color Contrast
```
Normal text:  4.5:1 minimum
Large text:   3:1 minimum (18pt+ or 14pt bold+)
Graphical:    3:1 minimum

✅ Dark text on light background: #1f2937 on #ffffff → 13.8:1
✅ Light text on dark background: #f1f5f9 on #0f172a → 11.2:1
```

### Focus States
```
All interactive elements must have visible focus:
  outline-offset: 2px
  outline-width:  2px
  outline-color:  brand-500
  border-radius:  4px
```

### Touch Targets
```
Minimum size:  44px × 44px (Apple HIG)
Spacing gap:   8px between targets
No precision:  Avoid requiring exact pixel taps
Expand area:   Use padding or hitSlop for smaller icons
```

### Keyboard Navigation
```
Tab order:     Must match visual reading order
Escape key:    Close modals, popovers
Enter key:     Submit forms, activate buttons
Arrow keys:    Navigate lists, sliders
```

### Screen Reader Support
```
Semantic HTML:    <button>, <input>, <nav>, <main>
ARIA labels:      aria-label for icon-only buttons
ARIA live:        aria-live="polite" for toasts
Form labels:      <label for="id"> explicitly linked
Image alt text:   Descriptive, not "image of..."
```

---

## 📱 Responsive Design

### Mobile-First Approach

#### Mobile (320px - 639px)
```
- Single column layout
- Full-width buttons (padding 16px)
- Bottom navigation (5 items max)
- Touch-friendly spacing (44px minimum)
- Readable font (16px base)
- No horizontal scroll
```

#### Tablet (640px - 1023px)
```
- Two column layout
- Card grids (2 columns)
- Side drawer for navigation
- Moderate spacing (adjust padding)
- Optimized for portrait & landscape
```

#### Desktop (1024px+)
```
- Multi-column layouts (3-4 columns)
- Sidebar navigation (permanent)
- Full-width content areas
- Consistent max-width containers
- Enhanced interactions (hover states)
```

### Responsive Grid Patterns

```typescript
// Hero section
<div className="grid grid-cols-1 md:grid-cols-2 gap-12">
  <div>{heroText}</div>
  <div>{heroImage}</div>
</div>

// Card grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {appointments.map(apt => <AppointmentCard />)}
</div>

// Form layout
<form className="max-w-2xl mx-auto space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <input />
    <input />
  </div>
</form>
```

---

## 🎬 Loading States

### Skeleton Loading
```typescript
<Skeleton className="h-12 w-full rounded-lg mb-4" />
<Skeleton className="h-4 w-3/4 rounded-lg" />
<Skeleton className="h-4 w-2/3 rounded-lg" />
```

### Spinner
```typescript
<Spinner 
  size="md"
  color="brand"
  aria-label="Loading appointments..."
/>
```

### Shimmer Effect
```typescript
<div className="animate-pulse">
  <div className="h-12 bg-gray-200 rounded-lg mb-4" />
</div>
```

---

## 🔔 Notification System

### Toast Messages
```typescript
// Success
toast.success('Appointment booked successfully!', {
  duration: 5000,
  position: 'bottom-right'
})

// Error
toast.error('Failed to book appointment. Please try again.', {
  duration: 5000,
  action: { label: 'Retry', onClick: () => {} }
})

// Info
toast.info('Appointment reminder: Tomorrow at 2 PM', {
  duration: 7000,
  action: { label: 'Dismiss' }
})
```

### Alert Component
```typescript
<Alert variant="info">
  <AlertIcon />
  <AlertTitle>Need help?</AlertTitle>
  <AlertDescription>
    Contact our support team at support@doctor-app.com
  </AlertDescription>
</Alert>
```

---

## 🚀 Performance Guidelines

### Image Optimization
```typescript
// Use next/image for optimization
<Image
  src="/doctor.jpg"
  alt="Dr. John Smith"
  width={400}
  height={300}
  priority={isAboveFold}
  quality={85}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

### Font Optimization
```typescript
// Preload critical fonts
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin />

// Use next/font
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], display: 'swap' })
```

### CSS-in-JS vs Tailwind
- ✅ Use Tailwind for utility-first styling
- ✅ Use CSS modules for component-scoped styles
- ❌ Avoid inline styles
- ❌ Avoid styled-components for this project

---

## 📋 Checklist for Components

Before considering a component "complete", verify:

- [ ] Component works on mobile (375px), tablet (768px), desktop (1024px+)
- [ ] Responsive images use `next/image`
- [ ] All text has proper heading hierarchy
- [ ] Color contrast meets WCAG AA (4.5:1 for normal text)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus states are visible
- [ ] Touch targets are 44px minimum
- [ ] Loading state implemented
- [ ] Error state implemented
- [ ] Dark mode colors verified
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Storybook story documented
- [ ] No console errors or warnings
- [ ] Performance: Lighthouse >90 on all sections

---

**Last Updated:** May 18, 2026  
**Next Review:** August 18, 2026

