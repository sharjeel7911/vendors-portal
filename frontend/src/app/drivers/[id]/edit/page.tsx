// This page loads a driver and puts its values into the editing form.
import { fetchDriver } from '@/lib/api'; // Gets the selected driver from the backend.
import DriverForm from '@/app/components/DriverForm'; // Reuse the same form used for creating drivers.
import { ErrorBanner } from '@/app/components/ui'; // Shows an error if the driver cannot be loaded.

// Always request fresh driver data.
export const dynamic = 'force-dynamic';

// The ID comes from the URL, for example /drivers/5/edit.
export default async function EditDriverPage({
  params, // Contains the values captured from the URL.
}: {
  params: { id: string }; // The driver ID is received from the URL as text.s
}) {
  try {
    // Load the driver using the ID from the URL.
    const driver = await fetchDriver(params.id);

    return (
      // Show the heading and edit form.
      <div className="space-y-6">
        <div>
          <p className="font-mono text-xs text-dispatch-amber tracking-widest mb-1">
            BOARD / 01
          </p>
          <h1 className="font-display text-2xl font-bold">
            Edit driver{' '}
            {/* Show the driver's ID beside the title. */}
            <span className="text-dispatch-sub font-mono text-lg">
              #{driver.id}
            </span>
          </h1>
        </div>

        {/* Pass the existing driver values to the form and tell it to edit. */}
        <DriverForm mode="edit" driverId={driver.id} initialValues={driver} />
      </div>
    );
  } catch (err) {
    // If loading fails, show the error instead of the form.
    return (
      <ErrorBanner
        message={err instanceof Error ? err.message : 'Could not load this driver.'}
      />
    );
  }
}
