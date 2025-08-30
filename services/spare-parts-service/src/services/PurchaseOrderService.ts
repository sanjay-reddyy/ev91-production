import { prisma } from "../config";
import { PurchaseOrderRequest, PurchaseOrderItemRequest } from "../types";

export class PurchaseOrderService {
  /**
   * Create a new purchase order with items and calculate totals
   */
  async createPurchaseOrder(data: PurchaseOrderRequest, createdBy: string) {
    // Calculate subtotal, tax, discount, and total
    let subtotal = 0;
    data.items.forEach((item: PurchaseOrderItemRequest) => {
      subtotal += item.unitCost * item.orderedQuantity;
    });
    // For demo: tax 18%, discount 0
    const taxAmount = subtotal * 0.18;
    const discountAmount = 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        supplierId: data.supplierId,
        storeId: data.storeId,
        storeName: data.storeName,
        orderNumber: `PO-${Date.now()}`,
        orderDate: new Date(),
        expectedDate: data.expectedDate,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        status: "DRAFT",
        urgencyLevel: data.urgencyLevel || "NORMAL",
        notes: data.notes,
        terms: data.terms,
        createdBy,
        items: {
          create: data.items.map((item) => ({
            sparePartId: item.sparePartId,
            orderedQuantity: item.orderedQuantity,
            unitCost: item.unitCost,
            totalCost: item.unitCost * item.orderedQuantity,
          })),
        },
      },
      include: {
        supplier: true,
        items: true,
      },
    });
    return purchaseOrder;
  }

  /**
   * Get purchase orders with filters and pagination
   */
  async getPurchaseOrders(params: any) {
    // Filtering, sorting, pagination
    const {
      supplierId,
      status,
      storeId,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      sortBy = "orderDate",
      sortOrder = "desc",
    } = params || {};

    // Convert page and limit to numbers to avoid Prisma validation errors
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 10;
    const where: any = {};
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;
    if (storeId) where.storeId = storeId;
    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = new Date(dateFrom);
      if (dateTo) where.orderDate.lte = new Date(dateTo);
    }
    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount.gte = minAmount;
      if (maxAmount) where.totalAmount.lte = maxAmount;
    }
    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: { supplier: true, items: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);
    return {
      data: orders,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        pageSize: limit,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Update purchase order status, terms, or notes
   */
  async updatePurchaseOrder(id: string, data: Partial<any>) {
    // Allow updating status, terms, notes, expectedDate, urgencyLevel
    const allowedFields = [
      "status",
      "terms",
      "notes",
      "expectedDate",
      "urgencyLevel",
      "approvedBy",
      "deliveryDate",
    ];
    const updateData: any = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    return prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: { supplier: true, items: true },
    });
  }

  /**
   * Receive items for a purchase order and update inventory
   */
  async receiveItems(
    id: string,
    receivedItems: Array<{
      sparePartId: string;
      receivedQuantity: number;
      storeId: string;
    }>,
    receivedBy: string
  ) {
    // Update received quantities, inventory, and create stock movements
    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!po) throw new Error("Purchase order not found");
      for (const received of receivedItems) {
        const item = po.items.find(
          (i: any) => i.sparePartId === received.sparePartId
        );
        if (item) {
          await tx.purchaseOrderItem.update({
            where: { id: item.id },
            data: {
              receivedQuantity: { increment: received.receivedQuantity },
              status: "RECEIVED",
            },
          });
          // Update inventory level
          await tx.inventoryLevel.upsert({
            where: {
              sparePartId_storeId: {
                sparePartId: received.sparePartId,
                storeId: received.storeId,
              },
            },
            update: { currentStock: { increment: received.receivedQuantity } },
            create: {
              sparePartId: received.sparePartId,
              storeId: received.storeId,
              storeName: "Default Store",
              currentStock: received.receivedQuantity,
              minimumStock: 10,
              maximumStock: 100,
              reorderLevel: 20,
            },
          });
          // Create stock movement
          await tx.stockMovement.create({
            data: {
              sparePartId: received.sparePartId,
              storeId: received.storeId,
              movementType: "IN",
              quantity: received.receivedQuantity,
              referenceType: "PURCHASE_ORDER",
              referenceId: id,
              notes: `Received from PO ${po.orderNumber}`,
              createdBy: receivedBy,
              previousStock: 0, // For demo, should fetch previous
              newStock: 0, // For demo, should calculate new
              stockLevelId: "", // Should be set to the correct inventoryLevel id
            },
          });
        }
      }
      await tx.purchaseOrder.update({
        where: { id },
        data: { status: "RECEIVED", receivedBy },
      });
      return { success: true };
    });
  }

  /**
   * Analytics: Get total spend, order count, and average order value for a period
   */
  async getSpendAnalytics({
    dateFrom,
    dateTo,
  }: {
    dateFrom?: string;
    dateTo?: string;
  }) {
    const where: any = {};
    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = new Date(dateFrom);
      if (dateTo) where.orderDate.lte = new Date(dateTo);
    }
    const [totalSpend, orderCount, avgOrderValue] = await Promise.all([
      prisma.purchaseOrder.aggregate({ _sum: { totalAmount: true }, where }),
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.aggregate({ _avg: { totalAmount: true }, where }),
    ]);
    return {
      totalSpend: totalSpend._sum.totalAmount || 0,
      orderCount,
      avgOrderValue: avgOrderValue._avg.totalAmount || 0,
    };
  }

  /**
   * Analytics: Get supplier performance (order count, total value, on-time delivery)
   */
  async getSupplierPerformance(supplierId: string) {
    const orders = await prisma.purchaseOrder.findMany({
      where: { supplierId },
    });
    const totalOrders = orders.length;
    const totalValue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    // For demo: onTimeDelivery is not tracked, set to 100%
    return { supplierId, totalOrders, totalValue, onTimeDelivery: 100 };
  }

  /**
   * Analytics: Get order trends (monthly order count and spend)
   */
  async getOrderTrends({ months = 6 }: { months?: number }) {
    const since = new Date();
    since.setMonth(since.getMonth() - months + 1);
    const orders = await prisma.purchaseOrder.findMany({
      where: { orderDate: { gte: since } },
      orderBy: { orderDate: "asc" },
    });
    const trends: Record<string, { count: number; spend: number }> = {};
    for (const o of orders) {
      const month = `${o.orderDate.getFullYear()}-${String(
        o.orderDate.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!trends[month]) trends[month] = { count: 0, spend: 0 };
      trends[month].count++;
      trends[month].spend += o.totalAmount || 0;
    }
    return trends;
  }

  /**
   * Reporting: Get overdue, pending, and completed orders
   */
  async getOrderReports() {
    const now = new Date();
    const overdue = await prisma.purchaseOrder.findMany({
      where: {
        expectedDate: { lt: now },
        status: { in: ["DRAFT", "SENT", "CONFIRMED", "PARTIAL"] },
      },
    });
    const pending = await prisma.purchaseOrder.findMany({
      where: { status: { in: ["DRAFT", "SENT", "CONFIRMED", "PARTIAL"] } },
    });
    const completed = await prisma.purchaseOrder.findMany({
      where: { status: { in: ["DELIVERED", "CANCELLED"] } },
    });
    return { overdue, pending, completed };
  }

  // Add more methods as needed for analytics, reporting, etc.
}

export const purchaseOrderService = new PurchaseOrderService();
