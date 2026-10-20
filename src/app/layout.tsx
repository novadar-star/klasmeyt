import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "@fontsource-variable/instrument-sans/wdth.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Klasmeyt", template: "%s · Klasmeyt" },
  description: "Find verified Adamson peer mentors for Calculus 1, Calculus 2, and Physics.",
};

export const viewport: Viewport = { themeColor: "#F6F8FB", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only z-[100] rounded-control bg-brand-600 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        {children}
        <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontFamily: "inherit" } }} />
      </body>
    </html>
  );
}
