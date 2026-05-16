import React from 'react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-200">
      <div className="bg-surface-100 p-8 rounded-3xl shadow-xl border border-surface-300 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-brand-primary mb-2">Create Account</h1>
        <p className="text-gray-500 mb-8">Join MediFlow for better healthcare</p>

        <form className="space-y-4">
          <input type="text" placeholder="Full Name" className="w-full p-3 rounded-xl bg-surface-200 border-transparent focus:ring-2 focus:ring-brand-primary outline-none" />
          <input type="email" placeholder="Email Address" className="w-full p-3 rounded-xl bg-surface-200 border-transparent focus:ring-2 focus:ring-brand-primary outline-none" />
          <input type="password" placeholder="Password" className="w-full p-3 rounded-xl bg-surface-200 border-transparent focus:ring-2 focus:ring-brand-primary outline-none" />
          <button className="w-full bg-brand-primary text-white p-3 rounded-xl font-semibold hover:opacity-90 transition-all">
            Sign Up
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-500">
          Already have an account? <a href="/auth/login" className="text-brand-primary font-semibold">Login here</a>
        </div>
      </div>
    </div>
  );
}
