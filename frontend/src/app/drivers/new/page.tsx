// This page contains the form for adding a new driver.
import DriverForm from '../../components/DriverForm'; // Reuse the driver form component.

export default function NewDriverPage() {
  return (
    // Keep the title and form separated.
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs text-dispatch-amber tracking-widest mb-1">
          BOARD / 01
        </p>
        <h1 className="font-display text-2xl font-bold">Add driver</h1>
      </div>

      {/* Tell the form that we are creating a new driver. */}
      <DriverForm mode="create" />
    </div>
  );
}
