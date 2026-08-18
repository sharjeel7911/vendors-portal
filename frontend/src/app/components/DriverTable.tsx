'use client';
// This component displays drivers in a table and handles deleting them in the browser.

import { useState } from 'react'; // Used for error, delete, and confirmation state.
import { useRouter } from 'next/navigation'; // Used to refresh the list after a delete.
import Link from 'next/link'; // Used for the edit and add-driver links.
import { Driver, deleteDriver } from '@/lib/api'; // Driver type and delete request.
import { ErrorBanner, EmptyState, PrimaryButton } from './ui'; // Reusable interface pieces.

// Give each driver status its own text style.
const STATUS_COLOR: Record<string, string> = {
  Active: 'text-dispatch-good', // Active drivers use the "good" color.
  'Off Duty': 'text-dispatch-sub', // Off-duty drivers use the normal secondary color.
  'On Leave': 'text-dispatch-amber', // Drivers on leave use the amber color.
  Suspended: 'text-dispatch-danger', // Suspended drivers use the danger color.
};

// Receive the list of drivers from the page and display it.
export default function DriverTable({ drivers }: { drivers: Driver[] }) {
  // Get the router so the list can be refreshed after deleting.
  const router = useRouter();

  // Store an error message when deleting fails.
  const [error, setError] = useState<string | null>(null);

  // Store the ID of the driver currently being deleted.
  const [pendingId, setPendingId] = useState<number | null>(null);

  // Store the ID of the driver for which the user is being asked to confirm deletion.
  const [confirmId, setConfirmId] = useState<number | null>(null);

  // Delete a driver after the user confirms.
  async function handleDelete(id: number) {
    setError(null); // Remove an old error.
    setPendingId(id); // Remember which driver is being deleted.

    try {
      // Send the delete request to the backend.
      await deleteDriver(id);

      // Refresh the page so the removed driver disappears from the table.
      router.refresh();
    } catch (err) {
      // Show a useful error when the request fails.
      setError(err instanceof Error ? err.message : 'Failed to delete driver.');
    } finally {
      // Clear the loading state.
      setPendingId(null);

      // Close the delete confirmation.
      setConfirmId(null);
    }
  }

  // If there are no drivers, show a friendly empty message instead of an empty table.
  if (drivers.length === 0) {
    return (
      <EmptyState
        title="No drivers yet"
        description="Add your first driver to start building the roster."
        action={
          <Link href="/drivers/new">
            <PrimaryButton type="button">Add driver</PrimaryButton>
          </Link>
        }
      />
    );
  }

  return (
    // Add spacing around the error message and table.
    <div className="space-y-4">
      {/* Show the error only when one exists. */}
      {error && <ErrorBanner message={error} />}

      {/* This wrapper gives the table its border and rounded corners. */}
      <div className="border border-dispatch-line rounded-lg overflow-hidden">
        {/* The table takes the full available width. */}
        <table className="w-full text-sm">
          {/* The top part contains the column names. */}
          <thead>
            {/* Give the header row its background and text styling. */}
            <tr className="bg-dispatch-panel border-b border-dispatch-line text-left font-mono text-xs text-dispatch-sub uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">License</th>
              <th className="px-4 py-3 font-medium">Hours</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Latitude</th>
              <th className="px-4 py-3 font-medium">Longitude</th>
              <th className="px-4 py-3 font-medium">Vehicle ID</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>

          {/* The body contains one row for every driver. */}
          <tbody>
            {drivers.map((d) => (
              // Use the driver's ID so React can keep track of each row.
              <tr
                key={d.id}
                className="border-b border-dispatch-line last:border-0 hover:bg-dispatch-panel/50 transition-colors"
              >
                {/* Show the driver's name. */}
                <td className="px-4 py-3 font-medium">{d.name}</td>

                {/* Show the driver's phone number. */}
                <td className="px-4 py-3 font-mono text-dispatch-sub">
                  {d.phone}
                </td>

                {/* Show the driver's license number. */}
                <td className="px-4 py-3 font-mono text-dispatch-amber">
                  {d.liscence_no}
                </td>

                {/* Show the driver's working hours. */}
                <td className="px-4 py-3 text-dispatch-sub">
                  {d.working_hours}
                </td>

                {/* Show the status using the matching status color. */}
                <td className="px-4 py-3">
                  <span
                    className={`font-mono text-xs ${STATUS_COLOR[d.status] ?? 'text-dispatch-sub'}`}
                  >
                    {d.status}
                  </span>
                </td>

                {/* Show the driver's current latitude (north-south position). */}
                <td className="px-4 py-3 font-mono text-dispatch-sub">
                  {d.latitude}
                </td>

                {/* Show the driver's current longitude (east-west position). */}
                <td className="px-4 py-3 font-mono text-dispatch-sub">
                  {d.longitude}
                </td>

                {/* Show which vehicle this driver is assigned to, or a dash when no vehicle is assigned yet. */}
                <td className="px-4 py-3 font-mono text-dispatch-sub">
                  {d.vehicle_id ?? '—'}
                </td>

                {/* Show edit and delete controls. */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 font-mono text-xs">
                    {/* Open the edit page for this driver. */}
                    <Link
                      href={`/drivers/${d.id}/edit`}
                      className="text-dispatch-sub hover:text-dispatch-text transition-colors"
                    >
                      edit
                    </Link>

                    {/* Ask for confirmation before deleting. */}
                    {confirmId === d.id ? (
                      <span className="flex items-center gap-2">
                        {/* Ask the user to confirm. */}
                        <span className="text-dispatch-sub">sure?</span>

                        {/* Confirm and start deleting. */}
                        <button
                          onClick={() => handleDelete(d.id)}
                          disabled={pendingId === d.id}
                          className="text-dispatch-danger hover:underline disabled:opacity-50"
                        >
                          {pendingId === d.id ? 'deleting…' : 'yes'}
                        </button>

                        {/* Cancel the confirmation. */}
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-dispatch-sub hover:underline"
                        >
                          no
                        </button>
                      </span>
                    ) : (
                      // If confirmation is not open, show the normal delete button.
                      <button
                        onClick={() => setConfirmId(d.id)}
                        className="text-dispatch-danger/80 hover:text-dispatch-danger transition-colors"
                      >
                        delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
