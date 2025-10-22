import { Router, Request, Response } from "express";
import axios from "axios";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Service URLs from environment
const VEHICLE_SERVICE_URL =
  process.env.VEHICLE_SERVICE_URL || "http://localhost:4001";
const RIDER_SERVICE_URL =
  process.env.RIDER_SERVICE_URL || "http://localhost:4003";
const CLIENT_STORE_SERVICE_URL =
  process.env.CLIENT_STORE_SERVICE_URL || "http://localhost:4004";
const SPARE_PARTS_SERVICE_URL =
  process.env.SPARE_PARTS_SERVICE_URL || "http://localhost:4006";
const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://localhost:4007";

/**
 * Helper function to make authenticated requests to services
 */
const fetchFromService = async (url: string, token?: string) => {
  try {
    const response = await axios.get(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 10000,
    });
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching from ${url}:`, error.message);
    return null;
  }
};

/**
 * @route GET /api/dashboard/operations
 * @desc Get Operations Dashboard data (real-time operations metrics)
 */
router.get(
  "/operations",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");

      // Fetch data from multiple services in parallel
      const [ridersData, vehiclesData, ordersData] = await Promise.all([
        fetchFromService(`${RIDER_SERVICE_URL}/api/riders`, token),
        fetchFromService(`${VEHICLE_SERVICE_URL}/api/vehicles`, token),
        fetchFromService(`${ORDER_SERVICE_URL}/api/orders/stats`, token),
      ]);

      // Calculate operations metrics
      const riders = ridersData?.data || [];
      const vehicles = vehiclesData?.data || [];
      const orderStats = ordersData?.data || {};

      const activeRiders = riders.filter(
        (r: any) => r.status === "ACTIVE" || r.isActive
      ).length;
      const totalRiders = riders.length;

      const metrics = {
        department: "OPERATIONS",
        lastUpdated: new Date(),

        // Real-time metrics
        activeRiders,
        totalRiders,
        ongoingDeliveries: orderStats.ongoingOrders || 0,
        pendingPickups: orderStats.pendingOrders || 0,
        completedDeliveriesToday: orderStats.completedToday || 0,

        // Performance metrics
        avgDeliveryTime: orderStats.avgDeliveryTime || 0,
        onTimeDeliveryRate: orderStats.onTimeRate || 0,
        customerSatisfaction: orderStats.satisfaction || 0,

        // Efficiency
        riderUtilization:
          totalRiders > 0 ? (activeRiders / totalRiders) * 100 : 0,
        avgDeliveriesPerRider:
          totalRiders > 0 ? (orderStats.completedToday || 0) / totalRiders : 0,

        // Issues
        delayedDeliveries: orderStats.delayedOrders || 0,
        failedDeliveries: orderStats.failedOrders || 0,

        // Resources
        activeVehicles: vehicles.filter((v: any) => v.status === "ACTIVE")
          .length,
        totalVehicles: vehicles.length,

        // Live riders (top 20)
        liveRiders: riders.slice(0, 20).map((r: any) => ({
          riderId: r.id,
          name: `${r.firstName || ""} ${r.lastName || ""}`.trim(),
          status: r.status || "UNKNOWN",
          location: r.location || { latitude: 0, longitude: 0 },
          todayDeliveries: r.todayDeliveries || 0,
          todayEarnings: r.todayEarnings || 0,
        })),
      };

      res.json({
        success: true,
        data: metrics,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error("Operations dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch operations dashboard data",
        error: error.message,
      });
    }
  }
);

/**
 * @route GET /api/dashboard/vehicles
 * @desc Get EV Vehicle Team Dashboard data
 */
router.get("/vehicles", authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    // Fetch vehicle analytics
    const [vehiclesData, analyticsData, sparePartsData] = await Promise.all([
      fetchFromService(`${VEHICLE_SERVICE_URL}/api/vehicles`, token),
      fetchFromService(
        `${VEHICLE_SERVICE_URL}/api/v1/analytics/fleet-performance`,
        token
      ),
      fetchFromService(
        `${SPARE_PARTS_SERVICE_URL}/api/spare-parts/dashboard/stats`,
        token
      ),
    ]);

    const vehicles = vehiclesData?.data || [];
    const analytics = analyticsData?.data || {};
    const spareStats = sparePartsData?.data || {};

    // Calculate vehicle metrics
    const activeVehicles = vehicles.filter(
      (v: any) => v.status === "ACTIVE"
    ).length;
    const inMaintenanceVehicles = vehicles.filter(
      (v: any) => v.status === "MAINTENANCE" || v.status === "IN_SERVICE"
    ).length;

    const metrics = {
      department: "EV_VEHICLE_TEAM",
      lastUpdated: new Date(),

      // Fleet overview
      totalVehicles: vehicles.length,
      activeVehicles,
      inactiveVehicles: vehicles.length - activeVehicles,

      // Health metrics
      avgFleetHealth: analytics.avgHealthScore || 0,
      avgBatteryHealth: analytics.avgBatteryHealth || 0,
      vehiclesUnderMaintenance: inMaintenanceVehicles,

      // Maintenance
      overdueMaintenance: analytics.overdueMaintenanceCount || 0,
      scheduledMaintenanceToday: analytics.scheduledToday || 0,

      // Performance
      avgDailyDistance: analytics.avgDailyDistance || 0,
      totalDistanceCovered: analytics.totalDistance || 0,

      // Costs
      maintenanceCostMTD: analytics.maintenanceCostMTD || 0,
      avgCostPerVehicle: analytics.avgCostPerVehicle || 0,

      // Status distribution
      vehiclesByStatus: [
        { status: "ACTIVE", count: activeVehicles },
        { status: "MAINTENANCE", count: inMaintenanceVehicles },
        {
          status: "IDLE",
          count: vehicles.filter((v: any) => v.status === "IDLE").length,
        },
      ],
    };

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error("Vehicle dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle dashboard data",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/dashboard/inventory
 * @desc Get Inventory Team Dashboard data
 */
router.get(
  "/inventory",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");

      const sparePartsData = await fetchFromService(
        `${SPARE_PARTS_SERVICE_URL}/api/spare-parts/dashboard/stats`,
        token
      );

      const stats = sparePartsData?.data || {};

      const metrics = {
        department: "INVENTORY_TEAM",
        lastUpdated: new Date(),

        // Stock overview
        totalSKUs: stats.totalParts || 0,
        totalValue: stats.totalValue || 0,
        inStockItems: stats.totalParts - (stats.lowStockAlerts || 0),
        lowStockItems: stats.lowStockAlerts || 0,
        outOfStockItems: 0,

        // Movement
        monthlyConsumption: stats.monthlyUsage || 0,
        avgTurnoverRate: stats.inventoryTurnover || 0,

        // Procurement
        pendingPurchaseOrders: stats.pendingOrders || 0,

        // Category breakdown
        categoryBreakdown: stats.topCategories || [],

        // Critical items
        criticalItems: stats.lowStockItems || [],
      };

      res.json({
        success: true,
        data: metrics,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error("Inventory dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch inventory dashboard data",
        error: error.message,
      });
    }
  }
);

/**
 * @route GET /api/dashboard/sales
 * @desc Get Sales Dashboard data
 */
router.get("/sales", authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    const [clientsData, storesData] = await Promise.all([
      fetchFromService(`${CLIENT_STORE_SERVICE_URL}/api/clients`, token),
      fetchFromService(`${CLIENT_STORE_SERVICE_URL}/api/stores`, token),
    ]);

    const clients = clientsData?.data || [];
    const stores = storesData?.data || [];

    // Calculate sales metrics
    const activeClients = clients.filter((c: any) => c.isActive).length;

    // Group stores by city
    const storesByCity = stores.reduce((acc: any, store: any) => {
      const city = store.city || "Unknown";
      if (!acc[city]) {
        acc[city] = { city, count: 0, revenue: 0 };
      }
      acc[city].count++;
      return acc;
    }, {});

    const metrics = {
      department: "SALES",
      lastUpdated: new Date(),

      // Client metrics
      totalClients: clients.length,
      activeClients,
      newClientsThisMonth: clients.filter((c: any) => {
        const createdDate = new Date(c.createdAt);
        const now = new Date();
        return (
          createdDate.getMonth() === now.getMonth() &&
          createdDate.getFullYear() === now.getFullYear()
        );
      }).length,

      // Store metrics
      totalStores: stores.length,
      newStoresThisMonth: stores.filter((s: any) => {
        const createdDate = new Date(s.createdAt);
        const now = new Date();
        return (
          createdDate.getMonth() === now.getMonth() &&
          createdDate.getFullYear() === now.getFullYear()
        );
      }).length,

      // Performance
      avgRevenuePerClient: 0, // TODO: Calculate from order data
      avgRevenuePerStore: 0,

      // Geographic distribution
      storesByCity: Object.values(storesByCity),

      // Top clients
      topClients: clients.slice(0, 10).map((c: any) => ({
        id: c.id,
        name: c.name,
        stores: stores.filter((s: any) => s.clientId === c.id).length,
        revenue: 0, // TODO: Calculate from orders
        growth: 0,
      })),
    };

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error("Sales dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sales dashboard data",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/dashboard/supply
 * @desc Get Supply Chain Dashboard data
 */
router.get("/supply", authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    const [hubsData, ridersData, vehiclesData, storesData] = await Promise.all([
      fetchFromService(`${VEHICLE_SERVICE_URL}/api/hubs`, token),
      fetchFromService(`${RIDER_SERVICE_URL}/api/riders`, token),
      fetchFromService(`${VEHICLE_SERVICE_URL}/api/vehicles`, token),
      fetchFromService(`${CLIENT_STORE_SERVICE_URL}/api/stores`, token),
    ]);

    const hubs = hubsData?.data || [];
    const riders = ridersData?.data || [];
    const vehicles = vehiclesData?.data || [];
    const stores = storesData?.data || [];

    const metrics = {
      department: "SUPPLY",
      lastUpdated: new Date(),

      // Hub metrics
      totalHubs: hubs.length,
      activeHubs: hubs.filter((h: any) => h.isActive).length,

      // Capacity
      totalRiderCapacity: hubs.reduce(
        (sum: number, h: any) => sum + (h.capacity || 0),
        0
      ),
      currentRiders: riders.length,
      totalVehicleCapacity: hubs.reduce(
        (sum: number, h: any) => sum + (h.vehicleCapacity || 0),
        0
      ),
      currentVehicles: vehicles.length,

      // Coverage
      citiesCovered: new Set(hubs.map((h: any) => h.city)).size,
      storesServed: stores.length,

      // Hub details
      hubsData: hubs.map((h: any) => ({
        id: h.id,
        name: h.name,
        city: h.city,
        riderCapacity: h.capacity || 0,
        currentRiders: riders.filter((r: any) => r.hubId === h.id).length,
        vehicleCapacity: h.vehicleCapacity || 0,
        currentVehicles: vehicles.filter((v: any) => v.hubId === h.id).length,
        storesServed: stores.filter((s: any) => s.hubId === h.id).length,
      })),
    };

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error("Supply dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch supply dashboard data",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/dashboard/finance
 * @desc Get Finance Dashboard data
 */
router.get("/finance", authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    const [earningsData, ordersData, vehiclesData] = await Promise.all([
      fetchFromService(`${CLIENT_STORE_SERVICE_URL}/api/rider-earnings`, token),
      fetchFromService(`${ORDER_SERVICE_URL}/api/orders/stats`, token),
      fetchFromService(
        `${VEHICLE_SERVICE_URL}/api/v1/analytics/fleet-performance`,
        token
      ),
    ]);

    const earnings = earningsData?.data || [];
    const orderStats = ordersData?.data || {};
    const vehicleAnalytics = vehiclesData?.data || {};

    // Calculate financial metrics
    const totalPayouts = earnings.reduce(
      (sum: number, e: any) => sum + (e.amount || 0),
      0
    );
    const pendingPayouts = earnings
      .filter((e: any) => e.status === "PENDING")
      .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    const metrics = {
      department: "FINANCE",
      lastUpdated: new Date(),

      // Revenue (mock data - needs payment service)
      totalRevenue: orderStats.totalRevenue || 0,
      monthlyRevenue: orderStats.monthlyRevenue || 0,
      revenueGrowth: orderStats.revenueGrowth || 0,

      // Expenses
      riderPayouts: totalPayouts,
      vehicleCosts: vehicleAnalytics.maintenanceCostMTD || 0,
      operationalCosts: 0,
      maintenanceCosts: vehicleAnalytics.maintenanceCostMTD || 0,

      // Payouts
      pendingPayouts,
      processedPayoutsThisWeek: totalPayouts - pendingPayouts,
      avgPayoutPerRider:
        earnings.length > 0 ? totalPayouts / earnings.length : 0,

      // Mock profitability
      grossProfit: 0,
      netProfit: 0,
      profitMargin: 0,
    };

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error("Finance dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch finance dashboard data",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/dashboard/management
 * @desc Get Management Dashboard data (consolidated view of all departments)
 */
router.get(
  "/management",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");

      // Fetch data from all departments in parallel
      const [operations, vehicles, inventory, sales, supply, finance] =
        await Promise.all([
          axios
            .get(
              `${req.protocol}://${req.get("host")}/api/dashboard/operations`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
            .then((r) => r.data.data)
            .catch(() => ({})),
          axios
            .get(
              `${req.protocol}://${req.get("host")}/api/dashboard/vehicles`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
            .then((r) => r.data.data)
            .catch(() => ({})),
          axios
            .get(
              `${req.protocol}://${req.get("host")}/api/dashboard/inventory`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
            .then((r) => r.data.data)
            .catch(() => ({})),
          axios
            .get(`${req.protocol}://${req.get("host")}/api/dashboard/sales`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((r) => r.data.data)
            .catch(() => ({})),
          axios
            .get(`${req.protocol}://${req.get("host")}/api/dashboard/supply`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((r) => r.data.data)
            .catch(() => ({})),
          axios
            .get(`${req.protocol}://${req.get("host")}/api/dashboard/finance`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((r) => r.data.data)
            .catch(() => ({})),
        ]);

      const metrics = {
        department: "MANAGEMENT",
        lastUpdated: new Date(),

        // Executive summary
        totalRevenue: finance.monthlyRevenue || 0,
        revenueGrowth: finance.revenueGrowth || 0,
        totalExpenses: finance.riderPayouts + finance.vehicleCosts || 0,
        netProfit: finance.netProfit || 0,
        profitMargin: finance.profitMargin || 0,

        // Operations summary
        totalDeliveries: operations.completedDeliveriesToday || 0,
        avgDeliveryTime: operations.avgDeliveryTime || 0,
        onTimeRate: operations.onTimeDeliveryRate || 0,
        customerSatisfaction: operations.customerSatisfaction || 0,

        // Resources
        totalRiders: operations.totalRiders || 0,
        activeRiders: operations.activeRiders || 0,
        totalVehicles: vehicles.totalVehicles || 0,
        activeVehicles: vehicles.activeVehicles || 0,
        totalHubs: supply.totalHubs || 0,

        // Clients & Stores
        totalClients: sales.totalClients || 0,
        totalStores: sales.totalStores || 0,
        newClientsThisMonth: sales.newClientsThisMonth || 0,

        // Department summaries
        departments: {
          sales,
          supply,
          finance,
          operations,
          vehicles,
          inventory,
        },

        // Critical alerts
        criticalAlerts: [
          ...(operations.delayedDeliveries > 5
            ? [
                {
                  department: "OPERATIONS",
                  severity: "high" as const,
                  message: `${operations.delayedDeliveries} delayed deliveries`,
                  timestamp: new Date(),
                },
              ]
            : []),
          ...(vehicles.overdueMaintenance > 0
            ? [
                {
                  department: "EV_VEHICLE_TEAM",
                  severity: "high" as const,
                  message: `${vehicles.overdueMaintenance} vehicles overdue for maintenance`,
                  timestamp: new Date(),
                },
              ]
            : []),
          ...(inventory.lowStockItems > 10
            ? [
                {
                  department: "INVENTORY_TEAM",
                  severity: "medium" as const,
                  message: `${inventory.lowStockItems} items with low stock`,
                  timestamp: new Date(),
                },
              ]
            : []),
        ],
      };

      res.json({
        success: true,
        data: metrics,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error("Management dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch management dashboard data",
        error: error.message,
      });
    }
  }
);

export default router;
