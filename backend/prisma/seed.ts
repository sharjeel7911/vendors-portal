import { PrismaClient } from '@prisma/client';
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding data...');
  await prisma.vendors.upsert({ where: { id: 1 }, update: {}, create: { id: 1, business_name: "Dummy Vendor", email: "dummy@vendor.com", status: "approved" } });

  // Create Drivers
  const driverNames = ['Ali Khan', 'Ahmed', 'Usman', 'Fahad', 'Imran', 'Hassan', 'Bilal', 'Omar'];
  const drivers = [];
  for (let i = 0; i < driverNames.length; i++) {
    const driver = await prisma.drivers.create({
      data: {
        name: driverNames[i],
        vendor_id: 1, // assuming vendor_id 1 exists or is just a dummy
        phone: `+92300000000${i}`,
        liscence_no: `LIC-${1000 + i}`,
        working_hours: '09:00-17:00',
        status: i < 3 ? 'IN_USE' : 'AVAILABLE',
        latitude: 31.5204 + (Math.random() * 0.05),
        longitude: 74.3587 + (Math.random() * 0.05)
      }
    });
    drivers.push(driver);
  }

  // Create Vehicles
  const vehicles = [];
  for (let i = 0; i < 8; i++) {
    const vehicle = await prisma.vehicles.create({
      data: {
        vendor_id: 1,
        type: 'VAN',
        capacity: 1000,
        depot: 'Lahore Central',
        plate_no: `VAN-0${i + 1}`,
        status: i < 3 ? 'IN_USE' : 'AVAILABLE',
      }
    });
    vehicles.push(vehicle);
  }

  // Create Orders (Stops)
  const orders = [];
  for (let i = 0; i < 128; i++) {
    const order = await prisma.orders.create({
      data: {
        vendor_id: 1,
        customer_name: `Customer ${i + 1}`,
        address: `Address ${i + 1}, Lahore`,
        coordinates: `${31.5204 + (Math.random() * 0.1)},${74.3587 + (Math.random() * 0.1)}`,
        time_window: '09:00-11:00',
        priority: 'normal',
        weight: Math.floor(Math.random() * 50) + 1,
        status: 'pending' // some could be delivered
      }
    });
    orders.push(order);
  }

  // Create Routes
  const routeConfigs = [
    { driverIndex: 0, vehicleIndex: 0, stops: 24, distance: 68, duration: 260, status: 'planned' },
    { driverIndex: 1, vehicleIndex: 1, stops: 18, distance: 52, duration: 220, status: 'planned' },
    { driverIndex: 2, vehicleIndex: 2, stops: 21, distance: 61, duration: 245, status: 'in_progress' },
    { driverIndex: null, vehicleIndex: null, stops: 15, distance: 40, duration: 180, status: 'planned' },
    { driverIndex: null, vehicleIndex: null, stops: 25, distance: 75, duration: 300, status: 'planned' },
    { driverIndex: null, vehicleIndex: null, stops: 25, distance: 46, duration: 195, status: 'planned' },
  ];

  let orderIndex = 0;
  for (const config of routeConfigs) {
    const route = await prisma.routes.create({
      data: {
        vendor_id: 1,
        driver_id: config.driverIndex !== null ? drivers[config.driverIndex].id : null,
        vehicle_id: config.vehicleIndex !== null ? vehicles[config.vehicleIndex].id : null,
        date: new Date('2026-08-17T00:00:00Z'),
        total_distance: config.distance,
        total_duration: config.duration,
        status: config.status,
        geometry: JSON.stringify({
          type: "LineString",
          coordinates: [
            [74.3587, 31.5204],
            [74.3700, 31.5250]
          ]
        })
      }
    });

    // Create Deliveries (Route Stops)
    for (let i = 0; i < config.stops; i++) {
      if (orderIndex >= orders.length) break;
      const order = orders[orderIndex];
      
      const isDelivered = config.status === 'in_progress' && i < 14;
      
      await prisma.deliveries.create({
        data: {
          route_id: route.id,
          order_id: order.id,
          sequence: i + 1,
          status: isDelivered ? 'delivered' : 'pending'
        }
      });
      orderIndex++;
    }
  }

  console.log('Seed completed.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
