import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSuppliers() {
    try {
        console.log('🔍 Checking Suppliers in Database...\n');

        const suppliers = await prisma.vendor.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            take: 40
        });

        console.log(`Total active suppliers: ${suppliers.length}\n`);
        console.log('Suppliers:');
        suppliers.forEach((sup, idx) => {
            console.log(`  ${idx + 1}. ${sup.name} (Tenant: ${sup.tenantId})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSuppliers();
