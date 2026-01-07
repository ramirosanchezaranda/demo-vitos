export type Flow = "in" | "out";
export type Status = "ok" | "void" | "corrected";

export type StockItem = {
  id: string;
  flavorName: string;
  totalKg: number;
  totalIn: number;
  totalOut: number;
  countIn: number;  // Cantidad de baldes entrada
  countOut: number; // Cantidad de baldes salida
  lastUpdated: string | null;  // Solo si hay movimientos
  averagePricePerKgIn: number | null;
  averagePricePerKgOut: number | null;
};

export type Flavor = {
  id: string;
  name: string;
  plu: string | null;
  pricePerKg: number | null;
  sortOrder: number;
  isActive: boolean;
};

export type Movement = {
  id: string;
  createdAt: string;      // ISO
  flow: Flow;             // in/out
  flavorName: string;     // guardamos name simple (sin FK para MVP)
  barcode: string;
  raw: string;
  weightKg: number | null;
  pricePerKg: number | null;
  total: number | null;
  status: Status;
};
