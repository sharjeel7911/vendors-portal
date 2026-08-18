// This page contains the form for adding a new vehicle.
import VehicleForm from '../../components/VehicleForm'; // Reuse the vehicle form component.

export default function NewVehiclePage() {
  return (
    // Keep the page heading and form separated.
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs text-dispatch-amber tracking-widest mb-1">
          BOARD / 02
        </p>
        <h1 className="font-display text-2xl font-bold">Add vehicle</h1>
      </div>

      {/* Tell the form that this is a new vehicle. */}
      <VehicleForm mode="create" />
    </div>
  );
}
