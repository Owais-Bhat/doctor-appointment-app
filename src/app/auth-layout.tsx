"use client";

import React from "react";
import { Providers } from "./providers";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        {children}
      </div>
    </Providers>
  );
}
