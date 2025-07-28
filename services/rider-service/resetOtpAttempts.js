const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phone = '+918904020640'; // e.g. '+919876543210'
  const rider = await prisma.rider.update({
    where: { phone },
    data: { otpAttempts: 0 }
  });
  console.log(`otpAttempts reset for rider:`, rider);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());