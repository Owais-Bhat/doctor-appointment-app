# Mobile & Responsive Design Guide

**For:** Doctor Appointment App  
**Updated:** May 18, 2026

---

## 📱 Mobile-First Strategy

### Philosophy
Design for **mobile first**, then enhance for larger screens. This ensures:
- ✅ Fast load times on mobile networks
- ✅ Touch-friendly by default
- ✅ Progressive enhancement for desktop
- ✅ Better accessibility across devices

---

## 🎯 Key Mobile Principles

### 1. Touch Targets (Minimum 44×44px)

```typescript
// ✅ GOOD: Adequate touch area
<button className="h-12 px-4 py-3">
  Book Doctor
</button>

// ❌ BAD: Too small
<button className="h-8 px-2">
  Book
</button>

// ✅ GOOD: Icon with expanded hit area
<button className="h-12 w-12 flex items-center justify-center">
  <ChevronRight className="w-5 h-5" />
</button>
```

### 2. Touch Spacing (Minimum 8px Gap)

```css
/* Ensure gaps between interactive elements */
.touch-target {
  margin-bottom: 8px;
  /* OR */
  margin-right: 8px;
}

/* Don't cram buttons */
❌ <button>Book</button><button>Cancel</button>

✅ <div className="flex gap-2">
     <button>Book</button>
     <button>Cancel</button>
   </div>
```

### 3. Readable Text Size (Minimum 16px)

```typescript
// Prevents iOS auto-zoom on focus
<input
  type="email"
  className="text-base px-4 py-3"  // 16px
  placeholder="your@email.com"
/>

// Text scale on mobile
<h1 className="text-4xl md:text-6xl">Heading</h1>
<p className="text-base md:text-lg">Body text</p>
```

### 4. Avoid Horizontal Scroll

```typescript
// ✅ Responsive layout
<div className="w-full overflow-hidden">
  <div className="px-4 sm:px-6 md:px-8">
    {content}
  </div>
</div>

// ❌ Forces horizontal scroll
<div className="w-screen px-4">
  <div className="min-w-[800px]">
    {content}
  </div>
</div>
```

---

## 📐 Responsive Breakpoints

### Standard Breakpoints
```
320px   - Small phones (SE, iPhone 8)
375px   - Medium phones (iPhone 12)
640px   - Large phones & small tablets (landscape)
768px   - Tablets (portrait)
1024px  - Tablets (landscape) & small laptops
1280px  - Desktops
1536px  - Large desktops

Tailwind: xs / sm / md / lg / xl / 2xl
```

### Testing Device Sizes
```
Test these actual dimensions:
- 375×667   (iPhone 12/13)
- 390×844   (iPhone 14)
- 412×915   (Pixel 6)
- 768×1024  (iPad portrait)
- 1024×768  (iPad landscape)
- 1440×900  (Laptop)
```

---

## 🔄 Navigation Patterns

### Mobile Navigation (Bottom Tab Bar)

```typescript
export function MobileNav() {
  return (
    <nav className="
      fixed bottom-0 left-0 right-0
      bg-white border-t border-gray-200
      md:hidden  // Hide on desktop
    ">
      <div className="flex justify-around items-center h-16">
        <NavItem icon={Home} label="Home" href="/" />
        <NavItem icon={Calendar} label="Appointments" href="/appointments" />
        <NavItem icon={Plus} label="Book" href="/book" />
        <NavItem icon={Bell} label="Notifications" href="/notifications" />
        <NavItem icon={User} label="Profile" href="/profile" />
      </div>
    </nav>
  );
}

// Add bottom padding to content to avoid navbar overlap
<main className="pb-20 md:pb-0">
  {children}
</main>
```

### Desktop Navigation (Sidebar)

```typescript
export function DesktopNav() {
  return (
    <aside className="
      hidden md:flex
      fixed left-0 top-0 h-screen w-64
      bg-surface-50 border-r border-gray-200
      flex-col
    ">
      <div className="p-6">
        <Logo />
      </div>
      <nav className="flex-1 space-y-2 px-4">
        <NavLink href="/">Home</NavLink>
        <NavLink href="/appointments">Appointments</NavLink>
        <NavLink href="/book">Book Doctor</NavLink>
        {/* ... */}
      </nav>
    </aside>
  );
}

// Adjust main content
<main className="md:ml-64 transition-all duration-300">
  {children}
</main>
```

### Responsive Navigation (Hybrid)

```typescript
export function ResponsiveNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Mobile header with hamburger */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-40">
        <div className="flex justify-between items-center px-4 h-16">
          <Logo />
          <button onClick={() => setDrawerOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <Drawer onClose={() => setDrawerOpen(false)}>
            {/* Navigation items */}
          </Drawer>
        </div>
      )}

      {/* Desktop sidebar */}
      <DesktopNav />

      {/* Mobile bottom nav */}
      <MobileNav />
    </>
  );
}
```

---

## 📋 Form Optimization for Mobile

### Input Types (Trigger Correct Mobile Keyboard)

```typescript
// Email keyboard
<input type="email" inputMode="email" />

// Phone keyboard
<input type="tel" inputMode="tel" />

// Number keyboard
<input type="number" inputMode="numeric" />

// Text with suggestions
<input type="text" />

// Password
<input type="password" />
```

### Mobile Form Layout

```typescript
export function MobileOptimizedForm() {
  return (
    <form className="space-y-6 px-4 py-6">
      {/* Stack vertically on mobile */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Full Name
        </label>
        <input
          type="text"
          className="w-full h-12 px-4 text-base border-2 border-gray-300 rounded-lg"
          placeholder="John Doe"
        />
      </div>

      {/* Email input */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Email Address
        </label>
        <input
          type="email"
          className="w-full h-12 px-4 text-base border-2 border-gray-300 rounded-lg"
          placeholder="john@example.com"
          autoComplete="email"
        />
      </div>

      {/* Phone input */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          className="w-full h-12 px-4 text-base border-2 border-gray-300 rounded-lg"
          placeholder="+1 (555) 000-0000"
          autoComplete="tel"
        />
      </div>

      {/* Two-column layout on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Date
          </label>
          <input
            type="date"
            className="w-full h-12 px-4 text-base border-2 border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Time
          </label>
          <input
            type="time"
            className="w-full h-12 px-4 text-base border-2 border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Full-width submit button */}
      <button
        type="submit"
        className="w-full h-12 bg-brand-500 text-white font-semibold rounded-lg"
      >
        Continue
      </button>
    </form>
  );
}
```

### Form Validation for Mobile

```typescript
export function FormInput({ label, error, helperText, ...props }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label}
      </label>
      <input
        className={`
          w-full h-12 px-4 text-base rounded-lg border-2
          ${error
            ? 'border-error-500 bg-error-50'
            : 'border-gray-300 focus:border-brand-500'
          }
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-error-500 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
```

---

## 🎨 Responsive Grid Patterns

### One Column (Mobile)
```typescript
<div className="grid grid-cols-1 gap-4">
  <Card />
  <Card />
  <Card />
</div>
```

### Two Column (Tablet)
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card />
  <Card />
  <Card />
  <Card />
</div>
```

### Three Column (Desktop)
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card />
  <Card />
  <Card />
  {/* ... */}
</div>
```

### Asymmetric Layout
```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Sidebar: 1 column on mobile, 1 on desktop */}
  <aside className="md:col-span-1 order-2 md:order-1">
    <Sidebar />
  </aside>

  {/* Main: Full width on mobile, 2 columns on desktop */}
  <main className="md:col-span-2 order-1 md:order-2">
    <MainContent />
  </main>
</div>
```

---

## 🖼️ Image Optimization

### Responsive Images with next/image

```typescript
import Image from 'next/image';

export function ResponsiveImage() {
  return (
    <Image
      src="/doctor.jpg"
      alt="Dr. John Smith"
      width={600}
      height={400}
      sizes="
        (max-width: 640px) 100vw,
        (max-width: 1024px) 50vw,
        33vw
      "
      quality={75}
      priority={false}
      className="w-full h-auto"
    />
  );
}
```

### Background Images for Mobile

```typescript
// ✅ GOOD: Uses background-size
<div
  className="
    w-full h-64 sm:h-96
    bg-cover bg-center
    bg-no-repeat
  "
  style={{
    backgroundImage: 'url(/hero.jpg)',
  }}
/>

// Mobile: Show smaller image
<picture>
  <source
    media="(max-width: 640px)"
    srcSet="/hero-mobile.jpg"
  />
  <source
    media="(min-width: 641px)"
    srcSet="/hero-desktop.jpg"
  />
  <img src="/hero-desktop.jpg" alt="Hero" />
</picture>
```

---

## 📊 Responsive Tables

### Stacked Layout (Mobile)

```typescript
export function ResponsiveTable({ data }) {
  return (
    <>
      {/* Mobile: Stacked cards */}
      <div className="space-y-4 md:hidden">
        {data.map((item) => (
          <Card key={item.id}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.role}</p>
              </div>
              <Badge>{item.status}</Badge>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p><strong>Email:</strong> {item.email}</p>
              <p><strong>Phone:</strong> {item.phone}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop: Traditional table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Email
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{item.name}</td>
                <td className="px-6 py-4">{item.email}</td>
                <td className="px-6 py-4">
                  <Badge>{item.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
```

---

## 🛡️ Safe Area & Notch Awareness

### iPhone Notch / Dynamic Island

```css
/* Support safe areas */
@supports (padding: max(0px)) {
  body {
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
    padding-top: max(16px, env(safe-area-inset-top));
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
}

/* Fixed elements respect safe areas */
.fixed-header {
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.fixed-footer {
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### Viewport Meta Tag

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

---

## ⚡ Mobile Performance

### Critical Metrics
```
LCP (Largest Contentful Paint):  < 2.5s
FID (First Input Delay):         < 100ms
CLS (Cumulative Layout Shift):   < 0.1
```

### Optimizations

```typescript
// 1. Lazy load below-the-fold images
<Image
  src="/doctor.jpg"
  alt="Doctor"
  loading="lazy"
/>

// 2. Compress images aggressively on mobile
<Image
  src="/doctor.jpg"
  quality={60}  // Lower on mobile
  sizes="(max-width: 640px) 90vw, 100vw"
/>

// 3. Use WebP with fallback
<picture>
  <source srcSet="/doctor.webp" type="image/webp" />
  <source srcSet="/doctor.jpg" type="image/jpeg" />
  <img src="/doctor.jpg" alt="Doctor" />
</picture>

// 4. Avoid layout shifts with aspect ratio
<div className="aspect-video bg-gray-200">
  <Image src="/video-thumb.jpg" />
</div>

// 5. Code splitting for routes
const AdminPage = dynamic(() => import('./admin'), {
  loading: () => <Skeleton />,
});
```

---

## 🌙 Dark Mode on Mobile

### Mobile-First Dark Mode

```typescript
// Next.js + Tailwind
// In tailwind.config.ts
module.exports = {
  darkMode: ['class'],
  // ...
};

// In component
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
    >
      {isDark ? <Sun /> : <Moon />}
    </button>
  );
}
```

### Color Contrast on Mobile Dark Mode

```
Mobile dark mode often has lower brightness settings,
so ensure EXTRA contrast:

Light mode:  #1f2937 on #ffffff  → 13.8:1 ✅
Dark mode:   #f1f5f9 on #0f172a  → 11.2:1 ✅

Minimum: 4.5:1 always
```

---

## 📋 Mobile Checklist

Before launching mobile version:

- [ ] Test on actual devices (375px, 390px, 412px minimum)
- [ ] All touch targets ≥ 44px × 44px
- [ ] No horizontal scroll at any breakpoint
- [ ] Text readable without zoom (16px minimum)
- [ ] Forms use semantic input types
- [ ] Navigation works with bottom tabs
- [ ] Safe areas respected (notch, gesture bar)
- [ ] Dark mode tested on all screens
- [ ] Performance: LCP < 2.5s, FID < 100ms
- [ ] Images optimized (WebP, lazy load)
- [ ] Tap feedback <150ms
- [ ] Reduce motion respected
- [ ] Keyboard support (Tab, Enter)
- [ ] Screen reader tested
- [ ] Landscape orientation works

---

**Next Review:** August 18, 2026

