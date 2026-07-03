/** pgvector helpers — pure, unit-testable. */

/** Serialize an embedding to a pgvector literal. Throws on non-finite values (SQL-injection guard). */
export function vectorLiteral(vec) {
  if (!Array.isArray(vec) || vec.length === 0) throw new Error('vectorLiteral: empty vector');
  for (const v of vec) {
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      throw new Error('vectorLiteral: vector contains a non-finite value');
    }
  }
  return `[${vec.join(',')}]`;
}

export function cosineSim(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
