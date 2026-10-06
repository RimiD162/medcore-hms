/**
 * Result Flagging Service (Pure Technical Decision Engine)
 * 
 * Rules:
 * - Technical-only flags (NORMAL, LOW, HIGH, CRITICAL, NOT_EVALUATED)
 * - Safe Decimal / numeric handling
 * - Neutral, objective technical wording (no clinical diagnoses)
 * - Pure, deterministic evaluation
 */

/**
 * Evaluate a single parameter value against configured numerical or qualitative criteria
 * @param {Object} param - Parameter definition with low, high, criticalLow, criticalHigh, allowedOptions, resultType
 * @param {number|string|null} numericValue - User-entered numeric measurement
 * @param {string|null} textValue - User-entered qualitative finding
 * @returns {string} One of: 'NORMAL', 'LOW', 'HIGH', 'CRITICAL', 'NOT_EVALUATED'
 */
function evaluateParameterFlag(param, numericValue, textValue) {
  if (!param) return 'NOT_EVALUATED';

  const rType = (param.resultType || param.parameterType || 'NUMERIC').toUpperCase();

  if (rType === 'NUMERIC') {
    if (numericValue === null || numericValue === undefined || numericValue === '') {
      return 'NOT_EVALUATED';
    }

    const val = typeof numericValue === 'number' ? numericValue : parseFloat(numericValue);
    if (isNaN(val)) {
      return 'NOT_EVALUATED';
    }

    const cLow = param.criticalLow !== null && param.criticalLow !== undefined ? parseFloat(param.criticalLow) : null;
    const cHigh = param.criticalHigh !== null && param.criticalHigh !== undefined ? parseFloat(param.criticalHigh) : null;
    const minR = (param.low !== null && param.low !== undefined)
      ? parseFloat(param.low)
      : (param.minRange !== null && param.minRange !== undefined ? parseFloat(param.minRange) : null);
    const maxR = (param.high !== null && param.high !== undefined)
      ? parseFloat(param.high)
      : (param.maxRange !== null && param.maxRange !== undefined ? parseFloat(param.maxRange) : null);

    // 1. Critical High / Low check takes top precedence
    if (cLow !== null && !isNaN(cLow) && val < cLow) {
      return 'CRITICAL';
    }
    if (cHigh !== null && !isNaN(cHigh) && val > cHigh) {
      return 'CRITICAL';
    }

    // 2. Standard Reference Range checks
    if (minR !== null && !isNaN(minR) && val < minR) {
      return 'LOW';
    }
    if (maxR !== null && !isNaN(maxR) && val > maxR) {
      return 'HIGH';
    }

    // 3. If reference ranges were configured and value is within bounds, it's NORMAL
    if ((minR !== null && !isNaN(minR)) || (maxR !== null && !isNaN(maxR))) {
      return 'NORMAL';
    }

    return 'NOT_EVALUATED';
  }

  if (rType === 'QUALITATIVE' || rType === 'POSITIVE_NEGATIVE' || rType === 'TEXT') {
    if (!textValue || typeof textValue !== 'string') {
      return 'NOT_EVALUATED';
    }

    const cleanInput = textValue.trim().toLowerCase();
    
    // Standard qualitative keywords
    if (
      cleanInput.includes('negative') ||
      cleanInput.includes('non-reactive') ||
      cleanInput.includes('not detected') ||
      cleanInput.includes('absent') ||
      cleanInput.includes('normal') ||
      cleanInput.includes('clear')
    ) {
      return 'NORMAL';
    }

    if (
      cleanInput.includes('positive') ||
      cleanInput.includes('reactive') ||
      cleanInput.includes('detected') ||
      cleanInput.includes('present') ||
      cleanInput.includes('turbid') ||
      cleanInput.includes('cloudy')
    ) {
      return 'HIGH';
    }

    return 'NOT_EVALUATED';
  }

  return 'NOT_EVALUATED';
}

/**
 * Derive overall summary flag from a collection of parameter flags
 * @param {Array<{flag: string}>} evaluatedValues 
 * @returns {{ overallFlag: string, isCritical: boolean, criticalCount: number, abnormalCount: number }}
 */
function deriveOverallFlag(evaluatedValues = []) {
  let hasCritical = false;
  let hasLowOrHigh = false;
  let criticalCount = 0;
  let abnormalCount = 0;

  for (const item of evaluatedValues) {
    const flag = item.flag || 'NOT_EVALUATED';
    if (flag === 'CRITICAL') {
      hasCritical = true;
      criticalCount++;
    } else if (flag === 'LOW' || flag === 'HIGH') {
      hasLowOrHigh = true;
      abnormalCount++;
    }
  }

  let overallFlag = 'NORMAL';
  if (hasCritical) {
    overallFlag = 'CRITICAL';
  } else if (hasLowOrHigh) {
    overallFlag = 'HIGH';
  } else if (evaluatedValues.every((v) => v.flag === 'NOT_EVALUATED')) {
    overallFlag = 'NOT_EVALUATED';
  }

  return {
    overallFlag,
    isCritical: hasCritical,
    criticalCount,
    abnormalCount,
  };
}

/**
 * Format reference range snapshot string
 */
function formatReferenceRange(param) {
  if (!param) return 'N/A';
  if (param.resultType === 'QUALITATIVE' || param.resultType === 'POSITIVE_NEGATIVE' || param.resultType === 'TEXT') {
    return 'Expected: Negative / Non-reactive';
  }

  const minVal = param.low !== null && param.low !== undefined ? param.low : param.minRange;
  const maxVal = param.high !== null && param.high !== undefined ? param.high : param.maxRange;

  const parts = [];
  if (minVal !== null && minVal !== undefined && maxVal !== null && maxVal !== undefined) {
    parts.push(`${minVal} - ${maxVal}`);
  } else if (minVal !== null && minVal !== undefined) {
    parts.push(`≥ ${minVal}`);
  } else if (maxVal !== null && maxVal !== undefined) {
    parts.push(`≤ ${maxVal}`);
  }

  if (param.unit) {
    parts.push(param.unit);
  }

  return parts.length > 0 ? parts.join(' ') : 'Standard Reference Range';
}

module.exports = {
  evaluateParameterFlag,
  deriveOverallFlag,
  formatReferenceRange,
};
