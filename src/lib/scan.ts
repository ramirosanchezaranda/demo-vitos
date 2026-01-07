2000000042206
/**
 * Scanner = teclado. Acumulamos caracteres y cerramos al Enter.
 * parseScan: placeholder hasta tener 3 lecturas reales del ticket.
 */
export type ParsedScan = {
  raw: string;
  barcode: string;
  weightKg: number | null;
  plu: string | null;
};

function computeEan13CheckDigit(first12: string): number | null {
  if (!/^\d{12}$/.test(first12)) return null;
  let sumOdd = 0;
  let sumEven = 0;
  for (let i = 0; i < 12; i++) {
    const n = first12.charCodeAt(i) - 48;
    if (n < 0 || n > 9) return null;
    if (i % 2 === 0) sumOdd += n;
    else sumEven += n;
  }
  const total = sumOdd + sumEven * 3;
  return (10 - (total % 10)) % 10;
}

function isValidEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  const expected = computeEan13CheckDigit(code.slice(0, 12));
  if (expected == null) return false;
  return expected === Number(code[12]);
}

export function parseScan(rawInput: string): ParsedScan {
  const raw = rawInput.trim();
  const barcode = raw.replace(/\D+/g, "");

  // Muchos tickets de balanza incluyen peso dentro del EAN-13.
  // Caso típico: 20-29 + PLU(5) + PESO(5) + dígito verificador (EAN-13).
  let weightKg: number | null = null;
  let plu: string | null = null;

  if (isValidEan13(barcode)) {
    const prefix1 = barcode[0];
    if (prefix1 === "2") {
      // Formato: 2 + PLU(6) + PESO(5) + check
      plu = barcode.slice(1, 7); // 6 dígitos de PLU
      const weight5 = barcode.slice(7, 12); // 5 dígitos de gramos
      const grams = Number(weight5);
      if (!Number.isNaN(grams) && grams > 0 && grams < 50000) {
        const guess = grams / 1000;
        if (guess > 0 && guess < 50) weightKg = guess;
      }
    }
  }

  // Fallback legacy: últimos 4 dígitos = gramos (ej 2545 => 2.545kg)
  if (weightKg == null && /^\d{6,}$/.test(barcode)) {
    const last4 = barcode.slice(-4);
    const grams = Number(last4);
    if (!Number.isNaN(grams) && grams > 0 && grams < 9999) {
      const guess = grams / 1000;
      if (guess > 0 && guess < 20) weightKg = guess;
    }
  }

  return { raw, barcode, weightKg, plu };
}

export function shouldIgnoreKeyEvent(e: KeyboardEvent) {
  const el = document.activeElement;
  const tag = (el?.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea";
}
