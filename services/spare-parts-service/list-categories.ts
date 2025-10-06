import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listCategories() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        code: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log("Categories in the database:");
    console.log(JSON.stringify(categories, null, 2));
  } catch (error) {
    console.error("Error fetching categories:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listCategories();
