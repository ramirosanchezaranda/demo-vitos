import type { Flavor, Movement, Flow, StockItem } from "./types";
import { uid } from "./utils";
import * as idb from "./idb";

// Re-export funciones de idb.ts directamente
export const seedFlavorsIfEmpty = idb.seedFlavorsIfEmpty;
export const listFlavors = idb.listFlavors;
export const setFlavorPricePerKg = idb.setFlavorPricePerKg;
export const listMovements = idb.listMovements;
export const insertMovement = idb.insertMovement;
export const voidMovement = idb.voidMovement;
export const deleteFlavorMovements = idb.deleteFlavorMovements;
export const getStock = idb.getStock;
export const exportPdfData = idb.exportPdfData;
export const exportCsv = idb.exportCsv;
