// This file tells Tailwind CSS where to look for classes and which custom styles to provide.
import type { Config } from 'tailwindcss'; // Import the type used to describe a Tailwind configuration.

// Store all Tailwind settings in this object.
const config: Config = {
  // Tailwind scans these files to find the class names that the application uses.
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Scan files inside the app folder.
    './components/**/*.{js,ts,jsx,tsx,mdx}', // Scan files inside the components folder.
  ],

  // Change or add visual styles to Tailwind.
  theme: {
    extend: {
      // Add the application's custom colors.
      colors: {
        // Keep all Fleet Ops colors under the "dispatch" name.
        // These were switched from a dark theme to a light blue & white theme.
        // Only the color values changed here — every component still uses the
        // same color names (like "dispatch-amber"), so nothing else had to change.
        dispatch: {
          bg: '#FFFFFF', // Main background is now plain white.
          panel: '#F1FAFE', // Slightly tinted light-blue panel background.
          line: '#CBEAF9', // Light blue border and divider color.
          amber: '#8AD4F6', // Main highlight color is now light blue (was amber before).
          amberDim: '#4FAED9', // A deeper blue used for things like hover states.
          text: '#17303A', // Main text is now a dark blue-grey so it reads well on white.
          sub: '#5E7C89', // Secondary text is a muted blue-grey.
          danger: '#D6524A', // Error and delete color, kept red but tuned for a light background.
          good: '#2F9E6E', // Positive/status color, kept green but tuned for a light background.
        },
      },

      // Define the fonts used by the application.
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'], // Main display font.
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'], // Monospace font for small technical-looking text.
      },
    },
  },

  // No extra Tailwind plugins are currently needed.
  plugins: [],
};

// Export the configuration so Tailwind can use it.
export default config;
