'use client';

import React, { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Select,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
  Skeleton,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@/components/ui';

/**
 * Component Showcase Page
 *
 * Displays all available UI components from the design system
 * Great for testing and documentation
 *
 * URL: /components-showcase
 */

export default function ComponentShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialty: '',
    message: '',
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Component Showcase
            </h1>
            <p className="text-sm text-muted-foreground">
              Premium UI Component Library
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Buttons Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Buttons</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
                <Button size="sm">Small</Button>
                <Button size="lg">Large</Button>
                <Button disabled>Disabled</Button>
                <Button isLoading>Loading</Button>
                <Button fullWidth>Full Width</Button>
                <Button variant="ghost" size="icon">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badges Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Badges</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Badge variant="success">Confirmed</Badge>
                <Badge variant="warning">Pending</Badge>
                <Badge variant="error">Cancelled</Badge>
                <Badge variant="info">Upcoming</Badge>
                <Badge variant="brand">New</Badge>
                <Badge variant="secondary">Default</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Alerts Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Alerts</h2>
          <div className="space-y-4">
            <Alert variant="info">
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                This is an informational alert. Use it to provide helpful context.
              </AlertDescription>
            </Alert>

            <Alert variant="success">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Your appointment has been booked successfully!
              </AlertDescription>
            </Alert>

            <Alert variant="warning">
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Please verify your information before submitting.
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Something went wrong. Please try again later.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Form Elements Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Form Elements</h2>
          <Card>
            <CardHeader>
              <CardTitle>Contact Form</CardTitle>
              <CardDescription>
                A sample form showcasing input components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                helperText="We'll never share your email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />

              <Select
                label="Medical Specialty"
                value={formData.specialty}
                onChange={(e) =>
                  setFormData({ ...formData, specialty: e.target.value })
                }
                options={[
                  { value: '', label: 'Select a specialty...' },
                  { value: 'cardiology', label: 'Cardiology' },
                  { value: 'dermatology', label: 'Dermatology' },
                  { value: 'pediatrics', label: 'Pediatrics' },
                ]}
              />

              <Textarea
                label="Message"
                placeholder="Tell us about your symptoms..."
                rows={4}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
              />

              <Input
                label="With Error"
                error="This field is required"
                placeholder="This input has an error"
              />

              <div className="flex gap-4">
                <Button fullWidth>Submit</Button>
                <Button variant="secondary" fullWidth>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Dr. John Smith</CardTitle>
                <CardDescription>Cardiologist</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Experienced cardiologist with 15+ years of practice. Specializes
                  in preventive care and complex heart conditions.
                </p>
                <div className="flex gap-2 mb-4">
                  <Badge variant="brand">5.0 ⭐</Badge>
                  <Badge variant="success">Available</Badge>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Your Appointment</CardTitle>
                <CardDescription>Tomorrow at 2:00 PM</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p>
                    <strong>Doctor:</strong> Dr. Sarah Johnson
                  </p>
                  <p>
                    <strong>Type:</strong> Video Consultation
                  </p>
                  <p>
                    <strong>Duration:</strong> 30 minutes
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardHeader>
                <CardTitle>Premium Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ Video consultations</li>
                  <li>✅ Medical records storage</li>
                  <li>✅ Prescription management</li>
                  <li>✅ AI health insights</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Skeleton Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Loading States (Skeleton)</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <Skeleton className="h-32 rounded-lg" />
                  <Skeleton className="h-32 rounded-lg" />
                  <Skeleton className="h-32 rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Modal Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Modal</h2>
          <Card>
            <CardContent className="pt-6">
              <Button onClick={() => setIsModalOpen(true)}>
                Open Modal
              </Button>

              <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ModalHeader>
                  <h2 className="text-xl font-bold">Confirm Appointment</h2>
                </ModalHeader>
                <ModalContent>
                  <p className="text-muted-foreground">
                    Are you sure you want to book this appointment with Dr. John
                    Smith on December 15th at 2:00 PM?
                  </p>
                </ModalContent>
                <ModalFooter>
                  <Button
                    variant="secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => setIsModalOpen(false)}>
                    Confirm
                  </Button>
                </ModalFooter>
              </Modal>
            </CardContent>
          </Card>
        </section>

        {/* Dark Mode Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Dark Mode</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">
                Click the theme toggle button in the header to switch between
                light and dark mode. The preference is saved to localStorage.
              </p>
              <Alert variant="info">
                <AlertTitle>Tip</AlertTitle>
                <AlertDescription>
                  All components automatically adjust their colors based on the
                  current theme.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface-50 dark:bg-surface-900 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <p className="text-sm text-muted-foreground">
            Component Showcase • Phase 1 Design System Setup
          </p>
        </div>
      </footer>
    </div>
  );
}
