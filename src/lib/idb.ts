import type { Flavor, Movement, Flow, StockItem } from "./types";
import { uid } from "./utils";

const DB_NAME = "helado_scan_db";
const DB_VER = 3;

const STORE_FLAVORS = "flavors";
const STORE_MOVES = "movements";

type DBFlavor = Flavor;
type DBMove = Movement;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(STORE_FLAVORS)) {
        db.createObjectStore(STORE_FLAVORS, { keyPath: "name" });
      }

      if (!db.objectStoreNames.contains(STORE_MOVES)) {
        const st = db.createObjectStore(STORE_MOVES, { keyPath: "id" });
        st.createIndex("by_createdAt", "createdAt");
        st.createIndex("by_flow_createdAt", ["flow", "createdAt"]);
        st.createIndex("by_barcode", "barcode");
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(storeName: string, mode: IDBTransactionMode, fn: (st: IDBObjectStore) => IDBRequest<T> | void) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const st = tx.objectStore(storeName);

    let req: IDBRequest<T> | undefined;
    try {
      const r = fn(st);
      if (r) req = r;
    } catch (e) {
      reject(e);
      return;
    }

    tx.oncomplete = () => {
      db.close();
      // si fn no devolvió request, resolvemos con undefined as T
      resolve((req?.result as T) ?? (undefined as unknown as T));
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function seedFlavorsIfEmpty() {
  // Siempre intentamos asegurar el catálogo (si ya existe, solo completa PLU/orden).
  const catalog: Array<{ sortOrder: number; name: string; plu: string; pricePerKg?: number }> = [
    { sortOrder: 1, name: "Dulce de leche", plu: "000001", pricePerKg: 9500 },
    { sortOrder: 2, name: "Dulce de leche cabsha", plu: "000002", pricePerKg: 9500 },
    { sortOrder: 3, name: "Dulce de leche granizado", plu: "000003", pricePerKg: 9500 },
    { sortOrder: 4, name: "Dulce tentación", plu: "000004", pricePerKg: 9500 },
    { sortOrder: 5, name: "Chocolate", plu: "000005", pricePerKg: 9500 },
    { sortOrder: 6, name: "Chocolate amargo", plu: "000006", pricePerKg: 9500 },
    { sortOrder: 7, name: "Chocolate blanco", plu: "000007", pricePerKg: 9500 },
    { sortOrder: 8, name: "Chocolate patagónico", plu: "000008", pricePerKg: 9500 },
    { sortOrder: 9, name: "Chocolate con pasas", plu: "000009", pricePerKg: 9500 },
    { sortOrder: 10, name: "Ferrero Rocher", plu: "000010", pricePerKg: 9500 },
    { sortOrder: 11, name: "Marroc", plu: "000011", pricePerKg: 9500 },
    { sortOrder: 12, name: "Pistacho", plu: "000012", pricePerKg: 9500 },
    { sortOrder: 13, name: "Chocolate suizo", plu: "000013", pricePerKg: 9500 },
    { sortOrder: 14, name: "Crema kínder", plu: "000014", pricePerKg: 9500 },
    { sortOrder: 15, name: "Bananita dolca", plu: "000015", pricePerKg: 9500 },
    { sortOrder: 16, name: "Banana Split", plu: "000016", pricePerKg: 9500 },
    { sortOrder: 17, name: "Cereza a la crema", plu: "000017", pricePerKg: 9500 },
    { sortOrder: 18, name: "Coco con dulce de leche", plu: "000018", pricePerKg: 9500 },
    { sortOrder: 19, name: "Americana", plu: "000019", pricePerKg: 9500 },
    { sortOrder: 20, name: "Crema de almendras", plu: "000020", pricePerKg: 9500 },
    { sortOrder: 21, name: "Crema del cielo", plu: "000021", pricePerKg: 9500 },
    { sortOrder: 22, name: "Crema oreo", plu: "000022", pricePerKg: 9500 },
    { sortOrder: 23, name: "Crema flan", plu: "000023", pricePerKg: 9500 },
    { sortOrder: 24, name: "Crema rusa", plu: "000024", pricePerKg: 9500 },
    { sortOrder: 25, name: "Frutilla a la crema", plu: "000025", pricePerKg: 9500 },
    { sortOrder: 26, name: "Granizado", plu: "000026", pricePerKg: 9500 },
    { sortOrder: 27, name: "Mantecol", plu: "000027", pricePerKg: 9500 },
    { sortOrder: 28, name: "Mascarpone", plu: "000028", pricePerKg: 9500 },
    { sortOrder: 29, name: "Menta granizada", plu: "000029", pricePerKg: 9500 },
    { sortOrder: 30, name: "Mousse de limon", plu: "000030", pricePerKg: 9500 },
    { sortOrder: 31, name: "Kinotos al whisky", plu: "000031", pricePerKg: 9500 },
    { sortOrder: 32, name: "Sambayón", plu: "000032", pricePerKg: 9500 },
    { sortOrder: 33, name: "Tiramisú", plu: "000033", pricePerKg: 9500 },
    { sortOrder: 34, name: "Tramontana", plu: "000034", pricePerKg: 9500 },
    { sortOrder: 35, name: "Vainilla", plu: "000035", pricePerKg: 9500 },
    { sortOrder: 36, name: "Ananá", plu: "000036", pricePerKg: 9500 },
    { sortOrder: 37, name: "Durazno", plu: "000037", pricePerKg: 9500 },
    { sortOrder: 38, name: "Frambuesa", plu: "000038", pricePerKg: 9500 },
    { sortOrder: 39, name: "Frutilla al agua", plu: "000039", pricePerKg: 9500 },
    { sortOrder: 40, name: "Frutos del bosque", plu: "000040", pricePerKg: 9500 },
    { sortOrder: 41, name: "Limón", plu: "000041", pricePerKg: 9500 },
    { sortOrder: 42, name: "Maracuyá", plu: "000042", pricePerKg: 9500 },
    { sortOrder: 43, name: "Banana", plu: "000043", pricePerKg: 9500 },
    { sortOrder: 44, name: "Chocotorta", plu: "000044", pricePerKg: 9500 },
    { sortOrder: 45, name: "Naranja", plu: "000045", pricePerKg: 9500 },
    { sortOrder: 46, name: "Mango", plu: "000046", pricePerKg: 9500 },
    { sortOrder: 47, name: "Pomelo rosado", plu: "000047", pricePerKg: 9500 },
    { sortOrder: 48, name: "Mandarina", plu: "000048", pricePerKg: 9500 },
    { sortOrder: 49, name: "Limón tropical", plu: "000049", pricePerKg: 9500 },
    { sortOrder: 50, name: "Melón", plu: "000050", pricePerKg: 9500 },
    { sortOrder: 51, name: "Uva", plu: "000051", pricePerKg: 9500 },
    { sortOrder: 52, name: "Frutilla a la reina", plu: "000052", pricePerKg: 9500 },
    { sortOrder: 53, name: "Crema moka", plu: "000053", pricePerKg: 9500 },
    { sortOrder: 54, name: "Crema tres leches", plu: "000054", pricePerKg: 9500 },
    { sortOrder: 55, name: "Crema bayleis", plu: "000055", pricePerKg: 9500 },
    { sortOrder: 56, name: "Naranja-mango", plu: "000056", pricePerKg: 9500 },
    { sortOrder: 57, name: "Crema de arándanos", plu: "000057", pricePerKg: 9500 },
    { sortOrder: 58, name: "Siciliano-pistacho", plu: "000058", pricePerKg: 9500 },
    { sortOrder: 59, name: "Frambuesa italiana", plu: "000059", pricePerKg: 9500 },
    { sortOrder: 60, name: "Chocolate dubai", plu: "000060", pricePerKg: 9500 },
    { sortOrder: 61, name: "Caipirinha maracuyá", plu: "000061", pricePerKg: 9500 },
    { sortOrder: 62, name: "Postre almendrado unidad", plu: "000062", pricePerKg: 9500 }
  ];

  for (const item of catalog) {
    await upsertFlavor(item.name, item.sortOrder, item.plu, item.pricePerKg ?? null);
  }
}

export async function listAllFlavors(): Promise<DBFlavor[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FLAVORS, "readonly");
    const st = tx.objectStore(STORE_FLAVORS);
    const req = st.getAll();

    req.onsuccess = () => {
      db.close();
      const items = ((req.result ?? []) as DBFlavor[]).map((x) => ({
        ...x,
        plu: (x as DBFlavor).plu ?? null,
        pricePerKg: (x as DBFlavor).pricePerKg ?? null
      }));
      
      // Remover duplicados por nombre (case-insensitive) y ordenar
      const seen = new Set<string>();
      const unique = items
        .filter(x => {
          const key = x.name.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      
      resolve(unique);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function listFlavors(): Promise<DBFlavor[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FLAVORS, "readonly");
    const st = tx.objectStore(STORE_FLAVORS);
    const req = st.getAll();

    req.onsuccess = () => {
      db.close();
      const items = ((req.result ?? []) as DBFlavor[]).map((x) => ({
        ...x,
        plu: (x as DBFlavor).plu ?? null,
        pricePerKg: (x as DBFlavor).pricePerKg ?? null
      }));
      
      // Filtrar solo activos, remover duplicados por nombre (case-insensitive), y ordenar
      const seen = new Set<string>();
      const unique = items
        .filter(x => {
          if (!x.isActive) return false;
          const key = x.name.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      
      resolve(unique);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function upsertFlavor(name: string, sortOrder = 999, plu: string | null = null, defaultPricePerKg: number | null = null) {
  const existing = await listAllFlavors();
  const found = existing.find(f => f.name.toLowerCase() === name.toLowerCase());

  const flavor: DBFlavor = found
    ? {
        ...found,
        name: found.name,  // Mantener el nombre original exacto
        sortOrder,
        isActive: true,
        plu: plu ?? found.plu ?? null,
        pricePerKg: found.pricePerKg ?? defaultPricePerKg
      }
    : {
        id: uid(),
        name,
        sortOrder,
        isActive: true,
        plu,
        pricePerKg: defaultPricePerKg
      };

  await withStore(STORE_FLAVORS, "readwrite", (st) => st.put(flavor));
}

export async function setFlavorPricePerKg(nameOrPlu: string, pricePerKg: number | null) {
  const s = String(nameOrPlu ?? "").trim();
  if (!s) return;

  const digits = s.replace(/\D+/g, "");
  const targetPluNum = digits ? Number(digits) : null;

  const existing = await listAllFlavors();
  const found = existing.find((f) => {
    if (f.name.toLowerCase() === s.toLowerCase()) return true;
    if (targetPluNum == null) return false;
    if (f.plu == null) return false;
    return Number(String(f.plu).replace(/\D+/g, "")) === targetPluNum;
  });
  if (!found) return;

  const updated: DBFlavor = {
    ...found,
    pricePerKg
  };

  await withStore(STORE_FLAVORS, "readwrite", (st) => st.put(updated));
}

export async function listMovements(flow: Flow, limit = 200): Promise<DBMove[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MOVES, "readonly");
    const st = tx.objectStore(STORE_MOVES);
    const idx = st.index("by_flow_createdAt");

    const req = idx.openCursor(IDBKeyRange.bound([flow, ""], [flow, "~~~~"]), "prev");
    const rows: DBMove[] = [];

    req.onsuccess = () => {
      const cur = req.result;
      if (!cur || rows.length >= limit) {
        db.close();
        resolve(rows);
        return;
      }
      rows.push(cur.value as DBMove);
      cur.continue();
    };

    req.onerror = () => reject(req.error);
  });
}

export async function insertMovement(input: Omit<DBMove, "id" | "createdAt">): Promise<DBMove> {
  // anti doble-scan: si mismo barcode en últimos 2 segundos, devolvemos el último
  const last = await findRecentByBarcode(input.barcode, 2);
  if (last) return last;

  const move: DBMove = {
    id: uid(),
    createdAt: new Date().toISOString(),
    ...input
  };

  await withStore(STORE_MOVES, "readwrite", (st) => st.put(move));
  return move;
}

export async function voidMovement(id: string) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_MOVES, "readwrite");
    const st = tx.objectStore(STORE_MOVES);
    const deleteReq = st.delete(id);

    deleteReq.onsuccess = () => {
      db.close();
      resolve();
    };

    deleteReq.onerror = () => {
      db.close();
      reject(deleteReq.error);
    };
  });
}

export async function deleteFlavorMovements(flavorName: string): Promise<number> {
  const allIn = await listMovements("in", 10000);
  const allOut = await listMovements("out", 10000);
  const toDelete = [...allIn, ...allOut].filter(m => m.flavorName === flavorName);
  
  for (const move of toDelete) {
    await voidMovement(move.id);
  }
  
  return toDelete.length;
}

async function findRecentByBarcode(barcode: string, seconds: number): Promise<DBMove | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MOVES, "readonly");
    const st = tx.objectStore(STORE_MOVES);
    const idx = st.index("by_barcode");
    const req = idx.openCursor(IDBKeyRange.only(barcode), "prev");

    req.onsuccess = () => {
      const cur = req.result;
      if (!cur) {
        db.close();
        resolve(null);
        return;
      }
      const row = cur.value as DBMove;
      const ageSec = Math.abs((Date.now() - new Date(row.createdAt).getTime()) / 1000);
      db.close();
      resolve(ageSec <= seconds ? row : null);
    };

    req.onerror = () => reject(req.error);
  });
}

export async function exportCsv(): Promise<string> {
  const out = await listMovements("out", 2000);
  const inn = await listMovements("in", 2000);
  const rows = [...out, ...inn].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const header = ["createdAt","flow","flavorName","weightKg","pricePerKg","total","barcode","status","raw"].join(",");
  const lines = rows.map(r => [
    r.createdAt,
    r.flow,
    csv(r.flavorName),
    r.weightKg ?? "",
    r.pricePerKg ?? "",
    r.total ?? "",
    csv(r.barcode),
    r.status,
    csv(r.raw)
  ].join(","));

  return [header, ...lines].join("\n");
}

export async function getStock(): Promise<StockItem[]> {
  const allIn = await listMovements("in", 10000);
  const allOut = await listMovements("out", 10000);
  const allFlavors = await listFlavors();

  const stockMap = new Map<string, { 
    totalIn: number; 
    totalOut: number; 
    countIn: number;
    countOut: number;
    lastUpdated: string | null; 
    pricesIn: number[];
    pricesOut: number[];
  }>();

  // Inicializar todos los sabores con 0
  for (const flavor of allFlavors) {
    stockMap.set(flavor.name, { 
      totalIn: 0, 
      totalOut: 0,
      countIn: 0,
      countOut: 0,
      lastUpdated: null,  // null hasta que haya movimientos
      pricesIn: [],
      pricesOut: []
    });
  }

  // Sumar entradas (cada movimiento = 1 balde)
  for (const m of allIn) {
    if (m.weightKg == null) continue;
    const current = stockMap.get(m.flavorName) || { 
      totalIn: 0, 
      totalOut: 0,
      countIn: 0,
      countOut: 0,
      lastUpdated: null, 
      pricesIn: [],
      pricesOut: []
    };
    current.totalIn += m.weightKg;
    current.countIn += 1;  // +1 balde por cada escaneo
    if (current.lastUpdated == null || m.createdAt > current.lastUpdated) current.lastUpdated = m.createdAt;
    if (m.pricePerKg != null) current.pricesIn.push(m.pricePerKg);
    stockMap.set(m.flavorName, current);
  }

  // Sumar salidas (cada movimiento = 1 balde)
  for (const m of allOut) {
    if (m.weightKg == null) continue;
    const current = stockMap.get(m.flavorName) || { 
      totalIn: 0, 
      totalOut: 0,
      countIn: 0,
      countOut: 0,
      lastUpdated: null, 
      pricesIn: [],
      pricesOut: []
    };
    current.totalOut += m.weightKg;
    current.countOut += 1;  // +1 balde por cada escaneo
    if (current.lastUpdated == null || m.createdAt > current.lastUpdated) current.lastUpdated = m.createdAt;
    if (m.pricePerKg != null) current.pricesOut.push(m.pricePerKg);
    stockMap.set(m.flavorName, current);
  }

  const result: StockItem[] = [];
  for (const [flavorName, data] of stockMap.entries()) {
    const avgPriceIn = data.pricesIn.length > 0 
      ? Math.round(data.pricesIn.reduce((a, b) => a + b, 0) / data.pricesIn.length)
      : null;
    
    const avgPriceOut = data.pricesOut.length > 0 
      ? Math.round(data.pricesOut.reduce((a, b) => a + b, 0) / data.pricesOut.length)
      : null;
    
    result.push({
      id: uid(),
      flavorName,
      totalKg: data.totalIn - data.totalOut,  // Stock disponible en kg
      totalIn: data.totalIn,
      totalOut: data.totalOut,
      countIn: data.countIn,   // Baldes entrada
      countOut: data.countOut, // Baldes salida
      lastUpdated: data.lastUpdated,
      averagePricePerKgIn: avgPriceIn,
      averagePricePerKgOut: avgPriceOut
    });
  }

  return result.sort((a, b) => b.totalKg - a.totalKg);
}

export async function exportPdfData(): Promise<Movement[]> {
  const out = await listMovements("out", 2000);
  const inn = await listMovements("in", 2000);
  return [...out, ...inn].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function csv(v: unknown) {
  const s = String(v ?? "");
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
