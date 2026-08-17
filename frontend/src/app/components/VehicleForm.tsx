'use client';
// This form runs in the browser so it can react immediately to user input.

import { useState } from 'react'; // Keeps the current form values and saving state.
import { useRouter } from 'next/navigation'; // Lets us move back to the vehicle list.
import { VehicleInput, createVehicle, updateVehicle } from '@/lib/api'; // Vehicle data and API functions.
import { Field, PrimaryButton, GhostLink, ErrorBanner } from './ui'; // Reusable interface pieces.

// These are the vehicle types the user can choose from.
const VEHICLE_TYPES = ['Truck', 'Van', 'Bike', 'Car', 'Bus'];

// This component handles both creating and editing vehicles.
export default function VehicleForm({
  mode, // Tells us whether this is a new vehicle or an edit.
  vehicleId, // ID of the vehicle being edited, when there is one.
  initialValues, // Existing vehicle values when editing.
}: {
  mode: 'create' | 'edit'; // The two supported form modes.
  vehicleId?: number; // Optional because a new vehicle does not have an ID yet.
  initialValues?: Partial<VehicleInput>; // Optional starting values.
}) {
  // Create a router for navigation after saving.
  const router = useRouter();

  // Store the values currently entered in the form.
  const [form, setForm] = useState<VehicleInput>({
    vendor_id: initialValues?.vendor_id ?? 0, // Existing vendor ID or 0 for a new record.
    type: initialValues?.type ?? VEHICLE_TYPES[0], // Existing type or Truck by default.
    capacity: initialValues?.capacity ?? 1, // Existing capacity or 1 by default.
    depot: initialValues?.depot ?? '', // Existing depot or an empty field.
    plate_no: initialValues?.plate_no ?? '', // Existing plate number or an empty field.
  });

  // Store an error message when something goes wrong.
  const [error, setError] = useState<string | null>(null);

  // Remember whether the form is currently being saved.
  const [submitting, setSubmitting] = useState(false);

  // This function runs when the form is submitted.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // Prevent a normal browser page refresh.
    setError(null); // Clear an old error.
    setSubmitting(true); // Show that saving has started.

    try {
      // Create a new vehicle when the form is in create mode.
      if (mode === 'create') {
        await createVehicle(form);
      // Otherwise update the existing vehicle.
      } else if (vehicleId) {
        await updateVehicle(vehicleId, form);
      }

      // Return to the vehicle list after saving.
      router.push('/vehicles');

      // Refresh the page data.
      router.refresh();
    } catch (err) {
      // Display a useful error if the API request fails.
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      // Saving is finished, so enable the button again.
      setSubmitting(false);
    }
  }

  return (
    // Connect the form to the submit function.
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {/* Show an error only when one exists. */}
      {error && <ErrorBanner message={error} />}

      {/* Ask which vendor owns the vehicle. */}
      <Field
        label="Vendor ID"
        type="number"
        required
        value={form.vendor_id}
        onChange={(e) =>
          setForm({ ...form, vendor_id: Number(e.target.value) })
        }
      />

      {/* Show the vehicle type dropdown. */}
      <label className="block">
        {/* Title displayed above the dropdown. */}
        <span className="block text-xs font-mono text-dispatch-sub mb-1.5 uppercase tracking-wide">
          Type
        </span>
        {/* Let the user select one vehicle type. */}
        <select
          required
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="w-full bg-dispatch-bg border border-dispatch-line rounded-md px-3 py-2 text-dispatch-text focus:border-dispatch-amber outline-none transition-colors"
        >
          {/* Create one option for every vehicle type. */}
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      {/* Ask for the vehicle capacity. */}
      <Field
        label="Capacity"
        type="number"
        required
        min={1}
        value={form.capacity}
        onChange={(e) =>
          setForm({ ...form, capacity: Number(e.target.value) })
        }
      />

      {/* Ask which depot the vehicle belongs to. */}
      <Field
        label="Depot"
        type="text"
        required
        placeholder="e.g. Lahore Depot A"
        value={form.depot}
        onChange={(e) => setForm({ ...form, depot: e.target.value })}
      />

      {/* Ask for the vehicle's plate number. */}
      <Field
        label="Plate No."
        type="text"
        required
        placeholder="e.g. LEA-4521"
        value={form.plate_no}
        onChange={(e) => setForm({ ...form, plate_no: e.target.value })}
      />

      {/* Keep the save and cancel controls together. */}
      <div className="flex items-center gap-3 pt-2">
        {/* Show a different label while the request is running. */}
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting
            ? 'Saving…'
            : mode === 'create'
              ? 'Add vehicle'
              : 'Save changes'}
        </PrimaryButton>

        {/* Leave the form without saving. */}
        <GhostLink href="/vehicles">Cancel</GhostLink>
      </div>
    </form>
  );
}
