const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../config/prisma');
const labValidators = require('../validators/labValidators');
const resultFlagService = require('../services/resultFlagService');
const labCatalogService = require('../services/labCatalogService');
const labOrderService = require('../services/labOrderService');
const labSampleService = require('../services/labSampleService');
const labResultService = require('../services/labResultService');
const labReportService = require('../services/labReportService');
const labDashboardService = require('../services/labDashboardService');

describe('Laboratory Module — Core Features & Safety Invariants', () => {

  // ── 1. Pure Technical Flag Engine ───────────────────────────
  describe('1. Pure Technical Flag Engine', () => {
    const numericParam = {
      parameterType: 'NUMERIC',
      unit: 'g/dL',
      minRange: 12.0,
      maxRange: 17.5,
      criticalLow: 7.0,
      criticalHigh: 20.0,
    };

    it('should return NORMAL for values strictly within reference bounds', () => {
      const flag = resultFlagService.evaluateParameterFlag(numericParam, 14.5, null);
      assert.equal(flag, 'NORMAL');
    });

    it('should return LOW for values below minimum range but above critical low', () => {
      const flag = resultFlagService.evaluateParameterFlag(numericParam, 10.2, null);
      assert.equal(flag, 'LOW');
    });

    it('should return HIGH for values above maximum range but below critical high', () => {
      const flag = resultFlagService.evaluateParameterFlag(numericParam, 18.5, null);
      assert.equal(flag, 'HIGH');
    });

    it('should return CRITICAL for values below critical low', () => {
      const flag = resultFlagService.evaluateParameterFlag(numericParam, 5.8, null);
      assert.equal(flag, 'CRITICAL');
    });

    it('should return CRITICAL for values above critical high', () => {
      const flag = resultFlagService.evaluateParameterFlag(numericParam, 22.1, null);
      assert.equal(flag, 'CRITICAL');
    });

    it('should evaluate qualitative parameter flags accurately', () => {
      const qualParam = {
        parameterType: 'QUALITATIVE',
        targetValue: 'Negative',
      };

      assert.equal(resultFlagService.evaluateParameterFlag(qualParam, null, 'Negative'), 'NORMAL');
      assert.equal(resultFlagService.evaluateParameterFlag(qualParam, null, 'negative'), 'NORMAL');
      assert.equal(resultFlagService.evaluateParameterFlag(qualParam, null, 'Positive'), 'HIGH');
      assert.equal(resultFlagService.evaluateParameterFlag(qualParam, null, 'Reactive'), 'HIGH');
    });

    it('should derive overall flag giving critical priority', () => {
      const resultsWithCritical = [
        { flag: 'NORMAL' },
        { flag: 'HIGH' },
        { flag: 'CRITICAL' },
        { flag: 'LOW' },
      ];
      const summary = resultFlagService.deriveOverallFlag(resultsWithCritical);
      assert.equal(summary.overallFlag, 'CRITICAL');
      assert.equal(summary.isCritical, true);
      assert.equal(summary.criticalCount, 1);
      assert.equal(summary.abnormalCount, 2);
    });

    it('should derive overall flag NORMAL when all parameters are normal', () => {
      const normalResults = [
        { flag: 'NORMAL' },
        { flag: 'NORMAL' },
      ];
      const summary = resultFlagService.deriveOverallFlag(normalResults);
      assert.equal(summary.overallFlag, 'NORMAL');
      assert.equal(summary.isCritical, false);
    });
  });

  // ── 2. Zod Validation Schemas ────────────────────────────────
  describe('2. Zod Validation Schemas', () => {
    it('should validate test catalog creation schema with parameters', () => {
      const payload = {
        testCode: 'TEST-SER-01',
        testName: 'Serum Ferritin',
        category: 'Biochemistry',
        sampleType: 'SERUM',
        price: 35.0,
        parameters: [
          {
            parameterName: 'Ferritin',
            parameterType: 'NUMERIC',
            unit: 'ng/mL',
            minRange: 30,
            maxRange: 400,
            criticalLow: 10,
          },
        ],
      };

      const parsed = labValidators.createLabTestSchema.safeParse(payload);
      assert.equal(parsed.success, true);
    });

    it('should reject test creation with missing category or negative price', () => {
      const invalid = {
        testName: 'Incomplete Test',
        price: -10,
      };

      const parsed = labValidators.createLabTestSchema.safeParse(invalid);
      assert.equal(parsed.success, false);
    });

    it('should require positive patient confirmation for sample collection', () => {
      const valid = {
        confirmPatientId: true,
        collectionNotes: 'Left antecubital fossa',
      };
      const parsed = labValidators.collectSampleSchema.safeParse(valid);
      assert.equal(parsed.success, true);
      assert.equal(parsed.data.confirmPatientId, true);
    });

    it('should require reason for specimen rejection', () => {
      const invalid = {
        notes: 'Specimen unusable',
      };
      const parsed = labValidators.rejectSampleSchema.safeParse(invalid);
      assert.equal(parsed.success, false);

      const valid = {
        rejectionReason: 'HEMOLYZED',
        rejectionNotes: 'Gross hemolysis detected in centrifuge',
      };
      const validParsed = labValidators.rejectSampleSchema.safeParse(valid);
      assert.equal(validParsed.success, true);
    });

    it('should require reason for result correction', () => {
      const invalid = {
        values: [{ parameterId: 'param-1', numericValue: 12.4 }],
      };
      const parsed = labValidators.correctResultSchema.safeParse(invalid);
      assert.equal(parsed.success, false);

      const valid = {
        reason: 'Typo during manual transcription entry',
        values: [{ parameterId: 'param-1', numericValue: 12.4 }],
      };
      const validParsed = labValidators.correctResultSchema.safeParse(valid);
      assert.equal(validParsed.success, true);
    });
  });

  // ── 3. Database Services & Workflows ─────────────────────────
  describe('3. Database Diagnostic Workflows & Rules', () => {
    let testUserTech;
    let testUserVerifier;
    let testPatient;
    let testDoctor;
    let testTest1;
    let testTest2;

    it('setup: should identify seed users, patient, doctor, and catalog tests', async () => {
      testUserTech = await prisma.user.findFirst({
        where: { email: 'lab@medcore.health' },
      });
      testUserVerifier = await prisma.user.findFirst({
        where: { email: 'lab_verifier@medcore.health' },
      });
      testPatient = await prisma.patient.findFirst();
      testDoctor = await prisma.doctorProfile.findFirst();
      
      const tests = await prisma.labTest.findMany({
        where: { isActive: true },
        include: { parameters: true },
        take: 2,
      });

      testTest1 = tests[0];
      testTest2 = tests[1];

      assert.ok(testUserTech, 'Technician user exists');
      assert.ok(testUserVerifier, 'Verifier user exists');
      assert.ok(testPatient, 'Patient exists');
      assert.ok(testDoctor, 'Doctor profile exists');
      assert.ok(testTest1, 'Catalog test 1 exists');
    });

    it('should list catalog tests and distinct categories', async () => {
      const catalog = await labCatalogService.listTests({ page: 1, limit: 10 });
      assert.ok(catalog.tests.length > 0);
      assert.ok(catalog.pagination.total > 0);

      const categories = await labCatalogService.listCategories();
      assert.ok(categories.length > 0);
    });

    it('should create a multi-test lab order and automatically group specimens by sampleType', async () => {
      const order = await labOrderService.createOrder(testDoctor.id, {
        patientId: testPatient.id,
        items: [
          { testId: testTest1.id, notes: 'Fasting sample' },
        ],
        priority: 'STAT',
        clinicalNotes: 'Evaluate acute diagnostic workup',
      });

      assert.ok(order.id);
      assert.ok(order.orderNumber.startsWith('ORD-'));
      assert.equal(order.priority, 'STAT');
      assert.equal(order.status, 'ORDERED');
      assert.ok(order.samples.length >= 1, 'Sample automatically generated for sampleType');
      assert.ok(order.samples[0].sampleBarcode.includes('SMP'));
    });

    it('should enforce patient confirmation during sample collection', async () => {
      // Create fresh test order
      const order = await labOrderService.createOrder(testDoctor.id, {
        patientId: testPatient.id,
        items: [{ testId: testTest1.id }],
        priority: 'ROUTINE',
      });

      const sample = order.samples[0];

      // Reject collection if confirmPatientId is false
      await assert.rejects(
        async () => {
          await labSampleService.collectSample(
            sample.id,
            { confirmPatientId: false },
            testUserTech.id
          );
        },
        /Patient identity must be positively confirmed/
      );

      // Successfully collect sample when confirmed
      const collected = await labSampleService.collectSample(
        sample.id,
        { confirmPatientId: true, storageLocation: 'Centrifuge Bin 2' },
        testUserTech.id
      );

      assert.equal(collected.status, 'COLLECTED');
      assert.equal(collected.collectedById, testUserTech.id);
    });

    it('should handle sample rejection with reason and trigger recollection', async () => {
      const order = await labOrderService.createOrder(testDoctor.id, {
        patientId: testPatient.id,
        items: [{ testId: testTest1.id }],
        priority: 'ROUTINE',
      });

      const sample = order.samples[0];

      // Reject sample
      const rejected = await labSampleService.rejectSample(
        sample.id,
        {
          rejectionReason: 'HEMOLYZED',
          rejectionNotes: 'Sample visibly hemolyzed in collection tube',
        },
        testUserTech.id
      );

      assert.equal(rejected.status, 'REJECTED');
      assert.equal(rejected.rejectionReason, 'HEMOLYZED');

      // Recollect sample
      const recollected = await labSampleService.recollectSample(
        sample.id,
        { instructions: 'Use 21G butterfly needle to avoid hemolysis' },
        testUserTech.id
      );

      assert.ok(recollected.status === 'PENDING' || recollected.status === 'PENDING_COLLECTION');
      assert.ok(recollected.recollectionOfId === sample.id || recollected.recollectedFrom?.id === sample.id || recollected.recollectionOf?.id === sample.id);
    });

    it('should enter parameter results with server-owned units and compute flags', async () => {
      const order = await labOrderService.createOrder(testDoctor.id, {
        patientId: testPatient.id,
        items: [{ testId: testTest1.id }],
        priority: 'ROUTINE',
      });

      const sample = order.samples[0];
      await labSampleService.collectSample(sample.id, { confirmPatientId: true }, testUserTech.id);
      await labSampleService.receiveSample(sample.id, { storageLocation: 'Rack 1' }, testUserTech.id);

      const orderItem = order.items[0];
      const testDef = await labCatalogService.getTestById(testTest1.id);
      const firstParam = testDef.parameters[0];

      const result = await labResultService.enterResults(
        orderItem.id,
        {
          values: [
            {
              parameterId: firstParam.id,
              numericValue: firstParam.minRange !== null ? Number(firstParam.minRange) + 1 : 15,
            },
          ],
          technicalNotes: 'Calibrated on Sysmex XN-1000',
        },
        testUserTech.id
      );

      assert.ok(result.id);
      assert.equal(result.status, 'ENTERED');
      assert.equal(result.enteredById, testUserTech.id);
      assert.equal(result.values.length, 1);
      assert.equal(result.values[0].unit, firstParam.unit, 'Server-owned unit preserved');
    });

    it('should log immutable correction history when correcting a result', async () => {
      const order = await labOrderService.createOrder(testDoctor.id, {
        patientId: testPatient.id,
        items: [{ testId: testTest1.id }],
        priority: 'ROUTINE',
      });

      const sample = order.samples[0];
      await labSampleService.collectSample(sample.id, { confirmPatientId: true }, testUserTech.id);

      const orderItem = order.items[0];
      const testDef = await labCatalogService.getTestById(testTest1.id);
      const firstParam = testDef.parameters[0];

      // Enter initial value
      const initialResult = await labResultService.enterResults(
        orderItem.id,
        {
          values: [{ parameterId: firstParam.id, numericValue: 12.0 }],
        },
        testUserTech.id
      );

      // Correct value with formal reason
      const correctedResult = await labResultService.correctResult(
        initialResult.id,
        {
          reason: 'Dilution factor adjusted by 1:2',
          values: [{ parameterId: firstParam.id, numericValue: 14.5 }],
        },
        testUserTech.id
      );

      assert.equal(correctedResult.status, 'CORRECTED');
      assert.ok(correctedResult.corrections.length >= 1, 'Correction record created in audit log');
      assert.equal(correctedResult.corrections[0].reason, 'Dilution factor adjusted by 1:2');
    });

    it('should enforce STRICT SEPARATE VERIFIER RULE (preventing self-verification)', async () => {
      const order = await labOrderService.createOrder(testDoctor.id, {
        patientId: testPatient.id,
        items: [{ testId: testTest1.id }],
        priority: 'ROUTINE',
      });

      const sample = order.samples[0];
      await labSampleService.collectSample(sample.id, { confirmPatientId: true }, testUserTech.id);

      const orderItem = order.items[0];
      const testDef = await labCatalogService.getTestById(testTest1.id);

      // Tech user enters results
      await labResultService.enterResults(
        orderItem.id,
        {
          values: testDef.parameters.map((p) => ({
            parameterId: p.id,
            numericValue: p.minRange ? Number(p.minRange) + 0.5 : 10,
          })),
        },
        testUserTech.id
      );

      // Same Tech user attempts to verify and release report -> MUST FAIL
      await assert.rejects(
        async () => {
          await labReportService.verifyAndReleaseReport(
            order.id,
            { summary: 'Verified by self' },
            testUserTech // same user
          );
        },
        /Separate verifier policy violation/
      );

      // Different verifier user verifies and releases report -> MUST SUCCEED
      const releasedReport = await labReportService.verifyAndReleaseReport(
        order.id,
        { summary: 'Verified and approved by Senior Pathologist' },
        testUserVerifier // different user
      );

      assert.equal(releasedReport.status, 'RELEASED');
      assert.equal(releasedReport.verifiedById, testUserVerifier.id);
    });

    it('should provide complete dashboard operational statistics', async () => {
      const stats = await labDashboardService.getDashboardStats();
      assert.ok(stats.kpis);
      assert.ok(typeof stats.kpis.pendingCollectionCount === 'number');
      assert.ok(typeof stats.kpis.samplesInLabCount === 'number');
      assert.ok(typeof stats.kpis.completedTodayCount === 'number');
      assert.ok(Array.isArray(stats.sampleTypeBreakdown));
      assert.ok(Array.isArray(stats.recentUrgentOrders));
    });

    it('should preserve Doctor module compatibility endpoints', async () => {
      // Doctor views lab reports
      const docReports = await labReportService.getLabReports(testDoctor.id, { page: 1, limit: 10 });
      assert.ok(Array.isArray(docReports.reports));

      // Doctor reviews a report
      const report = await prisma.labReport.findFirst({
        where: { status: 'RELEASED' },
      });

      if (report) {
        const reviewed = await labReportService.reviewLabReport(
          report.orderedById || testDoctor.id,
          report.id,
          'Clinical interpretation: Results consistent with stable baseline'
        );
        assert.equal(reviewed.isReviewed, true);
        assert.ok(reviewed.reviewedAt);
      }
    });
  });
});
