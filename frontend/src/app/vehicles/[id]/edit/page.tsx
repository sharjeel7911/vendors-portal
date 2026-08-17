// This page loads one vehicle and places its values into the edit form.
import { fetchVehicle } from '@/lib/api'; // Gets the selected vehicle from the backend.
import VehicleForm from '@/app/components/VehicleForm'; // Reuse the vehicle form.
import { ErrorBanner } from '@/app/components/ui'; // Displays a loading error.

// Always request fresh vehicle data.
export const dynamic = 'force-dynamic';

// The ID is taken from the URL, for example /vehicles/5/edit.
export default async function EditVehiclePage({
  params, // Contains the URL values.
}: {
  params: { id: string }; // The vehicle ID arrives as text.
}) {
  try {
    // Load the selected vehicle from the backend.
    const vehicle = await fetchVehicle(params.id);

    return (
      // Show the title and the edit form.
      <div className="space-y-6">
        <div>
          <p className="font-mono text-xs text-dispatch-amber tracking-widest mb-1">
            BOARD / 02
          </p>
          <h1 className="font-display text-2xl font-bold">
            Edit vehicle{' '}
            {/* Show the vehicle ID beside the title. */}
            <span className="text-dispatch-sub font-mono text-lg">
              #{vehicle.id}
            </span>
          </h1>
        </div>

        {/* Give the form the vehicle ID and existing values. */}
        <VehicleForm
          mode="edit"
          vehicleId={vehicle.id}
          initialValues={vehicle}
        />
      </div>
    );
  } catch (err) {
    // If the vehicle cannot be loaded, show the error instead.
    return (
      <ErrorBanner
        message={
          err instanceof Error
            ? err.message
            : 'Could not load this vehicle.'
        }
      />
    );
  }
}
