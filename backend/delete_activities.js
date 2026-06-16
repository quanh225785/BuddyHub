const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const hostId = '6829b393-011a-4a63-a3ac-ce7f3168ef26';

async function main() {
  console.log(`Deleting all activities hosted by user ID: ${hostId}`);
  const result = await prisma.activity.deleteMany({
    where: {
      hostId: hostId,
    },
  });
  console.log('Result:', result);
}

main()
  .catch((e) => {
    console.error('Error deleting activities:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
