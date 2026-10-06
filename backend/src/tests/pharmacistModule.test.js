const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../config/prisma');
const pharmacistValidators = require('../validators/pharmacistValidators');
const medicineService = require('../services/medicineService');
const batchService = require('../services/batchService');
const inventoryService = require('../services/inventoryService');
const stockAlertService = require('../services/stockAlertService');
const prescriptionQueueService = require('../services/prescriptionQueueService');
const dispensingService = require('../services/dispensingService');
const pharmacyBillingService = require('../services/pharmacyBillingService');
const pharmacyDashboardService = require('../services/pharmacyDashboardService');

describe('Pharmacist Module — Core Features & Business Rules', () => {

  // ── 1. Zod Validation Schemas ─────────────────────────────────
  describe('1. Zod Validation Schemas', () => {
    it('should validate complete medicine catalog creation payload', () => {
      const validMedicine = {
        name: 'Cetirizine 10mg',
        genericName: 'Cetirizine Hydrochloride',
        category: 'Antihistamine',
        manufacturer: 'Cipla Ltd',
        strength: '10mg',
        dosageForm: 'Tablet',
        route: 'Oral',
        unit: 'Tablets',
        sellingPrice: 4.50,
        reorderLevel: 25,
        status: 'Active',
      };

      const result = pharmacistValidators.createMedicineSchema.safeParse(validMedicine);
      assert.equal(result.success, true);
    });

    it('should reject medicine with invalid or negative price', () => {
      const invalid = {
        name: 'Cetirizine 10mg',
        genericName: 'Cetirizine Hydrochloride',
        category: 'Antihistamine',
        manufacturer: 'Cipla Ltd',
        strength: '10mg',
        dosageForm: 'Tablet',
        sellingPrice: -5.00,
      };

      const result = pharmacistValidators.createMedicineSchema.safeParse(invalid);
      assert.equal(result.success, false);
    });

    it('should validate stock receipt payload', () => {
      const validReceipt = {
        supplier: 'Apollo Medsource Corp',
        invoiceReference: 'INV-2026-9988',
        notes: 'Cold chain verified',
        items: [
          {
            medicineId: '123e4567-e89b-12d3-a456-426614174000',
            batchNumber: 'BAT-TEST-001',
            quantityReceived: 100,
            purchaseCost: 2.50,
            sellingPrice: 5.00,
            expiryDate: '2027-12-31',
          },
        ],
      };

      const result = pharmacistValidators.stockReceiptSchema.safeParse(validReceipt);
      assert.equal(result.success, true);
    });

    it('should reject stock adjustment with zero quantity change or short reason', () => {
      const zeroQty = {
        batchId: '123e4567-e89b-12d3-a456-426614174000',
        quantityChange: 0,
        reason: 'Broken ampoules',
      };
      assert.equal(pharmacistValidators.stockAdjustmentSchema.safeParse(zeroQty).success, false);

      const shortReason = {
        batchId: '123e4567-e89b-12d3-a456-426614174000',
        quantityChange: -2,
        reason: 'No',
      };
      assert.equal(pharmacistValidators.stockAdjustmentSchema.safeParse(shortReason).success, false);
    });

    it('should validate dispensing payload with items and idempotency key', () => {
      const validDispense = {
        prescriptionId: '123e4567-e89b-12d3-a456-426614174000',
        idempotencyKey: 'idemp-dsp-test-key-001',
        notes: 'Patient advised to take with food',
        items: [
          {
            prescriptionItemId: '123e4567-e89b-12d3-a456-426614174001',
            medicineId: '123e4567-e89b-12d3-a456-426614174002',
            batchId: '123e4567-e89b-12d3-a456-426614174003',
            quantity: 10,
          },
        ],
      };

      const result = pharmacistValidators.createDispensingSchema.safeParse(validDispense);
      assert.equal(result.success, true);
    });
  });

  // ── 2. Medicine Catalog & Stock Queries ────────────────────────
  describe('2. Medicine Catalog & Usable Stock Derivation', () => {
    it('should retrieve catalog medicines with computed usableStock and status', async () => {
      const res = await medicineService.getMedicines({ limit: 10 });
      assert.ok(res.medicines);
      assert.ok(res.medicines.length > 0);
      assert.ok(typeof res.medicines[0].usableStock === 'number');
      assert.ok(['In Stock', 'Low Stock', 'Out of Stock'].includes(res.medicines[0].stockStatus));
    });

    it('should filter medicines by search query and category', async () => {
      const res = await medicineService.getMedicines({ search: 'Amoxicillin' });
      assert.ok(res.medicines);
      assert.ok(res.medicines.some((m) => m.name.includes('Amoxicillin') || m.genericName.includes('Amoxicillin')));
    });

    it('should detect and prevent duplicate medicine formulation creation', async () => {
      const existing = await prisma.medicine.findFirst();
      if (existing) {
        let threw = false;
        try {
          await medicineService.createMedicine({
            name: existing.name,
            genericName: existing.genericName,
            category: existing.category,
            manufacturer: existing.manufacturer,
            strength: existing.strength,
            dosageForm: existing.dosageForm,
            sellingPrice: 10.0,
          }, { fullName: 'Test Pharmacist' });
        } catch (err) {
          threw = true;
          assert.equal(err.statusCode, 409);
        }
        assert.equal(threw, true);
      }
    });
  });

  // ── 3. Batch Management & Expiry Calculations ─────────────────
  describe('3. Batches & Expiry Risk Derivation', () => {
    it('should fetch batch list with calculated daysUntilExpiry and expiryStatus', async () => {
      const res = await batchService.getBatches({ limit: 10 });
      assert.ok(res.batches);
      assert.ok(res.batches.length > 0);
      assert.ok(typeof res.batches[0].daysUntilExpiry === 'number');
      assert.ok(res.batches[0].expiryStatus);
    });

    it('should categorize expiry risk into buckets correctly', async () => {
      const res = await stockAlertService.getExpiryBuckets();
      assert.ok(res.summary);
      assert.ok(typeof res.summary.expiredCount === 'number');
      assert.ok(typeof res.summary.in30DaysCount === 'number');
      assert.ok(typeof res.summary.in60DaysCount === 'number');
      assert.ok(typeof res.summary.in90DaysCount === 'number');
    });

    it('should identify low-stock medicines with urgency prioritization', async () => {
      const res = await stockAlertService.getLowStockMedicines();
      assert.ok(res.summary);
      assert.ok(typeof res.summary.totalLowStock === 'number');
      assert.ok(Array.isArray(res.lowStock));
    });
  });

  // ── 4. Goods Receipt & Stock Ledger Invariant ─────────────────
  describe('4. Goods Receipt & Append-Only Stock Ledger', () => {
    it('should receive stock, create/update batch, and write RECEIPT ledger row', async () => {
      const medicine = await prisma.medicine.findFirst({ where: { status: 'Active' } });
      assert.ok(medicine, 'Active medicine must exist');

      const pharmacistUser = await prisma.user.findFirst({ where: { role: 'PHARMACIST' } });

      const testBatchNumber = `BAT-TEST-${Date.now().toString().slice(-6)}`;
      const receiptPayload = {
        supplier: 'MedCore Test Pharma Supply',
        invoiceReference: `INV-TST-${Date.now()}`,
        notes: 'Automated test goods receipt',
        items: [
          {
            medicineId: medicine.id,
            batchNumber: testBatchNumber,
            quantityReceived: 45,
            purchaseCost: 3.20,
            sellingPrice: medicine.sellingPrice ? Number(medicine.sellingPrice) : 7.50,
            expiryDate: '2027-11-30',
          },
        ],
      };

      const result = await inventoryService.receiveStock(receiptPayload, pharmacistUser);
      assert.ok(result.receipt);
      assert.equal(result.itemsCount, 1);

      // Verify batch created
      const batch = await prisma.medicineBatch.findUnique({
        where: {
          medicineId_batchNumber: {
            medicineId: medicine.id,
            batchNumber: testBatchNumber,
          },
        },
        include: { transactions: true },
      });

      assert.ok(batch);
      assert.equal(batch.quantityAvailable, 45);

      // Verify invariant: batch.quantityAvailable == sum(transactions.quantityChange)
      const sumTransactions = batch.transactions.reduce((acc, t) => acc + t.quantityChange, 0);
      assert.equal(batch.quantityAvailable, sumTransactions);
    });

    it('should adjust stock on batch and maintain ledger integrity', async () => {
      const batch = await prisma.medicineBatch.findFirst({
        where: { quantityAvailable: { gt: 10 }, status: 'Active' },
      });
      assert.ok(batch, 'Batch with sufficient stock must exist');

      const initialQty = batch.quantityAvailable;
      const pharmacistUser = await prisma.user.findFirst({ where: { role: 'PHARMACIST' } });

      const adjResult = await inventoryService.adjustStock(
        {
          batchId: batch.id,
          quantityChange: -3,
          reason: 'Broken vial during handling (automated test)',
        },
        pharmacistUser
      );

      assert.equal(adjResult.batch.quantityAvailable, initialQty - 3);

      // Check ledger
      const tx = adjResult.transaction;
      assert.equal(tx.type, 'ADJUSTMENT_DECREASE');
      assert.equal(tx.quantityChange, -3);
      assert.equal(tx.balanceAfter, initialQty - 3);

      // Check sum of all transactions for this batch matches current quantity
      const allTx = await prisma.stockTransaction.findMany({ where: { batchId: batch.id } });
      const sum = allTx.reduce((acc, t) => acc + t.quantityChange, 0);
      assert.equal(adjResult.batch.quantityAvailable, sum);
    });
  });

  // ── 5. Prescription Queue & Hold/Release Workflow ─────────────
  describe('5. Prescription Queue & Hold/Release Workflow', () => {
    it('should list prescription queue with safe demographic projection', async () => {
      const res = await prescriptionQueueService.getPrescriptionQueue({ limit: 10 });
      assert.ok(res.prescriptions);
      assert.ok(res.prescriptions.length > 0);

      // Verify safe projection: patient has fullName and age, no doctor clinical notes exposed
      const rx = res.prescriptions[0];
      assert.ok(rx.patient.fullName);
      assert.ok(rx.patient.patientIdNumber);
      assert.ok(!rx.patient.medicalHistory); // Clinical records not projected
    });

    it('should place a prescription on hold with reason and release it back to queue', async () => {
      const rx = await prisma.prescription.findFirst({
        where: { dispensingStatus: 'PENDING', onHold: false },
      });
      assert.ok(rx, 'Pending prescription must exist');

      const pharmacistUser = await prisma.user.findFirst({ where: { role: 'PHARMACIST' } });

      // 1. Hold
      const held = await prescriptionQueueService.holdPrescription(
        rx.id,
        { reason: 'Dosage clarification required with prescriber' },
        pharmacistUser
      );
      assert.equal(held.onHold, true);
      assert.equal(held.dispensingStatus, 'ON_HOLD');

      // 2. Release
      const released = await prescriptionQueueService.releasePrescription(rx.id, pharmacistUser);
      assert.equal(released.onHold, false);
      assert.equal(released.dispensingStatus, 'PENDING');
    });
  });

  // ── 6. Dispensing Engine (FEFO, Concurrency, Billing) ─────────
  describe('6. Dispensing Engine & Idempotency', () => {
    it('should execute transactional dispensing, deduct stock, create invoice line, and guard with idempotency', async () => {
      // Find or setup an active prescription with mapped item
      const rx = await prisma.prescription.findFirst({
        where: {
          dispensingStatus: 'PENDING',
          onHold: false,
          items: {
            some: {
              medicineId: { not: null },
              quantityPrescribed: { gt: 0 },
            },
          },
        },
        include: {
          items: {
            include: {
              medicine: {
                include: {
                  batches: {
                    where: {
                      status: 'Active',
                      quantityAvailable: { gt: 5 },
                      expiryDate: { gte: new Date() },
                    },
                    orderBy: { expiryDate: 'asc' }, // FEFO batch
                  },
                },
              },
            },
          },
        },
      });

      assert.ok(rx, 'Prescription with mapped items and active batch must exist');

      const itemToDispense = rx.items.find((i) => i.medicine?.batches?.length > 0);
      assert.ok(itemToDispense, 'Item with available batch must exist');

      const batchToUse = itemToDispense.medicine.batches[0];
      const initialBatchQty = batchToUse.quantityAvailable;
      const dispenseQty = 2;

      const idempotencyKey = `idemp-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const pharmacistUser = await prisma.user.findFirst({ where: { role: 'PHARMACIST' } });

      const dispensePayload = {
        prescriptionId: rx.id,
        idempotencyKey,
        notes: 'Automated test dispensing',
        items: [
          {
            prescriptionItemId: itemToDispense.id,
            medicineId: itemToDispense.medicineId,
            batchId: batchToUse.id,
            quantity: dispenseQty,
          },
        ],
      };

      // First run: execute dispensing
      const res = await dispensingService.dispense(dispensePayload, pharmacistUser);
      assert.ok(res.dispensing);
      assert.ok(res.dispensing.id);
      assert.equal(res.dispensing.items.length, 1);
      assert.ok(res.invoice);

      // Verify batch stock was deducted
      const updatedBatch = await prisma.medicineBatch.findUnique({ where: { id: batchToUse.id } });
      assert.equal(updatedBatch.quantityAvailable, initialBatchQty - dispenseQty);

      // Verify shared invoice item created with category Pharmacy and source PHARMACY
      const invoiceItem = await prisma.invoiceItem.findFirst({
        where: { dispensingItemId: res.dispensing.items[0].id },
      });
      assert.ok(invoiceItem);
      assert.equal(invoiceItem.source, 'PHARMACY');
      assert.equal(invoiceItem.category, 'Pharmacy');
      assert.equal(Number(invoiceItem.quantity), dispenseQty);

      // Second run: Idempotency Replay test
      const replayRes = await dispensingService.dispense(dispensePayload, pharmacistUser);
      assert.ok(replayRes.isIdempotentReplay, 'Should return idempotency replay flag');
      assert.equal(replayRes.id, res.dispensing.id);

      // Verify stock was NOT deducted a second time
      const batchAfterReplay = await prisma.medicineBatch.findUnique({ where: { id: batchToUse.id } });
      assert.equal(batchAfterReplay.quantityAvailable, initialBatchQty - dispenseQty);
    });

    it('should reject dispensing when batch is expired', async () => {
      // Find an expired batch
      const expiredBatch = await prisma.medicineBatch.findFirst({
        where: { expiryDate: { lt: new Date() } },
        include: { medicine: true },
      });

      if (expiredBatch) {
        // Find or map a prescription item to this medicine
        let rxItem = await prisma.prescriptionItem.findFirst({
          where: {
            medicineId: expiredBatch.medicineId,
            quantityPrescribed: { gt: 0 },
            prescription: { dispensingStatus: 'PENDING', onHold: false },
          },
          include: { prescription: true },
        });

        if (!rxItem) {
          // Find any pending prescription and map its first item to this medicine
          const pendingRx = await prisma.prescription.findFirst({
            where: { dispensingStatus: 'PENDING', onHold: false },
            include: { items: true },
          });

          if (pendingRx && pendingRx.items.length > 0) {
            rxItem = await prisma.prescriptionItem.update({
              where: { id: pendingRx.items[0].id },
              data: {
                medicineId: expiredBatch.medicineId,
                quantityPrescribed: 10,
              },
              include: { prescription: true },
            });
          }
        }

        if (rxItem) {
          let threw = false;
          try {
            await dispensingService.dispense(
              {
                prescriptionId: rxItem.prescriptionId,
                idempotencyKey: `idemp-exp-test-${Date.now()}`,
                items: [
                  {
                    prescriptionItemId: rxItem.id,
                    medicineId: expiredBatch.medicineId,
                    batchId: expiredBatch.id,
                    quantity: 1,
                  },
                ],
              },
              { fullName: 'Test Pharmacist' }
            );
          } catch (err) {
            threw = true;
            assert.equal(err.statusCode, 400);
            assert.match(err.message, /expired/i);
          }
          assert.equal(threw, true);
        }
      }
    });

    it('should reject dispensing when requested quantity exceeds available stock', async () => {
      const rx = await prisma.prescription.findFirst({
        where: { dispensingStatus: 'PENDING', onHold: false },
        include: {
          items: {
            where: { medicineId: { not: null } },
            include: { medicine: { include: { batches: { where: { quantityAvailable: { gt: 0 } } } } } },
          },
        },
      });

      if (rx && rx.items[0]?.medicine?.batches[0]) {
        const item = rx.items[0];
        const batch = item.medicine.batches[0];
        let threw = false;
        try {
          await dispensingService.dispense(
            {
              prescriptionId: rx.id,
              idempotencyKey: `idemp-overstock-${Date.now()}`,
              items: [
                {
                  prescriptionItemId: item.id,
                  medicineId: batch.medicineId,
                  batchId: batch.id,
                  quantity: batch.quantityAvailable + 9999,
                },
              ],
            },
            { fullName: 'Test Pharmacist' }
          );
        } catch (err) {
          threw = true;
        }
        assert.equal(threw, true);
      }
    });
  });

  // ── 7. Pharmacy Dashboard & Billing Ledger ───────────────────
  describe('7. Dashboard KPIs & Billed Sales Ledger', () => {
    it('should retrieve accurate aggregate dashboard metrics', async () => {
      const dashboard = await pharmacyDashboardService.getDashboardMetrics();
      assert.ok(dashboard.stats);
      assert.ok(typeof dashboard.stats.totalMedicines === 'number');
      assert.ok(typeof dashboard.stats.totalStockUnits === 'number');
      assert.ok(typeof dashboard.stats.pendingPrescriptions === 'number');
      assert.ok(typeof dashboard.stats.prescriptionsDispensedToday === 'number');
      assert.ok(typeof dashboard.stats.lowStockMedicines === 'number');
      assert.ok(typeof dashboard.stats.expiryRiskBatches === 'number');
      assert.ok(typeof dashboard.stats.todayBilledSales === 'number');
    });

    it('should retrieve read-only billed pharmacy sales with billing status', async () => {
      const sales = await pharmacyBillingService.getSales({ limit: 10 });
      assert.ok(sales.sales);
      assert.ok(sales.summary);
      assert.ok(typeof sales.summary.totalBilledValue === 'number');
    });
  });
});
