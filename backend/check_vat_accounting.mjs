import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVATAccounting() {
    try {
        console.log('🔍 Checking VAT Accounting Setup...\n');

        const tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            console.error('❌ No tenant found');
            return;
        }

        console.log(`✅ Tenant: ${tenant.name} (ID: ${tenant.id})\n`);

        // 1. Check VAT Receivable Account
        const vatReceivable = await prisma.account.findFirst({
            where: {
                tenantId: tenant.id,
                code: '1157'
            }
        });

        console.log('📊 VAT Receivable Account:');
        if (vatReceivable) {
            console.log(`   ✅ Found: ${vatReceivable.code} - ${vatReceivable.name}`);
            console.log(`   💰 Current Balance: KES ${Number(vatReceivable.balance).toFixed(2)}`);
            console.log(`   🏷️  Type: ${vatReceivable.type}, Subtype: ${vatReceivable.subtype}`);
        } else {
            console.log('   ❌ VAT Receivable (1157) NOT FOUND!');
        }

        console.log('\n' + '='.repeat(60));

        // 2. Check Recent Purchases
        const recentPurchases = await prisma.purchase.findMany({
            where: { tenantId: tenant.id },
            include: {
                vendor: { select: { name: true } },
                journal: {
                    include: {
                        lines: {
                            include: {
                                account: {
                                    select: { code: true, name: true, type: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 3
        });

        console.log(`\n📋 Recent Purchases (Last 3):\n`);

        if (recentPurchases.length === 0) {
            console.log('   ⚠️  No purchases found. Create a bill to test VAT accounting.\n');
        } else {
            for (const purchase of recentPurchases) {
                console.log(`Purchase #${purchase.id} - ${purchase.vendor?.name || 'No Vendor'}`);
                console.log(`   Date: ${purchase.purchaseDate.toISOString().split('T')[0]}`);
                console.log(`   Subtotal: KES ${Number(purchase.subtotal).toFixed(2)}`);
                console.log(`   Tax/VAT:  KES ${Number(purchase.tax).toFixed(2)}`);
                console.log(`   Total:    KES ${Number(purchase.total).toFixed(2)}`);

                if (purchase.journal && purchase.journal.lines) {
                    console.log(`   Journal Entry #${purchase.journal.id}:`);
                    for (const line of purchase.journal.lines) {
                        const dr = Number(line.debit).toFixed(2);
                        const cr = Number(line.credit).toFixed(2);
                        const type = dr > 0 ? `DR ${dr}` : `CR ${cr}`;
                        console.log(`      ${type.padEnd(12)} | ${line.account.code} - ${line.account.name}`);
                    }
                } else {
                    console.log('   ⚠️  No journal entry found');
                }
                console.log('');
            }
        }

        console.log('='.repeat(60));

        // 3. Check all VAT-related journal lines
        const vatJournalLines = await prisma.journalLine.findMany({
            where: {
                account: {
                    tenantId: tenant.id,
                    code: '1157'
                }
            },
            include: {
                account: { select: { code: true, name: true } },
                journal: { select: { id: true, date: true, reference: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        console.log(`\n💰 VAT Receivable Journal Lines (Last 10):\n`);

        if (vatJournalLines.length === 0) {
            console.log('   ⚠️  No VAT journal entries found.');
            console.log('   ℹ️  This means no bills with VAT have been created yet.\n');
        } else {
            console.log(`   ✅ Found ${vatJournalLines.length} VAT entries:\n`);
            for (const line of vatJournalLines) {
                const dr = Number(line.debit);
                const cr = Number(line.credit);
                const amount = dr > 0 ? `+${dr.toFixed(2)}` : `-${cr.toFixed(2)}`;
                console.log(`   ${line.journal.date.toISOString().split('T')[0]} | ${amount.padStart(12)} | ${line.journal.reference || 'N/A'}`);
            }
            console.log('');
        }

        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkVATAccounting();
