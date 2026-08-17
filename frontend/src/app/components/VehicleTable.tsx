'use client';
// This component displays vehicles and provides edit and delete controls.

import { useState } from 'react'; // Stores error and delete-confirmation information.
import { useRouter } from 'next/navigation'; // Refreshes the list after a delete.
import Link from 'next/link'; // Creates links to the vehicle pages.
import { Vehicle, deleteVehicle } from '@/lib/api'; // Vehicle type and delete request.
import { ErrorBanner, EmptyState, PrimaryButton } from './ui'; // Reusable interface pieces.

// Receive the vehicles from the page and show them in a table.
export default function VehicleTable({ vehicles }: { vehicles: Vehicle[] }) {
  // Get the router so the page can refresh after deletion.
  const router = useRouter();

  // Store an error message if deleting fails.
  const [error, setError] = useState<string | null>(null);

  // Remember which vehicle is currently being deleted.
  const [pendingId, setPendingId] = useState<number | null>(null);

  // Remember which vehicle is waiting for delete confirmation.
  const [confirmId, setConfirmId] = useState<number | null>(null);

  // Delete a vehicle after confirmation.
  async function handleDelete(id: number) {
    setError(null); // Clear an old error.
    setPendingId(id); // Mark this vehicle as being deleted.

    try {
      // Ask the backend to delete the vehicle.
      await deleteVehicle(id);

      // Refresh the page so the table gets the latest data.
      router.refresh();
    } catch (err) {
      // Show the error returned by the backend.
      setError(err instanceof Error ? err.message : 'Failed to delete vehicle.');
    } finally {
      // Stop showing the delete as active.
      setPendingId(null);

      // Close the confirmation controls.
      setConfirmId(null);
    }
  }

  // Show an empty message when there are no vehicles.
  if (vehicles.length === 0) {
    return (
      <EmptyState
        title="No vehicles yet"
        description="Add your first vehicle to start building the fleet."
        action={
          <Link href="/vehicles/new">
            <PrimaryButton type="button">Add vehicle</PrimaryButton>
          </Link>
        }
      />
    );
  }

  return (
    // Keep the error and table separated by some space.
    <div className="space-y-4">
      {/* Show an error only when one exists. */}
      {error && <ErrorBanner message={error} />}

      {/* Add a border and rounded corners around the table. */}
      <div className="border border-dispatch-line rounded-lg overflow-hidden">
        {/* The table fills the available width. */}
        <table className="w-full text-sm">
          {/* Column names appear at the top. */}
          <thead>
            <tr className="bg-dispatch-panel border-b border-dispatch-line text-left font-mono text-xs text-dispatch-sub uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Plate</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Capacity</th>
              <th className="px-4 py-3 font-medium">Depot</th>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>

          {/* Each vehicle becomes one table row. */}
          <tbody>
            {vehicles.map((v) => (
              // The vehicle ID gives React a stable key for this row.
              <tr
                key={v.id}
                className="border-b border-dispatch-line last:border-0 hover:bg-dispatch-panel/50 transition-colors"
              >
                {/* Show the vehicle plate number. */}
                <td className="px-4 py-3 font-mono text-dispatch-amber">
                  {v.plate_no}
                </td>

                {/* Show the vehicle type. */}
                <td className="px-4 py-3">{v.type}</td>

                {/* Show the vehicle capacity. */}
                <td className="px-4 py-3 font-mono">{v.capacity}</td>

                {/* Show the depot. */}
                <td className="px-4 py-3 text-dispatch-sub">{v.depot}</td>

                {/* Show the vendor ID. */}
                <td className="px-4 py-3 font-mono text-dispatch-sub">
                  #{v.vendor_id}
                </td>

                {/* Show edit and delete controls. */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 font-mono text-xs">
                    {/* Open the edit page for this vehicle. */}
                    <Link
                      href={`/vehicles/${v.id}/edit`}
                      className="text-dispatch-sub hover:text-dispatch-text transition-colors"
                    >
                      edit
                    </Link>

                    {/* Show confirmation controls when this vehicle is selected for deletion. */}
                    {confirmId === v.id ? (
                      <span className="flex items-center gap-2">
                        {/* Ask whether the user is sure. */}
                        <span className="text-dispatch-sub">sure?</span>

                        {/* Confirm the deletion. */}
                        <button
                          onClick={() => handleDelete(v.id)}
                          disabled={pendingId === v.id}
                          className="text-dispatch-danger hover:underline disabled:opacity-50"
                        >
                          {pendingId === v.id ? 'deleting…' : 'yes'}
                        </button>

                        {/* Cancel the deletion. */}
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-dispatch-sub hover:underline"
                        >
                          no
                        </button>
                      </span>
                    ) : (
                      // Otherwise show the normal delete button.
                      <button
                        onClick={() => setConfirmId(v.id)}
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
