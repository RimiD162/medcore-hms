require('dotenv').config();
const prisma = require('../src/config/prisma');

async function applyConstraints() {
  console.log('Applying database constraints for Pharmacy invariants...');
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_batch_qty_non_negative'
        ) THEN
          ALTER TABLE medicine_batches 
          ADD CONSTRAINT chk_batch_qty_non_negative 
          CHECK (quantity_available >= 0);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_dispense_item_qty_positive'
        ) THEN
          ALTER TABLE dispensing_items 
          ADD CONSTRAINT chk_dispense_item_qty_positive 
          CHECK (quantity > 0);
        END IF;
      END $$;
    `);
    console.log('✅ Constraints applied successfully.');
  } catch (err) {
    console.error('Error applying constraints:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

applyConstraints();
