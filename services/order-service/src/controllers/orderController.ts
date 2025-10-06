import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler, createError } from "../middleware/errorHandler.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import axios from "axios";

const prisma = new PrismaClient();

// Environment variables for service URLs
const RIDER_SERVICE_URL =
  process.env.RIDER_SERVICE_URL || "http://localhost:3004";
const CLIENT_STORE_SERVICE_URL =
  process.env.CLIENT_STORE_SERVICE_URL || "http://localhost:3006";

// Create a new order
export const createOrder = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    console.log(
      `🆕 Creating new order with data:`,
      JSON.stringify(req.body, null, 2)
    );

    const {
      orderNumber,
      riderId,
      clientId,
      storeId,
      orderType,
      orderStatus,
      priority,
      pickupAddress,
      pickupCity,
      pickupState,
      pickupPinCode,
      dropoffAddress,
      dropoffCity,
      dropoffState,
      dropoffPinCode,
      pickupDate,
      pickupTime,
      expectedDeliveryDate,
      expectedDeliveryTime,
      totalAmount,
      paymentMethod,
      paymentStatus,
      notes,
      items,
    } = req.body;

    // Validate required fields
    if (
      !orderNumber ||
      !riderId ||
      !clientId ||
      !storeId ||
      !orderType ||
      !orderStatus
    ) {
      throw createError(
        "Order number, rider ID, client ID, store ID, order type, and status are required",
        400,
        "MISSING_REQUIRED_FIELDS"
      );
    }

    try {
      // Validate rider exists
      let riderExists = false;
      try {
        const riderResponse = await axios.get(
          `${RIDER_SERVICE_URL}/api/v1/riders/${riderId}`
        );
        riderExists = riderResponse.status === 200;
      } catch (error) {
        console.error(`Error validating rider: ${(error as Error).message}`);
        throw createError(
          "Invalid rider ID or rider service unavailable",
          400,
          "INVALID_RIDER"
        );
      }

      if (!riderExists) {
        throw createError("Rider not found", 404, "RIDER_NOT_FOUND");
      }

      // Validate client exists
      let clientExists = false;
      try {
        const clientResponse = await axios.get(
          `${CLIENT_STORE_SERVICE_URL}/api/clients/${clientId}`
        );
        clientExists = clientResponse.status === 200;
      } catch (error) {
        console.error(`Error validating client: ${(error as Error).message}`);
        throw createError(
          "Invalid client ID or client service unavailable",
          400,
          "INVALID_CLIENT"
        );
      }

      if (!clientExists) {
        throw createError("Client not found", 404, "CLIENT_NOT_FOUND");
      }

      // Validate store exists
      let storeExists = false;
      try {
        const storeResponse = await axios.get(
          `${CLIENT_STORE_SERVICE_URL}/api/stores/${storeId}`
        );
        storeExists = storeResponse.status === 200;
      } catch (error) {
        console.error(`Error validating store: ${(error as Error).message}`);
        throw createError(
          "Invalid store ID or store service unavailable",
          400,
          "INVALID_STORE"
        );
      }

      if (!storeExists) {
        throw createError("Store not found", 404, "STORE_NOT_FOUND");
      }

      // Create order in a transaction
      const order = await prisma.$transaction(async (tx) => {
        // Create the main order
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            riderId,
            clientId,
            storeId,
            orderType,
            orderStatus,
            priority: priority || "medium",
            pickupAddress,
            pickupCity,
            pickupState,
            pickupPinCode,
            dropoffAddress,
            dropoffCity,
            dropoffState,
            dropoffPinCode,
            pickupDate: pickupDate ? new Date(pickupDate) : undefined,
            pickupTime,
            expectedDeliveryDate: expectedDeliveryDate
              ? new Date(expectedDeliveryDate)
              : undefined,
            expectedDeliveryTime: expectedDeliveryTime,
            totalAmount: totalAmount ? parseFloat(totalAmount.toString()) : 0,
            paymentMethod: paymentMethod || "cash",
            paymentStatus: paymentStatus || "pending",
            notes,
            // Create initial status update
            statusUpdates: {
              create: {
                status: orderStatus,
                timestamp: new Date(),
                notes: "Order created",
              },
            },
            // Create order tracking entry
            tracking: {
              create: {
                currentStatus: orderStatus,
                currentLocation: pickupAddress,
                lastUpdated: new Date(),
              },
            },
          },
        });

        // Create order items if provided
        if (items && items.length > 0) {
          await Promise.all(
            items.map(async (item: any) => {
              await tx.orderItem.create({
                data: {
                  orderId: newOrder.id,
                  itemName: item.itemName,
                  itemDescription: item.itemDescription,
                  quantity: parseInt(item.quantity || "1"),
                  unitPrice: parseFloat(item.unitPrice || "0"),
                  totalPrice: parseFloat(item.totalPrice || "0"),
                },
              });
            })
          );
        }

        // Create order event log
        await tx.orderEvent.create({
          data: {
            orderId: newOrder.id,
            eventType: "ORDER_CREATED",
            timestamp: new Date(),
            details: JSON.stringify({
              createdBy: req.user?.id || "system",
              orderNumber,
              riderId,
              clientId,
              storeId,
            }),
          },
        });

        return newOrder;
      });

      // Get the complete order with relationships
      const completeOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: true,
          statusUpdates: {
            orderBy: {
              timestamp: "desc",
            },
          },
          tracking: true,
          events: {
            orderBy: {
              timestamp: "desc",
            },
            take: 5,
          },
        },
      });

      console.log(`✅ Order created successfully: ${order.id}`);

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: completeOrder,
      });
    } catch (error: any) {
      console.error(`❌ Error creating order:`, error);
      throw error;
    }
  }
);

// Get all orders with filtering
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = "1",
    limit = "10",
    search,
    riderId,
    clientId,
    storeId,
    orderStatus,
    orderType,
    fromDate,
    toDate,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { orderNumber: { contains: search as string, mode: "insensitive" } },
      { pickupAddress: { contains: search as string, mode: "insensitive" } },
      { dropoffAddress: { contains: search as string, mode: "insensitive" } },
      { notes: { contains: search as string, mode: "insensitive" } },
    ];
  }

  if (riderId) {
    where.riderId = riderId as string;
  }

  if (clientId) {
    where.clientId = clientId as string;
  }

  if (storeId) {
    where.storeId = storeId as string;
  }

  if (orderStatus) {
    where.orderStatus = orderStatus as string;
  }

  if (orderType) {
    where.orderType = orderType as string;
  }

  // Date range filtering
  if (fromDate) {
    where.createdAt = {
      ...where.createdAt,
      gte: new Date(fromDate as string),
    };
  }

  if (toDate) {
    where.createdAt = {
      ...where.createdAt,
      lte: new Date(`${toDate}T23:59:59.999Z`),
    };
  }

  // Get orders with pagination
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        [sortBy as string]: sortOrder as "asc" | "desc",
      },
      include: {
        items: true,
        statusUpdates: {
          orderBy: {
            timestamp: "desc",
          },
          take: 1,
        },
        tracking: true,
        payments: {
          orderBy: {
            timestamp: "desc",
          },
          take: 1,
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
    },
  });
});

// Get order by ID
export const getOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusUpdates: {
          orderBy: {
            timestamp: "desc",
          },
        },
        tracking: true,
        payments: {
          orderBy: {
            timestamp: "desc",
          },
        },
        events: {
          orderBy: {
            timestamp: "desc",
          },
        },
      },
    });

    if (!order) {
      throw createError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    res.json({
      success: true,
      data: order,
    });
  }
);

// Update order
export const updateOrder = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    console.log(
      `🔄 Updating order ${id} with data:`,
      JSON.stringify(updateData, null, 2)
    );

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.items;
    delete updateData.statusUpdates;
    delete updateData.tracking;
    delete updateData.payments;
    delete updateData.events;

    // Handle numeric fields
    if (updateData.totalAmount) {
      updateData.totalAmount = parseFloat(updateData.totalAmount.toString());
    }

    // Handle date fields
    if (updateData.pickupDate) {
      updateData.pickupDate = new Date(updateData.pickupDate);
    }
    if (updateData.expectedDeliveryDate) {
      updateData.expectedDeliveryDate = new Date(
        updateData.expectedDeliveryDate
      );
    }

    // Add update tracking
    updateData.updatedAt = new Date();

    try {
      const order = await prisma.$transaction(async (tx) => {
        // Update the main order
        const updatedOrder = await tx.order.update({
          where: { id },
          data: updateData,
        });

        // If status changed, create a status update entry
        if (updateData.orderStatus) {
          await tx.orderStatusUpdate.create({
            data: {
              orderId: id,
              status: updateData.orderStatus,
              timestamp: new Date(),
              notes: updateData.statusNotes || "Status updated",
            },
          });

          // Also update tracking
          await tx.orderTracking.update({
            where: { orderId: id },
            data: {
              currentStatus: updateData.orderStatus,
              lastUpdated: new Date(),
            },
          });
        }

        // Log the update event
        await tx.orderEvent.create({
          data: {
            orderId: id,
            eventType: "ORDER_UPDATED",
            timestamp: new Date(),
            details: JSON.stringify({
              updatedBy: req.user?.id || "system",
              updatedFields: Object.keys(updateData),
              newStatus: updateData.orderStatus,
            }),
          },
        });

        return updatedOrder;
      });

      // Get the complete updated order with relationships
      const completeOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
          statusUpdates: {
            orderBy: {
              timestamp: "desc",
            },
          },
          tracking: true,
          payments: {
            orderBy: {
              timestamp: "desc",
            },
          },
          events: {
            orderBy: {
              timestamp: "desc",
            },
            take: 5,
          },
        },
      });

      console.log(`✅ Order updated successfully: ${id}`);

      res.json({
        success: true,
        message: "Order updated successfully",
        data: completeOrder,
      });
    } catch (error: any) {
      console.error(`❌ Error updating order ${id}:`, error);
      throw error;
    }
  }
);

// Update order status
export const updateOrderStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status, notes, location } = req.body;

    if (!status) {
      throw createError("Status is required", 400, "MISSING_REQUIRED_FIELDS");
    }

    try {
      const order = await prisma.$transaction(async (tx) => {
        // Update order status
        const updatedOrder = await tx.order.update({
          where: { id },
          data: {
            orderStatus: status,
            updatedAt: new Date(),
          },
        });

        // Create status update entry
        await tx.orderStatusUpdate.create({
          data: {
            orderId: id,
            status,
            timestamp: new Date(),
            notes: notes || `Status updated to ${status}`,
          },
        });

        // Update tracking
        await tx.orderTracking.update({
          where: { orderId: id },
          data: {
            currentStatus: status,
            currentLocation: location || undefined,
            lastUpdated: new Date(),
          },
        });

        // Log the event
        await tx.orderEvent.create({
          data: {
            orderId: id,
            eventType: "STATUS_UPDATED",
            timestamp: new Date(),
            details: JSON.stringify({
              updatedBy: req.user?.id || "system",
              previousStatus: updatedOrder.orderStatus,
              newStatus: status,
            }),
          },
        });

        return updatedOrder;
      });

      // Get the updated order with latest status
      const updatedOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          statusUpdates: {
            orderBy: {
              timestamp: "desc",
            },
            take: 5,
          },
          tracking: true,
        },
      });

      res.json({
        success: true,
        message: "Order status updated successfully",
        data: updatedOrder,
      });
    } catch (error: any) {
      console.error(`❌ Error updating order status:`, error);
      throw error;
    }
  }
);

// Add order item
export const addOrderItem = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { itemName, itemDescription, quantity, unitPrice, totalPrice } =
      req.body;

    if (!itemName || quantity === undefined || unitPrice === undefined) {
      throw createError(
        "Item name, quantity and unit price are required",
        400,
        "MISSING_REQUIRED_FIELDS"
      );
    }

    try {
      // Check if order exists
      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        throw createError("Order not found", 404, "ORDER_NOT_FOUND");
      }

      // Calculate total price if not provided
      const calculatedTotalPrice =
        totalPrice !== undefined
          ? parseFloat(totalPrice.toString())
          : parseFloat(unitPrice.toString()) * parseInt(quantity.toString());

      // Create new item
      const newItem = await prisma.orderItem.create({
        data: {
          orderId: id,
          itemName,
          itemDescription,
          quantity: parseInt(quantity.toString()),
          unitPrice: parseFloat(unitPrice.toString()),
          totalPrice: calculatedTotalPrice,
        },
      });

      // Update order total amount
      const allItems = await prisma.orderItem.findMany({
        where: { orderId: id },
      });

      const newTotalAmount = allItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );

      await prisma.order.update({
        where: { id },
        data: {
          totalAmount: newTotalAmount,
          updatedAt: new Date(),
        },
      });

      // Log the event
      await prisma.orderEvent.create({
        data: {
          orderId: id,
          eventType: "ITEM_ADDED",
          timestamp: new Date(),
          details: JSON.stringify({
            itemId: newItem.id,
            itemName,
            quantity: parseInt(quantity.toString()),
            addedBy: req.user?.id || "system",
          }),
        },
      });

      res.status(201).json({
        success: true,
        message: "Order item added successfully",
        data: newItem,
      });
    } catch (error: any) {
      console.error(`❌ Error adding order item:`, error);
      throw error;
    }
  }
);

// Update order item
export const updateOrderItem = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id, itemId } = req.params;
    const { itemName, itemDescription, quantity, unitPrice, totalPrice } =
      req.body;

    try {
      // Check if order and item exist
      const orderItem = await prisma.orderItem.findFirst({
        where: {
          id: itemId,
          orderId: id,
        },
      });

      if (!orderItem) {
        throw createError("Order item not found", 404, "ORDER_ITEM_NOT_FOUND");
      }

      // Update item
      const updatedItem = await prisma.orderItem.update({
        where: { id: itemId },
        data: {
          itemName: itemName || undefined,
          itemDescription: itemDescription || undefined,
          quantity:
            quantity !== undefined ? parseInt(quantity.toString()) : undefined,
          unitPrice:
            unitPrice !== undefined
              ? parseFloat(unitPrice.toString())
              : undefined,
          totalPrice:
            totalPrice !== undefined
              ? parseFloat(totalPrice.toString())
              : undefined,
        },
      });

      // Recalculate order total amount
      const allItems = await prisma.orderItem.findMany({
        where: { orderId: id },
      });

      const newTotalAmount = allItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );

      await prisma.order.update({
        where: { id },
        data: {
          totalAmount: newTotalAmount,
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: "Order item updated successfully",
        data: updatedItem,
      });
    } catch (error: any) {
      console.error(`❌ Error updating order item:`, error);
      throw error;
    }
  }
);

// Delete order item
export const deleteOrderItem = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id, itemId } = req.params;

    try {
      // Check if order and item exist
      const orderItem = await prisma.orderItem.findFirst({
        where: {
          id: itemId,
          orderId: id,
        },
      });

      if (!orderItem) {
        throw createError("Order item not found", 404, "ORDER_ITEM_NOT_FOUND");
      }

      // Delete item
      await prisma.orderItem.delete({
        where: { id: itemId },
      });

      // Recalculate order total amount
      const allItems = await prisma.orderItem.findMany({
        where: { orderId: id },
      });

      const newTotalAmount = allItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );

      await prisma.order.update({
        where: { id },
        data: {
          totalAmount: newTotalAmount,
          updatedAt: new Date(),
        },
      });

      // Log the event
      await prisma.orderEvent.create({
        data: {
          orderId: id,
          eventType: "ITEM_REMOVED",
          timestamp: new Date(),
          details: JSON.stringify({
            itemId,
            removedBy: req.user?.id || "system",
          }),
        },
      });

      res.json({
        success: true,
        message: "Order item deleted successfully",
      });
    } catch (error: any) {
      console.error(`❌ Error deleting order item:`, error);
      throw error;
    }
  }
);

// Add payment for order
export const addOrderPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { paymentMethod, amount, transactionId, paymentStatus, notes } =
      req.body;

    if (!paymentMethod || !amount) {
      throw createError(
        "Payment method and amount are required",
        400,
        "MISSING_REQUIRED_FIELDS"
      );
    }

    try {
      // Check if order exists
      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        throw createError("Order not found", 404, "ORDER_NOT_FOUND");
      }

      // Create payment
      const payment = await prisma.$transaction(async (tx) => {
        const newPayment = await tx.orderPayment.create({
          data: {
            orderId: id,
            paymentMethod,
            amount: parseFloat(amount.toString()),
            transactionId,
            paymentStatus: paymentStatus || "completed",
            notes,
            timestamp: new Date(),
          },
        });

        // Update order payment status
        await tx.order.update({
          where: { id },
          data: {
            paymentStatus: paymentStatus || "completed",
            updatedAt: new Date(),
          },
        });

        // Log the event
        await tx.orderEvent.create({
          data: {
            orderId: id,
            eventType: "PAYMENT_ADDED",
            timestamp: new Date(),
            details: JSON.stringify({
              paymentId: newPayment.id,
              amount: parseFloat(amount.toString()),
              method: paymentMethod,
              status: paymentStatus || "completed",
              recordedBy: req.user?.id || "system",
            }),
          },
        });

        return newPayment;
      });

      res.status(201).json({
        success: true,
        message: "Order payment added successfully",
        data: payment,
      });
    } catch (error: any) {
      console.error(`❌ Error adding order payment:`, error);
      throw error;
    }
  }
);

// Get orders by rider ID
export const getOrdersByRiderId = asyncHandler(
  async (req: Request, res: Response) => {
    const { riderId } = req.params;
    const { status, from, to, limit = "10" } = req.query;

    const limitNum = parseInt(limit as string);
    const where: any = { riderId };

    if (status) {
      where.orderStatus = status as string;
    }

    if (from) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(from as string),
      };
    }

    if (to) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(`${to}T23:59:59.999Z`),
      };
    }

    const orders = await prisma.order.findMany({
      where,
      take: limitNum,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        statusUpdates: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
        tracking: true,
      },
    });

    res.json({
      success: true,
      data: orders,
    });
  }
);

// Get orders by client ID
export const getOrdersByClientId = asyncHandler(
  async (req: Request, res: Response) => {
    const { clientId } = req.params;
    const { status, from, to, limit = "10" } = req.query;

    const limitNum = parseInt(limit as string);
    const where: any = { clientId };

    if (status) {
      where.orderStatus = status as string;
    }

    if (from) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(from as string),
      };
    }

    if (to) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(`${to}T23:59:59.999Z`),
      };
    }

    const orders = await prisma.order.findMany({
      where,
      take: limitNum,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        statusUpdates: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
        tracking: true,
      },
    });

    res.json({
      success: true,
      data: orders,
    });
  }
);

// Get orders by store ID
export const getOrdersByStoreId = asyncHandler(
  async (req: Request, res: Response) => {
    const { storeId } = req.params;
    const { status, from, to, limit = "10" } = req.query;

    const limitNum = parseInt(limit as string);
    const where: any = { storeId };

    if (status) {
      where.orderStatus = status as string;
    }

    if (from) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(from as string),
      };
    }

    if (to) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(`${to}T23:59:59.999Z`),
      };
    }

    const orders = await prisma.order.findMany({
      where,
      take: limitNum,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        statusUpdates: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
        tracking: true,
      },
    });

    res.json({
      success: true,
      data: orders,
    });
  }
);

// Get order statistics
export const getOrderStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { timeframe = "week" } = req.query;

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case "day":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get orders within the timeframe
    const [
      totalOrders,
      statusCounts,
      typeCounts,
      completedOrders,
      avgDeliveryTime,
    ] = await Promise.all([
      // Total orders count
      prisma.order.count({
        where: { createdAt: { gte: startDate } },
      }),

      // Status distribution
      prisma.order.groupBy({
        by: ["orderStatus"],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),

      // Order type distribution
      prisma.order.groupBy({
        by: ["orderType"],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),

      // Completed orders
      prisma.order.findMany({
        where: {
          orderStatus: "completed",
          createdAt: { gte: startDate },
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      }),

      // Average delivery time calculation - simplified version
      prisma.order.aggregate({
        where: {
          orderStatus: "completed",
          createdAt: { gte: startDate },
        },
        _avg: {
          totalAmount: true,
        },
      }),
    ]);

    // Calculate average delivery time (simplified)
    let averageDeliveryTimeHours = 0;
    if (completedOrders.length > 0) {
      const totalHours = completedOrders.reduce((sum, order) => {
        const deliveryTimeHours =
          (order.updatedAt.getTime() - order.createdAt.getTime()) /
          (1000 * 60 * 60);
        return sum + deliveryTimeHours;
      }, 0);
      averageDeliveryTimeHours = totalHours / completedOrders.length;
    }

    // Format status counts
    const statusDistribution = statusCounts.reduce((acc, status) => {
      acc[status.orderStatus] = status._count;
      return acc;
    }, {} as Record<string, number>);

    // Format type counts
    const typeDistribution = typeCounts.reduce((acc, type) => {
      acc[type.orderType] = type._count;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        timeframe,
        totalOrders,
        statusDistribution,
        typeDistribution,
        completedOrders: completedOrders.length,
        averageDeliveryTimeHours,
        averageOrderValue: avgDeliveryTime._avg.totalAmount || 0,
      },
    });
  }
);
