'use client';
// This file contains small reusable pieces of the interface.
// Keeping these pieces here means the same button, input, and error box can be reused.

import Link from 'next/link'; // Next.js Link lets the user move between pages without a full browser reload.
import { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes } from 'react'; // These types describe normal HTML properties.

// This creates the text input used by the forms.
export function Field({
  label, // The text shown above the input.
  ...props // All the normal input settings, such as type, value, and placeholder.
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    // The label keeps the input and its title together.
    <label className="block">
      {/* Show the name of the field to the user. */}
      <span className="block text-xs font-mono text-dispatch-sub mb-1.5 uppercase tracking-wide">
        {label}
      </span>
      {/* Show the actual text box and pass through the settings supplied by the form. */}
      <input
        {...props}
        className="w-full bg-dispatch-bg border border-dispatch-line rounded-md px-3 py-2 text-dispatch-text placeholder:text-dispatch-sub/50 focus:border-dispatch-amber outline-none transition-colors"
      />
    </label>
  );
}

// This is the main button used throughout the application (now light blue instead of orange).
export function PrimaryButton({
  children, // Text or other content displayed inside the button.
  ...props // Other button settings, such as type and disabled.
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    // Keep the same visual style for every main button.
    <button
      {...props}
      // Note: the button's text color was switched from "dispatch-bg" to "dispatch-text".
      // This is needed only because the page background changed from dark to white —
      // dark text is what actually shows up clearly on the new light blue button.
      className="bg-dispatch-amber text-dispatch-text font-semibold px-4 py-2 rounded-md hover:bg-dispatch-amber/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

// This is a less prominent link that looks like a simple outlined button.
export function GhostLink({
  href, // Page address that should open when the link is clicked.
  children, // Text shown inside the link.
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    // Next.js handles the page change using this link.
    <Link
      href={href}
      className="border border-dispatch-line px-4 py-2 rounded-md text-dispatch-sub hover:text-dispatch-text hover:border-dispatch-sub transition-colors"
    >
      {children}
    </Link>
  );
}

// This box displays an error message in a consistent style.
export function ErrorBanner({ message }: { message: string }) {
  return (
    // The message is shown in the red error box.
    <div className="border border-dispatch-danger/40 bg-dispatch-danger/10 text-dispatch-danger rounded-md px-4 py-3 text-sm font-mono">
      {message}
    </div>
  );
}

// This component is shown when there is nothing to display yet.
export function EmptyState({
  title, // Main message, such as "No vehicles yet".
  description, // Small explanation below the title.
  action, // Optional button or link the user can use.
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    // Center the empty-state message and give it a dashed border.
    <div className="border border-dashed border-dispatch-line rounded-lg py-16 px-6 text-center">
      {/* Display the main empty-state title. */}
      <p className="font-display font-bold text-lg mb-1">{title}</p>
      {/* Display the explanation. */}
      <p className="text-dispatch-sub text-sm mb-5">{description}</p>
      {/* Display the optional action button. */}
      {action}
    </div>
  );
}
