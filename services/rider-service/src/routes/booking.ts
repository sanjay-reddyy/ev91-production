import express, { Request, Response } from 'express';

const router = express.Router();

// 2.1. Rental Plan Details
router.get('/plans', async (req: Request, res: Response) => {
  // TODO: Fetch plan types, vehicle types, inclusions/exclusions, pricing, T&C
  res.json({
    plans: [
      {
        type: 'Daily',
        price: 450,
        vehicleTypes: ['Scooter-EV', 'Bike-IC'],
        inclusions: ['GST', 'Insurance', 'Maintenance'],
        exclusions: ['Fuel'],
        insuranceStatus: 'Active',
        serviceInterval: '30 days',
        swapFrequency: '1/day',
        termsUrl: '/terms/daily',
      },
      {
        type: 'Weekly',
        price: 2800,
        vehicleTypes: ['Scooter-EV', 'Bike-IC'],
        inclusions: ['GST', 'Insurance', 'Maintenance'],
        exclusions: ['Fuel'],
        insuranceStatus: 'Active',
        serviceInterval: '30 days',
        swapFrequency: '2/week',
        termsUrl: '/terms/weekly',
      },
      {
        type: 'Monthly',
        price: 10000,
        vehicleTypes: ['Scooter-EV', 'Bike-IC'],
        inclusions: ['GST', 'Insurance', 'Maintenance'],
        exclusions: ['Fuel'],
        insuranceStatus: 'Active',
        serviceInterval: '30 days',
        swapFrequency: '8/month',
        termsUrl: '/terms/monthly',
      }
    ]
  });
});

// 2.2. Vehicle Selection
router.get('/vehicles', async (req: Request, res: Response) => {
  // TODO: Fetch available vehicles for a hub/location, add-ons, ratings, etc.
  // Example static response:
  res.json({
    vehicles: [
      {
        id: 1,
        model: 'Hero Electric Optima',
        type: 'Scooter-EV',
        battery: 85,
        lastServiced: '2025-07-06',
        rating: 4.5,
        addOns: ['Helmet', 'Mobile Holder', 'Delivery Box'],
      },
      {
        id: 2,
        model: 'IC Bike Model',
        type: 'Bike-IC',
        battery: 70,
        lastServiced: '2025-07-01',
        rating: 4.2,
        addOns: ['Helmet'],
      }
    ]
  });
});

export default router;
