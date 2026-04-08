import { PrismaClient } from "@prisma/client";
import { seedTasks } from "./seeds/tasks.mjs";
import { seedUsers } from "./seeds/users.mjs";

const prisma = new PrismaClient();

async function main() {
  const usersByKey = await seedUsers(prisma);
  await seedTasks(prisma, usersByKey);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
