const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../config/prisma');

describe('Inventory Invariant — Stock Ledger Balance Verification', () => {
  it('should verify that for every batch, quantityAvailable matches the sum of its stock transactions', async () => {
    const batches = await prisma.medicineBatch.findMany({
      include: {
        transactions: true,
        medicine: true,
      },
    });

    assert.ok(batches.length > 0, 'Database should contain seeded medicine batches');

    for (const batch of batches) {
      const sumOfLedger = batch.transactions.reduce((acc, txn) => acc + txn.quantityChange, 0);

      assert.equal(
        batch.quantityAvailable,
        sumOfLedger,
        `Batch ${batch.batchNumber} (${batch.medicine.name}) available stock (${batch.quantityAvailable}) must strictly equal sum of ledger transactions (${sumOfLedger})`
      );

      assert.ok(
        batch.quantityAvailable >= 0,
        `Batch ${batch.batchNumber} available stock must never be negative`
      );
    }
  });

  it('should verify that all medicines have valid active batches or tracked stock', async () => {
    const medicines = await prisma.medicine.findMany({
      include: {
        batches: true,
      },
    });

    assert.ok(medicines.length >= 15, 'Should have at least 15 seeded medicines');

    for (const med of medicines) {
      assert.ok(med.medicineCode.startsWith('MED-'), `Medicine code ${med.medicineCode} should have valid prefix`);
      assert.ok(med.batches.length > 0, `Medicine ${med.name} should have at least one batch`);
    }
  });

  it('should verify that pharmacist profile and user credentials exist', async () => {
    const pharmacistUser = await prisma.user.findFirst({
      where: { role: 'PHARMACIST', isActive: true },
      include: { pharmacistProfile: true },
    });

    assert.ok(pharmacistUser, 'Active Pharmacist user should exist');
    assert.equal(pharmacistUser.email, 'pharmacist@medcore.health');
    assert.ok(pharmacistUser.pharmacistProfile, 'PharmacistProfile should be attached');
    assert.equal(pharmacistUser.pharmacistProfile.licenseNumber, 'RPH-2021-99881');
  });

  it('should verify that seeded dispensings have matching ledger entries and invoice lines', async () => {
    const dispensings = await prisma.dispensing.findMany({
      include: {
        items: true,
        transactions: true,
        invoice: {
          include: {
            items: true,
          },
        },
      },
    });

    assert.ok(dispensings.length > 0, 'Should have at least 1 seeded dispensing');

    for (const d of dispensings) {
      assert.ok(d.dispensingNumber.startsWith('DSP-'), 'Dispensing number should have DSP- prefix');
      assert.ok(d.items.length > 0, 'Dispensing must contain items');
      assert.ok(d.transactions.length > 0, 'Dispensing must have linked DISPENSE ledger transactions');

      for (const item of d.items) {
        assert.ok(item.quantity > 0, 'Dispensed quantity must be positive');
        assert.ok(Number(item.totalPrice) > 0, 'Total price must be positive');
      }

      if (d.invoice) {
        const pharmacyLine = d.invoice.items.find(
          (invItem) => invItem.dispensingItemId === d.items[0].id || invItem.source === 'PHARMACY'
        );
        assert.ok(pharmacyLine, 'Invoice should contain matching pharmacy line item');
      }
    }
  });
});
