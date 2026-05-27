import { PrismaClient } from '@prisma/client';
import { SEED_ITEMS } from './seed-data';

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${SEED_ITEMS.length} items vào ActivityCategory và InterestTag...`);
  const seedNames = new Set(SEED_ITEMS.map((item) => item.name));
  const seedKeys = new Set(SEED_ITEMS.map((item) => item.key));

  for (const item of SEED_ITEMS) {
    await prisma.activityCategory.upsert({
      where: { name: item.name },
      update: { description: item.description, key: item.key },
      create: { name: item.name, key: item.key, description: item.description },
    });

    await prisma.interestTag.upsert({
      where: { name: item.name },
      update: { key: item.key },
      create: { name: item.name, key: item.key },
    });

    console.log(`  ✓ ${item.name}`);
  }

  const categories = await prisma.activityCategory.findMany({
    select: { name: true, key: true },
    orderBy: { name: 'asc' },
  });
  const tags = await prisma.interestTag.findMany({
    select: { name: true, key: true },
    orderBy: { name: 'asc' },
  });

  const categoryCount = categories.length;
  const tagCount = tags.length;
  console.log(`\nDone. DB hiện có ${categoryCount} ActivityCategory, ${tagCount} InterestTag.`);

  const extraCategories = categories
    .filter((item) => !seedKeys.has(item.key))
    .map((item) => `${item.name} (${item.key})`);
  const extraTags = tags
    .filter((item) => !seedKeys.has(item.key))
    .map((item) => `${item.name} (${item.key})`);

  if (extraCategories.length > 0) {
    console.log(`Extra ActivityCategory ngoài seed: ${extraCategories.join(', ')}`);
  }
  if (extraTags.length > 0) {
    console.log(`Extra InterestTag ngoài seed: ${extraTags.join(', ')}`);
  }
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
