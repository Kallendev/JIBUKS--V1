const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.account.count();
    console.log('Total accounts in database:', count);
    
    const accounts = await prisma.account.findMany({ 
      take: 5,
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        tenantId: true,
        isActive: true
      }
    });
    
    console.log('\nSample accounts:');
    accounts.forEach(a => {
      console.log(`  - ID: ${a.id}, Code: ${a.code}, Name: ${a.name}, Type: ${a.type}, TenantId: ${a.tenantId}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
