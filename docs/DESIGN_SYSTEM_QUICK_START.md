# Design System Quick Start Guide

**Phase 1 Week 1 Complete** ✅

---

## 🚀 Quick Start (5 minutes)

### 1. See the Components
Visit: `http://localhost:3000/components-showcase`

This interactive page shows all components, their variants, and states.

### 2. Import & Use
```typescript
import { Button, Card, Input, Badge } from '@/components/ui';

// Button
<Button variant="primary">Book Now</Button>

// Card
<Card>
  <Card.Header>
    <Card.Title>Appointment</Card.Title>
  </Card.Header>
  <Card.Content>Content here</Card.Content>
</Card>

// Input
<Input label="Email" type="email" placeholder="you@example.com" />

// Badge
<Badge variant="success">Confirmed</Badge>
```

### 3. Toggle Dark Mode
Click the sun/moon icon in the component showcase to test dark mode.

---

## 📦 Components Available

### Inputs & Forms
```
<Input />           # Text, email, password, etc.
<Textarea />        # Multi-line text
<Select />          # Dropdown selection
```

### Display
```
<Badge />           # Status indicator
<Card />            # Content container
<Alert />           # Information/status messages
<Skeleton />        # Loading placeholder
```

### Actions
```
<Button />          # Interactive buttons
```

### Overlay
```
<Modal />           # Dialog/modal
```

### Theme
```
<ThemeToggle />     # Light/dark mode switch
```

---

## 🎨 Colors

### Brand
```
Primary:    bg-brand-500
Hover:      bg-brand-600
Active:     bg-brand-700
```

### Semantic
```
Success:    bg-success-500
Warning:    bg-warning-500
Error:      bg-error-500
Info:       bg-info-500
```

### Use in Tailwind
```
<div className="bg-brand-500 text-white">Primary</div>
<div className="bg-success-500">Success</div>
<button className="bg-error-500 hover:bg-error-600">Delete</button>
```

---

## 🔤 Typography

### Headings
```
<h1>64px - Main title</h1>
<h2>48px - Section title</h2>
<h3>32px - Subsection</h3>
<h4>24px - Minor heading</h4>
<h5>20px - Small heading</h5>
<h6>18px - Smallest heading</h6>
```

### Body Text
```
<p className="text-base">16px - Normal text</p>
<p className="text-lg">18px - Large text</p>
<p className="text-sm">14px - Small text</p>
<p className="text-xs">12px - Tiny text</p>
```

### In Tailwind
```
<div className="text-2xl font-bold">Bold heading</div>
<div className="text-base font-semibold">Semibold text</div>
<div className="text-sm text-muted-foreground">Muted text</div>
```

---

## 📏 Spacing

### Classes
```
p-xs  (4px)
p-sm  (8px)
p-md  (16px)
p-lg  (24px)
p-xl  (32px)
p-2xl (48px)
```

### Grid Layout
```
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
  <Card />
  <Card />
  <Card />
</div>
```

---

## 🎬 Animations

### Available Animations
```
animate-fade-in      # Fade in
animate-slide-up     # Slide from bottom
animate-scale-in     # Scale from center
animate-pulse        # Pulsing effect
```

### Custom Transitions
```
<div className="transition-colors duration-200 hover:bg-brand-600">
  Hover me
</div>
```

---

## 🌙 Dark Mode

### Automatic
Dark mode classes are automatically applied when `.dark` class is on `<html>`.

### Theme Toggle Component
```typescript
import { ThemeToggle } from '@/components/ThemeToggle';

<ThemeToggle />
```

### Manual Dark Mode Classes
```
<div className="bg-white dark:bg-surface-900">
  Changes color in dark mode
</div>

<div className="text-gray-900 dark:text-gray-50">
  Text changes color in dark mode
</div>
```

---

## 🎯 Common Patterns

### Form
```typescript
<div className="space-y-6 max-w-lg">
  <Input label="Name" required />
  <Input label="Email" type="email" required />
  <Select label="Specialty" options={specialties} />
  <Textarea label="Message" rows={4} />
  <Button fullWidth>Submit</Button>
</div>
```

### Card Grid
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
  {doctors.map(doctor => (
    <Card key={doctor.id}>
      <Card.Header>
        <Card.Title>{doctor.name}</Card.Title>
        <Card.Description>{doctor.specialty}</Card.Description>
      </Card.Header>
      <Card.Content>
        <p className="text-sm">{doctor.bio}</p>
        <Badge variant="success" className="mt-4">
          Available
        </Badge>
      </Card.Content>
    </Card>
  ))}
</div>
```

### Button Group
```typescript
<div className="flex gap-sm">
  <Button variant="secondary">Cancel</Button>
  <Button>Confirm</Button>
</div>
```

### Alert
```typescript
<Alert variant="info">
  <AlertTitle>Tip</AlertTitle>
  <AlertDescription>
    Complete your profile to unlock premium features.
  </AlertDescription>
</Alert>
```

---

## 🛠️ Customization

### Using `cn()` Utility
```typescript
import { cn } from '@/lib/utils';

const customButton = cn(
  'bg-brand-500 text-white',
  'px-4 py-2 rounded-lg',
  'hover:bg-brand-600',
  isActive && 'ring-2 ring-brand-700'
);

<button className={customButton}>Custom</button>
```

### Extending Tailwind
Edit `tailwind.config.ts` to add custom values:
```typescript
extend: {
  colors: {
    // Add custom colors
  },
  spacing: {
    // Add custom spacing
  }
}
```

---

## 📱 Responsive Design

### Breakpoints
```
Default (mobile):   <640px
sm:                640px+
md:                768px+
lg:                1024px+
xl:                1280px+
2xl:               1536px+
```

### Mobile-First Example
```typescript
<div className="
  grid
  grid-cols-1           // 1 column on mobile
  sm:grid-cols-2        // 2 columns on tablets
  lg:grid-cols-3        // 3 columns on desktop
  gap-md sm:gap-lg      // Spacing adjusts too
">
  <Card />
  <Card />
  <Card />
</div>
```

### Hide/Show Elements
```typescript
<div className="hidden md:block">
  Only visible on tablets and up
</div>

<div className="md:hidden">
  Only visible on mobile
</div>
```

---

## ♿ Accessibility

### Touch Targets
```
<button className="h-12 px-4">
  Minimum 44px height (iOS HIG)
</button>
```

### Focus States
All interactive elements have visible focus:
```
<button className="focus-visible:ring-2 ring-brand-500">
  Click me
</button>
```

### Labels
```
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

### Semantic HTML
```
<button>        (not <div onClick>)
<a href="">     (not <button> for links)
<h1-h6>        (proper heading hierarchy)
<ul><li>        (lists, not divs)
```

---

## 🔍 Finding Components

### By File
```
src/components/ui/Button.tsx
src/components/ui/Card.tsx
src/components/ui/Input.tsx
src/components/ThemeToggle.tsx
```

### By Function
```
Display:    Card, Badge, Alert
Input:      Input, Textarea, Select
Action:     Button
Overlay:    Modal
Loading:    Skeleton
Theme:      ThemeToggle
```

---

## 📚 Further Reading

- **Full Design System:** `DESIGN_SYSTEM.md`
- **Implementation Details:** `PREMIUM_APP_STRATEGY.md`
- **Week 1 Summary:** `PHASE_1_WEEK_1_COMPLETE.md`
- **Component Code:** `src/components/ui/*.tsx`

---

## ✨ Tips & Tricks

### Combining Variants
```
<Button variant="danger" size="lg" fullWidth>
  Delete Everything
</Button>
```

### Conditional Classes
```
<Badge variant={isApproved ? 'success' : 'warning'}>
  {isApproved ? 'Approved' : 'Pending'}
</Badge>
```

### Reusable Styles
```typescript
// In utils or a styles file
export const formInputClass = 'border-2 border-input-border focus:border-brand-500';

// Use it
<input className={formInputClass} />
```

### Mobile-Friendly Forms
```
<div className="max-w-lg mx-auto p-md space-y-md">
  <Input label="Name" />
  <Input label="Email" />
  <Button fullWidth>Submit</Button>
</div>
```

---

## 🚀 Ready to Code?

1. ✅ Design system set up
2. ✅ Components ready to use
3. ✅ Dark mode working
4. ✅ Responsive on all devices

**Start building:** Import components and create amazing UIs! 🎨

