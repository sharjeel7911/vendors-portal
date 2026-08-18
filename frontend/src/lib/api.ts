/**
 * Thin fetch wrapper for the Vendor Portal API.
 *
 * All requests are sent with credentials so the httpOnly access/refresh
 * cookies set by the NestJS backend are attached automatically. On a 401
 * we transparently try /auth/refresh once and replay the original request,
 * mirroring the logic already used by the auth context.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  { retry = true }: { retry?: boolean } = {},
): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: isFormData
      ? options.headers
      : { 'Content-Type': 'application/json', ...options.headers },
  });

  if (res.status === 401 && retry) {
    const refreshed = await doRefresh();
    if (refreshed) {
      return request<T>(path, options, { retry: false });
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {
      // ignore body parse failures
    }
    throw new ApiError(Array.isArray(message) ? message.join(', ') : message, res.status);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const get = <T>(path: string) => request<T>(path, { method: 'GET' });
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined });
const patch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined });
const put = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });
const postForm = <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form });

// ---------------------------------------------------------------------------
// Types (mirroring the shapes returned by the NestJS services)
// ---------------------------------------------------------------------------

export interface RouteSummary {
  totalRoutes: number;
  totalStops: number;
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  activeDrivers: number;
  activeVehicles: number;
}

export interface RouteListItem {
  id: string;
  driver: { id: string; name: string } | null;
  vehicle: { id: string; name: string } | null;
  stops: number;
  distanceKm: number;
  durationMinutes: number;
  status: string;
  completedStops: number;
  totalStops: number;
}

export interface RouteStop {
  sequence: number | null;
  orderId: string;
  address: string | null | undefined;
  latitude: number | null;
  longitude: number | null;
  status: string;
}

export interface RouteDetail {
  id: string;
  status: string;
  driver: { id: string; name: string } | null;
  vehicle: { id: string; name: string; capacity: number } | null;
  stops: RouteStop[];
  distanceKm: number;
  durationMinutes: number;
  completedStops: number;
  totalStops: number;
  geometry: string | null;
}

export interface Driver {
  id: string;
  /** The raw numeric Prisma id — needed for update/delete calls (id above is `driver_${rawId}`). */
  rawId: number;
  name: string;
  phone: string;
  status: string;
  currentRouteId: string | null;
  latitude: number;
  longitude: number;
}

export interface Vehicle {
  id: string;
  /** The raw numeric Prisma id — needed for update/delete calls (id above is `vehicle_${rawId}`). */
  rawId: number;
  vehicleNumber: string;
  type: string;
  capacity: number;
  status: string;
  driverId: string | null;
}

/** Full record returned by GET /api/drivers/:id — used to prefill the edit form. */
export interface DriverDetail {
  id: number;
  vendor_id: number;
  name: string;
  phone: string;
  liscence_no: string;
  working_hours: string;
  status: string;
  vehicle_id: number | null;
  latitude: number;
  longitude: number;
}

export type NewDriverInput = {
  vendor_id: number;
  name: string;
  phone: string;
  liscence_no: string;
  working_hours: string;
  status: string;
  latitude: number;
  longitude: number;
  vehicle_id?: number | null;
};

/** Full record returned by GET /api/vehicles/:id — used to prefill the edit form. */
export interface VehicleDetail {
  id: number;
  vendor_id: number;
  type: string;
  capacity: number;
  depot: string;
  plate_no: string;
  status: string;
}

export type NewVehicleInput = {
  vendor_id: number;
  type: string;
  capacity: number;
  depot: string;
  plate_no: string;
  status?: string;
};

export interface Order {
  id: number;
  vendor_id: number | null;
  customer_name: string | null;
  address: string | null;
  coordinates: string | null;
  time_window: string | null;
  priority: string | null;
  weight: number | null;
  notes: string | null;
  status: string;
  created_at: string | null;
}

export type NewOrderInput = {
  vendor_id: number;
  customer_name: string;
  address: string;
  coordinates: string;
  time_window: string;
  priority: string;
  weight: number;
  notes: string;
  status: string;
};

// ---------------------------------------------------------------------------
// Raw backend record shapes (drivers/vehicles controllers pass Prisma rows
// straight through — snake_case fields, no ?status filtering, no envelope —
// unlike routes/stops which already return the shapes above). The two
// mapDriver/mapVehicle helpers below translate them into the camelCase
// shapes the rest of this app is built against.
// ---------------------------------------------------------------------------

interface RawDriver {
  id: number;
  name: string;
  phone: string;
  status: string;
  vehicle_id: number | null;
  latitude: number;
  longitude: number;
}

interface RawVehicle {
  id: number;
  type: string;
  capacity: number;
  plate_no: string;
  status: string;
}

function mapDriver(d: RawDriver): Driver {
  return {
    id: `driver_${d.id}`,
    rawId: d.id,
    name: d.name,
    phone: d.phone,
    status: d.status,
    currentRouteId: null,
    latitude: d.latitude,
    longitude: d.longitude,
  };
}

function mapVehicle(v: RawVehicle, drivers: RawDriver[]): Vehicle {
  const assignedDriver = drivers.find((d) => d.vehicle_id === v.id);
  return {
    id: `vehicle_${v.id}`,
    rawId: v.id,
    vehicleNumber: v.plate_no,
    type: v.type,
    capacity: v.capacity,
    status: v.status,
    driverId: assignedDriver ? `driver_${assignedDriver.id}` : null,
  };
}

export const api = {
  // Auth ----------------------------------------------------------------
  login: (data: { email: string; password: string }) =>
    post<{ user: unknown }>('/auth/login', data),
  register: (data: { businessName: string; name: string; email: string; password: string }) =>
    post<unknown>('/auth/register', data),
  logout: () => post<{ status: string }>('/auth/logout'),
  me: () => get<unknown>('/auth/me'),

  // Routes ----------------------------------------------------------------
  getRouteSummary: () => get<RouteSummary>('/api/routes/summary'),
  getRoutes: (filters: Record<string, string> = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return get<{ routes: RouteListItem[] }>(`/api/routes${qs ? `?${qs}` : ''}`);
  },
  getRoute: (id: string) => get<RouteDetail>(`/api/routes/${id}`),
  createRoute: (data: { date: string; driverId?: string | null; vehicleId?: string | null; stopIds?: string[] }) =>
    post<RouteDetail>('/api/routes', data),
  assignDriver: (routeId: string, driverId: string) =>
    patch<{ success: boolean }>(`/api/routes/${routeId}/driver`, { driverId }),
  assignVehicle: (routeId: string, vehicleId: string) =>
    patch<{ success: boolean }>(`/api/routes/${routeId}/vehicle`, { vehicleId }),
  updateRouteStatus: (routeId: string, status: string) =>
    patch<{ success: boolean }>(`/api/routes/${routeId}/status`, { status }),
  dispatchRoute: (routeId: string) => post<{ success: boolean }>(`/api/routes/${routeId}/dispatch`),
  optimizeRoutes: (data: unknown = {}) =>
    post<{ success: boolean; routesCreated: number; distanceReductionPercent: number; estimatedTimeReductionPercent: number }>(
      '/api/routes/optimize',
      data,
    ),

  // Drivers -----------------------------------------------------------------
  // GET /api/drivers ignores ?status and returns a bare array, so filtering
  // and reshaping both happen here (see mapDriver above).
  getDrivers: async (status?: string) => {
    const raw = await get<RawDriver[]>('/api/drivers');
    const drivers = raw.filter((d) => !status || d.status === status).map(mapDriver);
    return { drivers };
  },
  getDriverDetail: (rawId: number) => get<DriverDetail>(`/api/drivers/${rawId}`),
  createDriver: (data: NewDriverInput) => post<DriverDetail>('/api/drivers', data),
  updateDriver: (rawId: number, data: Partial<NewDriverInput>) => put<DriverDetail>(`/api/drivers/${rawId}`, data),
  deleteDriver: (rawId: number) => del<{ message: string }>(`/api/drivers/${rawId}`),

  // Vehicles ----------------------------------------------------------------
  // Same story as drivers, plus vehicles carry no driver_id of their own —
  // it's derived here from the drivers list (see mapVehicle above).
  getVehicles: async (status?: string) => {
    const [rawVehicles, rawDrivers] = await Promise.all([
      get<RawVehicle[]>('/api/vehicles'),
      get<RawDriver[]>('/api/drivers'),
    ]);
    const vehicles = rawVehicles
      .filter((v) => !status || v.status === status)
      .map((v) => mapVehicle(v, rawDrivers));
    return { vehicles };
  },
  getVehicleDetail: (rawId: number) => get<VehicleDetail>(`/api/vehicles/${rawId}`),
  createVehicle: (data: NewVehicleInput) => post<VehicleDetail>('/api/vehicles', data),
  updateVehicle: (rawId: number, data: Partial<NewVehicleInput>) => put<VehicleDetail>(`/api/vehicles/${rawId}`, data),
  deleteVehicle: (rawId: number) => del<{ message: string }>(`/api/vehicles/${rawId}`),

  // Stops (order-derived, un-scheduled stops) -------------------------------
  getStops: (status?: string) =>
    get<{ stops: { id: string; orderId: string; address: string; latitude: number | null; longitude: number | null; status: string; timeWindow: { start: string; end: string } | null }[] }>(
      `/api/stops${status ? `?status=${status}` : ''}`,
    ),

  // Orders --------------------------------------------------------------
  getOrders: () => get<Order[]>('/api/orders'),
  getOrder: (id: number) => get<Order>(`/api/orders/${id}`),
  createOrder: (data: NewOrderInput) => post<Order>('/api/orders', data),
  updateOrder: (id: number, data: NewOrderInput) => patch<Order>(`/api/orders/${id}`, data),
  updateOrderStatus: (id: number, status: string) => patch<Order>(`/api/orders/${id}/status`, { status }),
  deleteOrder: (id: number) => del<{ message: string }>(`/api/orders/${id}`),
  importOrders: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return postForm<{ message: string; imported: number; errors: { row: number; error: string }[] }>(
      '/api/orders/import',
      form,
    );
  },
};

export { API_URL };
