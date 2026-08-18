// This page shows all vehicles currently returned by the backend.
import Link from 'next/link'; // Used for the "Add vehicle" link.
import { fetchVehicles } from '@/lib/api'; // Gets vehicles from the backend.
import VehicleTable from '@/app/components/VehicleTable'; // Displays the vehicle table.
import { PrimaryButton, ErrorBanner } from '@/app/components/ui'; // Reusable interface pieces.

// Always request fresh vehicle data when this page is opened or refreshed.
export const dynamic = 'force-dynamic';

// This page is asynchronous because it waits for the API response.
export default async function VehiclesPage() {
  // This will contain the vehicle list after loading.
  let vehicles;

  // This stores an error if the API request fails.
  let loadError: string | null = null;

  try {
    // Ask the backend for all vehicles.
    vehicles = await fetchVehicles();
  } catch (err) {
    // Turn the error into a readable message.
    loadError =
      err instanceof Error
        ? err.message
        : 'Could not reach the vehicles API.';
  }

  return (
    // Keep the page sections separated.
    <div className="space-y-6">
      {/* Page heading and add button. */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-dispatch-amber tracking-widest mb-1">
            BOARD / 02
          </p>
          <h1 className="font-display text-2xl font-bold">Vehicles</h1>
        </div>

        {/* Open the form for a new vehicle. */}
        <Link href="/vehicles/new">
          <PrimaryButton type="button">Add vehicle</PrimaryButton>
        </Link>
      </div>

      {/* Show an error when loading fails, otherwise show the vehicle table. */}
      {loadError ? (
        <ErrorBanner
          message={`Failed to load vehicles: ${loadError}. Is the NestJS API running on ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}?`}
        />
      ) : (
        <VehicleTable vehicles={vehicles ?? []} />
      )}
    </div>
  );
}
