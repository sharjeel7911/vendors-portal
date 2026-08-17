// Metadata controls information such as the browser tab title.
import type { Metadata } from 'next'; // Next.js provides this type for page metadata.
import Link from 'next/link'; // Used for navigation links in the header.
import './globals.css'; // Loads the styles used by the whole application.

// These values appear in the browser and other places that read page metadata.
export const metadata: Metadata = {
  title: 'Fleet Ops', // Browser title.
  description: 'Drivers & vehicles dispatch board', // Short description of the application.
};

// This layout surrounds every page in the application.
export default function RootLayout({
  children, // The current page is placed here.
}: {
  children: React.ReactNode; // Any React content can be displayed inside the layout.
}) {
  return (
    // The page is written in English.
    <html lang="en">
      <body>
        {/* Use the full screen height and arrange the header, content, and footer vertically. */}
        <div className="min-h-screen flex flex-col">
          {/* The top navigation stays visible while scrolling. */}
          <header className="border-b border-dispatch-line bg-dispatch-panel/60 backdrop-blur sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
              {/* Clicking the logo returns to the home page. */}
              <Link href="/" className="flex items-center gap-2 group">
                <span className="w-2 h-2 rounded-full bg-dispatch-amber group-hover:animate-pulse" />
                <span className="font-display font-bold tracking-tight text-lg">
                  FLEET OPS
                </span>
              </Link>

              {/* These links let the user switch between drivers and vehicles. */}
              <nav className="flex items-center gap-1 font-mono text-sm">
                <Link
                  href="/drivers"
                  className="px-3 py-1.5 rounded text-dispatch-sub hover:text-dispatch-text hover:bg-dispatch-line transition-colors"
                >
                  drivers
                </Link>
                <Link
                  href="/vehicles"
                  className="px-3 py-1.5 rounded text-dispatch-sub hover:text-dispatch-text hover:bg-dispatch-line transition-colors"
                >
                  vehicles
                </Link>
              </nav>
            </div>
          </header>

          {/* The current page is inserted into this main content area. */}
          <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
            {children}
          </main>

          {/* Small footer shown at the bottom of every page. */}
          <footer className="border-t border-dispatch-line">
            <div className="max-w-5xl mx-auto px-6 py-4 text-xs font-mono text-dispatch-sub">
              fleet-ops · local dispatch console
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
