import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log("Wiping demo data from WealthPulse SQLite database...");

  // Delete all records in foreign-key safe order
  const deletedLogs = await prisma.importLog.deleteMany();
  const deletedTx = await prisma.transaction.deleteMany();
  const deletedHoldings = await prisma.holding.deleteMany();
  const deletedAccounts = await prisma.account.deleteMany();
  const deletedMembers = await prisma.familyMember.deleteMany();

  console.log("Database wiped successfully!");
  console.log(`- Import Logs removed: ${deletedLogs.count}`);
  console.log(`- Transactions removed: ${deletedTx.count}`);
  console.log(`- Holdings removed: ${deletedHoldings.count}`);
  console.log(`- Accounts removed: ${deletedAccounts.count}`);
  console.log(`- Family Members removed: ${deletedMembers.count}`);
}

cleanDatabase()
  .catch((e) => {
    console.error("Error wiping database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
