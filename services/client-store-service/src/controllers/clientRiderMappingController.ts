import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { resolvePublicRiderIdToRiderId } from "../services/riderServiceClient";

const prisma = new PrismaClient();

/**
 * List client rider mappings with filters and pagination
 * GET /api/client-rider-mappings
 */
export const listMappings = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = "1",
      limit = "50",
      clientId,
      platformRiderId,
      clientRiderId,
      isActive,
      verificationStatus,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query as any;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (platformRiderId) where.platformRiderId = platformRiderId;
    if (clientRiderId) {
      where.clientRiderId = {
        contains: clientRiderId,
        mode: "insensitive",
      };
    }
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }
    if (verificationStatus) where.verificationStatus = verificationStatus;

    const [data, total] = await Promise.all([
      prisma.clientRiderMapping.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              clientCode: true,
            },
          },
        },
      }),
      prisma.clientRiderMapping.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  }
);

/**
 * Get single mapping by ID
 * GET /api/client-rider-mappings/:id
 */
export const getMapping = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const mapping = await prisma.clientRiderMapping.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          clientCode: true,
          clientType: true,
        },
      },
    },
  });

  if (!mapping) {
    throw createError("Mapping not found", 404, "NOT_FOUND");
  }

  res.json({ success: true, data: mapping });
});

/**
 * Resolve client rider ID to platform rider ID
 * GET /api/client-rider-mappings/resolve/:clientId/:clientRiderId
 */
export const resolveClientRiderId = asyncHandler(
  async (req: Request, res: Response) => {
    const { clientId, clientRiderId } = req.params;

    const mapping = await prisma.clientRiderMapping.findFirst({
      where: {
        clientId,
        clientRiderId,
        isActive: true,
      },
      include: {
        client: {
          select: {
            name: true,
            clientCode: true,
          },
        },
      },
    });

    if (!mapping) {
      throw createError(
        `No active mapping found for client rider ID: ${clientRiderId}`,
        404,
        "MAPPING_NOT_FOUND"
      );
    }

    res.json({
      success: true,
      data: {
        platformRiderId: mapping.platformRiderId,
        clientRiderId: mapping.clientRiderId,
        clientName: mapping.client.name,
        mappingId: mapping.id,
        verificationStatus: mapping.verificationStatus,
      },
    });
  }
);

/**
 * Get all mappings for a specific platform rider
 * GET /api/client-rider-mappings/rider/:platformRiderId
 */
export const getMappingsByRider = asyncHandler(
  async (req: Request, res: Response) => {
    const { platformRiderId } = req.params;
    const { includeInactive } = req.query;

    const where: any = { platformRiderId };
    if (includeInactive !== "true") {
      where.isActive = true;
    }

    const mappings = await prisma.clientRiderMapping.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            clientCode: true,
            clientType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: mappings,
      count: mappings.length,
    });
  }
);

/**
 * Get all mappings for a specific client
 * GET /api/client-rider-mappings/client/:clientId
 */
export const getMappingsByClient = asyncHandler(
  async (req: Request, res: Response) => {
    const { clientId } = req.params;
    const { includeInactive } = req.query;

    const where: any = { clientId };
    if (includeInactive !== "true") {
      where.isActive = true;
    }

    const mappings = await prisma.clientRiderMapping.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: mappings,
      count: mappings.length,
    });
  }
);

/**
 * Create new client rider mapping
 * POST /api/client-rider-mappings
 */
export const createMapping = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      platformRiderId, // This is actually publicRiderId from frontend
      clientId,
      clientRiderId,
      assignedBy,
      assignedByName,
      notes,
      source = "manual",
      priority = "standard",
      verificationStatus = "pending",
    } = req.body;

    // Validate required fields
    if (!platformRiderId || !clientId || !clientRiderId) {
      throw createError(
        "platformRiderId, clientId, and clientRiderId are required",
        400,
        "MISSING_FIELDS"
      );
    }

    // Resolve publicRiderId to internal riderId
    console.log(
      `Resolving publicRiderId: ${platformRiderId} to internal riderId...`
    );
    const internalRiderId = await resolvePublicRiderIdToRiderId(
      platformRiderId
    );

    if (!internalRiderId) {
      throw createError(
        `Rider with public ID "${platformRiderId}" not found in rider service`,
        404,
        "RIDER_NOT_FOUND"
      );
    }

    console.log(`Resolved ${platformRiderId} → ${internalRiderId}`);

    // Check if clientRiderId is globally unique
    const duplicateClientRiderId = await prisma.clientRiderMapping.findFirst({
      where: { clientRiderId },
    });
    if (duplicateClientRiderId) {
      throw createError(
        `Client rider ID "${clientRiderId}" is already in use by another mapping`,
        409,
        "DUPLICATE_CLIENT_RIDER_ID"
      );
    }
    // Check if mapping already exists for this client and rider
    const existing = await prisma.clientRiderMapping.findFirst({
      where: {
        clientId,
        platformRiderId: internalRiderId,
      },
    });
    if (existing) {
      throw createError(
        `This rider is already mapped to client with client rider ID: ${existing.clientRiderId}`,
        409,
        "DUPLICATE_PLATFORM_RIDER"
      );
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw createError("Client not found", 404, "CLIENT_NOT_FOUND");
    }

    // Create mapping with internal riderId and publicRiderId
    const mapping = await prisma.clientRiderMapping.create({
      data: {
        platformRiderId: internalRiderId, // Store internal UUID
        publicRiderId: platformRiderId, // Store publicRiderId (e.g., DEL-25-R000044)
        clientId,
        clientRiderId,
        assignedBy,
        assignedByName,
        notes,
        source,
        priority,
        verificationStatus,
        isActive: true,
      },
      include: {
        client: {
          select: {
            name: true,
            clientCode: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Client rider mapping created successfully",
      data: mapping,
    });
  }
);

/**
 * Update existing mapping
 * PUT /api/client-rider-mappings/:id
 */
export const updateMapping = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if mapping exists
    const existing = await prisma.clientRiderMapping.findUnique({
      where: { id },
    });

    if (!existing) {
      throw createError("Mapping not found", 404, "NOT_FOUND");
    }

    // If updating clientRiderId, check for global duplicates
    if (
      updateData.clientRiderId &&
      updateData.clientRiderId !== existing.clientRiderId
    ) {
      const duplicate = await prisma.clientRiderMapping.findFirst({
        where: {
          clientRiderId: updateData.clientRiderId,
          id: { not: id },
        },
      });
      if (duplicate) {
        throw createError(
          `Client rider ID "${updateData.clientRiderId}" is already in use by another mapping`,
          409,
          "DUPLICATE_CLIENT_RIDER_ID"
        );
      }
    }

    // Update mapping
    const updated = await prisma.clientRiderMapping.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        client: {
          select: {
            name: true,
            clientCode: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Mapping updated successfully",
      data: updated,
    });
  }
);

/**
 * Deactivate mapping (soft delete)
 * DELETE /api/client-rider-mappings/:id
 */
export const deactivateMapping = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { deactivationReason } = req.body;

    const existing = await prisma.clientRiderMapping.findUnique({
      where: { id },
    });

    if (!existing) {
      throw createError("Mapping not found", 404, "NOT_FOUND");
    }

    const updated = await prisma.clientRiderMapping.update({
      where: { id },
      data: {
        isActive: false,
        deactivationDate: new Date(),
        deactivationReason: deactivationReason || "Manually deactivated",
      },
    });

    res.json({
      success: true,
      message: "Mapping deactivated successfully",
      data: updated,
    });
  }
);

/**
 * Verify mapping
 * POST /api/client-rider-mappings/:id/verify
 */
export const verifyMapping = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { verifiedBy, status = "verified" } = req.body;

    const existing = await prisma.clientRiderMapping.findUnique({
      where: { id },
    });

    if (!existing) {
      throw createError("Mapping not found", 404, "NOT_FOUND");
    }

    const updated = await prisma.clientRiderMapping.update({
      where: { id },
      data: {
        verificationStatus: status,
        verifiedBy,
        verifiedAt: new Date(),
      },
      include: {
        client: {
          select: {
            name: true,
            clientCode: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: `Mapping ${status} successfully`,
      data: updated,
    });
  }
);

/**
 * Bulk create mappings
 * POST /api/client-rider-mappings/bulk
 */
export const bulkCreateMappings = asyncHandler(
  async (req: Request, res: Response) => {
    const { mappings, source = "bulk-upload" } = req.body;

    if (!Array.isArray(mappings) || mappings.length === 0) {
      throw createError(
        "mappings array is required and must not be empty",
        400,
        "INVALID_INPUT"
      );
    }

    const results = {
      successful: [] as any[],
      failed: [] as any[],
    };

    for (const mapping of mappings) {
      try {
        // Check for global duplicate clientRiderId
        const duplicateClientRiderId =
          await prisma.clientRiderMapping.findFirst({
            where: { clientRiderId: mapping.clientRiderId },
          });
        if (duplicateClientRiderId) {
          results.failed.push({
            ...mapping,
            error: "Client rider ID is already in use by another mapping",
          });
          continue;
        }
        // Check for duplicate mapping for this client and rider
        const existing = await prisma.clientRiderMapping.findFirst({
          where: {
            clientId: mapping.clientId,
            platformRiderId: mapping.platformRiderId,
          },
        });
        if (existing) {
          results.failed.push({
            ...mapping,
            error:
              "This rider is already mapped to the client with a different Client Rider ID",
          });
          continue;
        }

        const created = await prisma.clientRiderMapping.create({
          data: {
            platformRiderId: mapping.platformRiderId,
            clientId: mapping.clientId,
            clientRiderId: mapping.clientRiderId,
            assignedBy: mapping.assignedBy,
            assignedByName: mapping.assignedByName,
            notes: mapping.notes,
            source,
            priority: mapping.priority || "standard",
            verificationStatus: mapping.verificationStatus || "pending",
            isActive: true,
          },
        });

        results.successful.push(created);
      } catch (error: any) {
        results.failed.push({
          ...mapping,
          error: error.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${results.successful.length} mappings, ${results.failed.length} failed`,
      data: results,
    });
  }
);
