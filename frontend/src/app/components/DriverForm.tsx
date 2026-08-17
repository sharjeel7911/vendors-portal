'use client';
// This form runs in the browser because it keeps track of what the user types.

import { useState } from 'react'; // useState stores the current form values and status.
import { useRouter } from 'next/navigation'; // useRouter lets us move to another page after saving.
import { DriverInput, createDriver, updateDriver } from '@/lib/api'; // These describe and send driver data.
import { Field, PrimaryButton, GhostLink, ErrorBanner } from './ui'; // Reusable pieces of the interface.

// These are the choices the user can select for a driver's status.
const STATUSES = ['Active', 'Off Duty', 'On Leave', 'Suspended'];

// This component is used both for adding a driver and editing an existing driver.
export default function DriverForm({
  mode, // Tells the form whether we are adding or editing.
  driverId, // The ID is needed when we are editing a driver.
  initialValues, // Existing values are placed here when editing.
}: {
  mode: 'create' | 'edit'; // Only these two modes are allowed.
  driverId?: number; // The driver ID is optional because a new driver has no ID yet.
  initialValues?: Partial<DriverInput>; // Existing data is optional for a new driver.
}) {
  // This router is used after the save is complete.
  const router = useRouter();

  // Store everything currently entered in the form.
  const [form, setForm] = useState<DriverInput>({
    vendor_id: initialValues?.vendor_id ?? 0, // Use the old vendor ID, or 0 for a new driver.
    name: initialValues?.name ?? '', // Use the old name, or start empty.
    phone: initialValues?.phone ?? '', // Use the old phone number, or start empty.
    liscence_no: initialValues?.liscence_no ?? '', // Use the old license number, or start empty.
    working_hours: initialValues?.working_hours ?? '', // Use the old working hours, or start empty.
    status: initialValues?.status ?? STATUSES[0], // Use the old status, or choose Active.
    latitude: initialValues?.latitude ?? 0, // Use the old latitude, or 0 for a new driver.
    longitude: initialValues?.longitude ?? 0, // Use the old longitude, or 0 for a new driver.
    vehicle_id: initialValues?.vehicle_id ?? null, // Use the old assigned vehicle, or leave it empty for now.
  });

  // Store an error message when saving fails.
  const [error, setError] = useState<string | null>(null);

  // Remember whether the save request is currently running.
  const [submitting, setSubmitting] = useState(false);

  // This function runs when the user presses the save button.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // Stop the browser from refreshing the page.
    setError(null); // Remove any old error.
    setSubmitting(true); // Disable the save button while the request is running.

    try {
      // If this is a new driver, send the data as a create request.
      if (mode === 'create') {
        await createDriver(form);
      // Otherwise, if we have an ID, update that existing driver.
      } else if (driverId) {
        await updateDriver(driverId, form);
      }

      // After saving, go back to the drivers list.
      router.push('/drivers');

      // Ask Next.js to refresh the page data.
      router.refresh();
    } catch (err) {
      // Show the server's error when possible.
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      // Allow the button to be used again.
      setSubmitting(false);
    }
  }

  return (
    // The whole form uses the submit function above.
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {/* Only show the error box when an error exists. */}
      {error && <ErrorBanner message={error} />}

      {/* Ask for the vendor ID. */}
      <Field
        label="Vendor ID"
        type="number"
        required
        value={form.vendor_id}
        onChange={(e) =>
          setForm({ ...form, vendor_id: Number(e.target.value) })
        }
      />

      {/* Ask for the driver's name. */}
      <Field
        label="Name"
        type="text"
        required
        placeholder="e.g. Ahmed Raza"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      {/* Ask for the driver's phone number. */}
      <Field
        label="Phone"
        type="tel"
        required
        placeholder="e.g. 03001234567"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />

      {/* Ask for the driver's license number. */}
      <Field
        label="License No."
        type="text"
        required
        placeholder="e.g. LHR-88213"
        value={form.liscence_no}
        onChange={(e) => setForm({ ...form, liscence_no: e.target.value })}
      />

      {/* Ask for the driver's working hours. */}
      <Field
        label="Working Hours"
        type="text"
        required
        placeholder="e.g. 9:00 AM - 6:00 PM"
        value={form.working_hours}
        onChange={(e) => setForm({ ...form, working_hours: e.target.value })}
      />

      {/* The status is a dropdown because only the listed choices are allowed. */}
      <label className="block">
        {/* Show the dropdown title. */}
        <span className="block text-xs font-mono text-dispatch-sub mb-1.5 uppercase tracking-wide">
          Status
        </span>
        {/* Show the list of available statuses. */}
        <select
          required
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="w-full bg-dispatch-bg border border-dispatch-line rounded-md px-3 py-2 text-dispatch-text focus:border-dispatch-amber outline-none transition-colors"
        >
          {/* Turn each status into one dropdown option. */}
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {/* Ask for the driver's current latitude (north-south position). Decimal numbers like 31.5204 are allowed. */}
      <Field
        label="Latitude"
        type="number"
        step="any"
        required
        placeholder="e.g. 31.5204"
        value={form.latitude}
        onChange={(e) =>
          setForm({ ...form, latitude: Number(e.target.value) })
        }
      />

      {/* Ask for the driver's current longitude (east-west position). Decimal numbers like 74.3587 are allowed. */}
      <Field
        label="Longitude"
        type="number"
        step="any"
        required
        placeholder="e.g. 74.3587"
        value={form.longitude}
        onChange={(e) =>
          setForm({ ...form, longitude: Number(e.target.value) })
        }
      />

      {/* Ask which vehicle this driver is assigned to. This is optional, so it can be left blank for now and set later. */}
      <Field
        label="Vehicle ID (optional)"
        type="number"
        placeholder="e.g. 12 — leave blank if not assigned yet"
        // If nothing has been typed, show an empty box instead of the number 0.
        value={form.vehicle_id ?? ''}
        onChange={(e) => {
          // Read whatever the user typed into the box.
          const raw = e.target.value;
          // If the box is empty, save it as "no vehicle assigned" (null).
          // Otherwise, turn the typed text into a number.
          setForm({ ...form, vehicle_id: raw === '' ? null : Number(raw) });
        }}
      />

      {/* Put the save and cancel controls together. */}
      <div className="flex items-center gap-3 pt-2">
        {/* Change the button text while saving. */}
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting
            ? 'Saving…'
            : mode === 'create'
              ? 'Add driver'
              : 'Save changes'}
        </PrimaryButton>

        {/* Let the user leave without saving. */}
        <GhostLink href="/drivers">Cancel</GhostLink>
      </div>
    </form>
  );
}
