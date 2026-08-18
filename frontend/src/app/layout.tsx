import type { Metadata } from "next";

// Self-hosted via @fontsource (bundled woff2, no runtime call to Google Fonts —
// keeps builds working behind proxies/firewalls that block fonts.googleapis.com).
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";

import "./globals.css";
import { AuthProvider } from "./context/auth-context";
import { ThemeScript } from "./components/theme";

export const metadata: Metadata = {
  title: "Devorbits | Vendor Portal",
  description: "Plan routes, dispatch drivers, and track deliveries.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
