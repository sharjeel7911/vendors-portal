// This file contains all the functions that talk to the backend API.
// The pages and forms use these functions instead of writing fetch requests themselves.

// Use the API URL from the environment when it is available.
// If it is not available, use the local NestJS API address.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// These fields describe one driver returned by the backend.
export interface Driver {
  id: number; // Unique ID of the driver.
  vendor_id: number; // ID of the vendor who owns or manages the driver.
  name: string; // Driver's name.
  phone: string; // Driver's phone number.
  liscence_no: string; // Driver's license number.
  working_hours: string; // Driver's normal working hours.
  status: string; // Current driver status.
  latitude: number; // North-south position of the driver right now (a decimal number).
  longitude: number; // East-west position of the driver right now (a decimal number).
  vehicle_id: number | null; // Which vehicle this driver is assigned to. Can be empty (null) if no vehicle is assigned yet.
  created_at: string; // Date and time when the record was created.
}

// This is the same driver data without fields created automatically by the backend.
export type DriverInput = Omit<Driver, 'id' | 'created_at'>;

// These fields describe one vehicle returned by the backend.
export interface Vehicle {
  id: number; // Unique ID of the vehicle.
  vendor_id: number; // ID of the vendor connected to the vehicle.
  type: string; // Vehicle type such as Truck or Van.
  capacity: number; // Number representing the vehicle's capacity.
  depot: string; // Depot where the vehicle belongs.
  plate_no: string; // Vehicle registration/plate number.
  created_at: string; // Date and time when the record was created.
}

// This is the vehicle data needed when creating or editing a vehicle.
export type VehicleInput = Omit<Vehicle, 'id' | 'created_at'>;

// This helper checks the server response and turns it into the expected data type.
async function handle<T>(res: Response): Promise<T> {
  // If the server says the request failed, prepare a useful error message.
  if (!res.ok) {
    // Start with a general message containing the HTTP status code.
    let message = `Request failed with status ${res.status}`;

    // Try to read a more useful error message from the server.
    try {
      // Read the response as JSON.
      const body = await res.json();

      // Use the server's message when it exists.
      message = body.message || message;
    } catch {
      // Some responses have no JSON body, so keep the original message.
    }

    // Stop here and send the error back to the code that called this function.
    throw new Error(message);
  }

  // Read the successful response as text first.
  // This also works when DELETE returns an empty response.
  const text = await res.text();

  // Turn JSON text into an object, or return nothing when the response is empty.
  return text ? JSON.parse(text) : (undefined as T);
}

// ---------- Vehicles ----------
// The functions below are used for vehicle-related requests.

// Get all vehicles from the backend.
export async function fetchVehicles(): Promise<Vehicle[]> {
  // Ask the backend for the vehicle list and avoid using an old cached result.
  const res = await fetch(`${API_URL}/vehicles`, { cache: 'no-store' });

  // Check the response and return the vehicle list.
  return handle<Vehicle[]>(res);
}

// Get one vehicle by its ID.
export async function fetchVehicle(id: number | string): Promise<Vehicle> {
  // Build the URL using the supplied vehicle ID.
  const res = await fetch(`${API_URL}/vehicles/${id}`, { cache: 'no-store' });

  // Check the response and return the vehicle.
  return handle<Vehicle>(res);
}

// Create a new vehicle.
export async function createVehicle(data: VehicleInput): Promise<Vehicle> {
  // Send the new vehicle data to the backend.
  const res = await fetch(`${API_URL}/vehicles`, {
    method: 'POST', // POST means we are creating something new.
    headers: { 'Content-Type': 'application/json' }, // Tell the server that the data is JSON.
    body: JSON.stringify(data), // Convert the JavaScript object into JSON text.
  });

  // Check the response and return the created vehicle.
  return handle<Vehicle>(res);
}

// Update an existing vehicle.
export async function updateVehicle(
  id: number | string,
  data: Partial<VehicleInput>,
): Promise<Vehicle> {
  // Send the changed vehicle information to the backend.
  const res = await fetch(`${API_URL}/vehicles/${id}`, {
    method: 'PUT', // PUT means we are updating an existing record.
    headers: { 'Content-Type': 'application/json' }, // Tell the server that the data is JSON.
    body: JSON.stringify(data), // Convert the updated values into JSON text.
  });

  // Check the response and return the updated vehicle.
  return handle<Vehicle>(res);
}

// Delete a vehicle using its ID.
export async function deleteVehicle(id: number | string): Promise<{ message: string }> {
  // Ask the backend to remove this vehicle.
  const res = await fetch(`${API_URL}/vehicles/${id}`, { method: 'DELETE' });

  // Check the response and return the server's message.
  return handle<{ message: string }>(res);
}

// ---------- Drivers ----------
// The functions below are used for driver-related requests.

// Get all drivers from the backend.
export async function fetchDrivers(): Promise<Driver[]> {
  // Ask the backend for the driver list.
  const res = await fetch(`${API_URL}/drivers`, { cache: 'no-store' });

  // Check the response and return the drivers.
  return handle<Driver[]>(res);
}

// Get one driver by its ID.
export async function fetchDriver(id: number | string): Promise<Driver> {
  // Build the URL using the supplied driver ID.
  const res = await fetch(`${API_URL}/drivers/${id}`, { cache: 'no-store' });

  // Check the response and return the driver.
  return handle<Driver>(res);
}

// Create a new driver.
export async function createDriver(data: DriverInput): Promise<Driver> {
  // Send the new driver's data to the backend.
  const res = await fetch(`${API_URL}/drivers`, {
    method: 'POST', // POST creates a new record.
    headers: { 'Content-Type': 'application/json' }, // Tell the server the body is JSON.
    body: JSON.stringify(data), // Convert the driver object into JSON text.
  });

  // Check the response and return the created driver.
  return handle<Driver>(res);
}

// Update an existing driver.
export async function updateDriver(
  id: number | string,
  data: Partial<DriverInput>,
): Promise<Driver> {
  // Send the changed driver information to the backend.
  const res = await fetch(`${API_URL}/drivers/${id}`, {
    method: 'PUT', // PUT updates an existing record.
    headers: { 'Content-Type': 'application/json' }, // Tell the server the body is JSON.
    body: JSON.stringify(data), // Convert the updated values into JSON text.
  });

  // Check the response and return the updated driver.
  return handle<Driver>(res);
}

// Delete a driver using its ID.
export async function deleteDriver(id: number | string): Promise<{ message: string }> {
  // Ask the backend to remove this driver.
  const res = await fetch(`${API_URL}/drivers/${id}`, { method: 'DELETE' });

  // Check the response and return the server's message.
  return handle<{ message: string }>(res);
}
