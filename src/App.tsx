import { useEffect, useMemo, useRef, useState } from "react";
import TicketCard from "./components/TicketCard";
import FlavorPicker from "./components/FlavorPicker";
import MovementsTable from "./components/MovementsTable";
import StockTable from "./components/StockTable";
import MonthlyControl from "./components/MonthlyControl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { toast } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { Tooltip } from "./components/ui/tooltip";
import ThemeToggle from "./components/ThemeToggle";

import type { Flavor, Movement, Flow, StockItem } from "./lib/types";
import { deleteFlavorMovements, exportPdfData, getStock, insertMovement, listFlavors, listMovements, seedFlavorsIfEmpty, setFlavorPricePerKg, voidMovement } from "./lib/db";
import { parseScan } from "./lib/scan";
import jsPDF from "jspdf";

export default function App() {
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [flow, setFlow] = useState<"in" | "out" | "stock" | "monthly">("stock");
  const [ticketFlow, setTicketFlow] = useState<"in" | "out">("out");
  const [rows, setRows] = useState<Movement[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [allMovements, setAllMovements] = useState<Movement[]>([]);

  const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null);
  const [uiState, setUiState] = useState<"idle" | "armed" | "saved" | "error">("idle");

  const [ticketBarcode, setTicketBarcode] = useState<string | null>(null);
  const [ticketWeightKg, setTicketWeightKg] = useState<number | null>(null);
  const [ticketPricePerKg, setTicketPricePerKg] = useState<number | null>(null);
  const [ticketTotal, setTicketTotal] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>("Seleccioná un gusto para empezar.");
  const [pendingScan, setPendingScan] = useState<{
    raw: string;
    barcode: string;
    weightKg: number | null;
  } | null>(null);

  // Calcular total automáticamente cuando cambia peso o precio
  useEffect(() => {
    if (ticketWeightKg != null && ticketPricePerKg != null) {
      setTicketTotal(Math.round(ticketWeightKg * ticketPricePerKg));
    } else {
      setTicketTotal(null);
    }
  }, [ticketWeightKg, ticketPricePerKg]);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportClientName, setExportClientName] = useState("");

  const scanBufferRef = useRef<string>("");
  const lastKeyTsRef = useRef<number>(0);
  const scanLikelyRef = useRef<boolean>(false);

  const isMobile = useMemo(() => window.innerWidth < 900, []);

  // Generar código de barras EAN-13 basado en PLU y peso
  function generateBarcode(plu: string | null, weightKg: number | null): string | null {
    if (!plu || weightKg == null || weightKg <= 0) return null;
    
    // Formato: 2 + PLU(6) + PESO_GRAMOS(5) + dígito_verificador
    const pluPadded = plu.padStart(6, '0').slice(0, 6);
    const gramos = Math.round(weightKg * 1000);
    const pesoStr = String(gramos).padStart(5, '0').slice(0, 5);
    const first12 = '2' + pluPadded + pesoStr;
    
    // Calcular dígito verificador EAN-13
    let sumOdd = 0;
    let sumEven = 0;
    for (let i = 0; i < 12; i++) {
      const n = Number(first12[i]);
      if (i % 2 === 0) sumOdd += n;
      else sumEven += n;
    }
    const total = sumOdd + sumEven * 3;
    const checkDigit = (10 - (total % 10)) % 10;
    
    return first12 + checkDigit;
  }

  // Actualizar código de barras cuando cambia el gusto o el peso
  useEffect(() => {
    if (selectedFlavor && ticketWeightKg != null) {
      const flavor = flavors.find(f => f.name === selectedFlavor);
      if (flavor?.plu) {
        const barcode = generateBarcode(flavor.plu, ticketWeightKg);
        setTicketBarcode(barcode);
      }
    } else {
      setTicketBarcode(null);
    }
  }, [selectedFlavor, ticketWeightKg, flavors]);

  // Calcular totales generales de stock
  const stockTotals = useMemo(() => {
    const totalKg = stockItems.reduce((sum, item) => sum + item.totalKg, 0);
    // Contar baldes totales: sum de (entrada - salida) para cada sabor
    const totalBaldes = stockItems.reduce((sum, item) => sum + (item.countIn - item.countOut), 0);
    
    // Precio total: suma de (stock disponible * precio promedio de entrada) para cada sabor con stock positivo
    const totalPriceIn = stockItems.reduce((sum, item) => {
      if (item.totalKg > 0 && item.averagePricePerKgIn != null) {
        return sum + (item.totalKg * item.averagePricePerKgIn);
      }
      return sum;
    }, 0);
    
    // Precio total de salida: suma de (stock vendido * precio promedio de salida)
    const totalPriceOut = stockItems.reduce((sum, item) => {
      if (item.totalOut > 0 && item.averagePricePerKgOut != null) {
        return sum + (item.totalOut * item.averagePricePerKgOut);
      }
      return sum;
    }, 0);
    
    return {
      totalBaldes,
      totalKg,
      totalPriceIn: Math.round(totalPriceIn),
      totalPriceOut: Math.round(totalPriceOut)
    };
  }, [stockItems]);

  async function refresh() {
    if (flow === "stock") {
      const stock = await getStock();
      setStockItems(stock);
    } else if (flow === "monthly") {
      // Cargar todos los movimientos para el control mensual
      const allIn = await listMovements("in", 10000);
      const allOut = await listMovements("out", 10000);
      setAllMovements([...allIn, ...allOut]);
    } else {
      const r = await listMovements(flow, 250);
      setRows(r);
    }
    const f = await listFlavors();
    setFlavors(f);
  }

  useEffect(() => {
    (async () => {
      await seedFlavorsIfEmpty();
      await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refresh();
    // Actualizar ticketFlow cuando cambia el flow principal (excepto stock)
    if (flow !== "stock") setTicketFlow(flow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow]);

  function selectFlavor(name: string) {
    setSelectedFlavor(name);
    const found = flavors.find(f => f.name === name);
    setTicketPricePerKg(found?.pricePerKg ?? null);
    // Limpiar peso y barcode al seleccionar nuevo gusto
    setTicketWeightKg(null);
    setTicketBarcode(null);
    setUiState("armed");
    setMessage("Esperando escaneo del ticket o ingreso manual…");
  }

  async function setPriceAndPersist(v: number | null) {
    setTicketPricePerKg(v);
    if (!selectedFlavor) return;
    setFlavors(prev => prev.map(f => f.name === selectedFlavor ? { ...f, pricePerKg: v } : f));
    await setFlavorPricePerKg(selectedFlavor, v);
  }

  async function addManually() {
    if (!selectedFlavor) {
      toast("Error", { description: "Seleccioná un gusto primero." });
      return;
    }
    if (ticketWeightKg == null || ticketWeightKg <= 0) {
      toast("Error", { description: "Ingresá un peso válido." });
      return;
    }
    if (ticketPricePerKg == null || ticketPricePerKg <= 0) {
      toast("Error", { description: "Ingresá un precio válido." });
      return;
    }

    const barcode = ticketBarcode || `MANUAL-${Date.now()}`;
    const total = Math.round(ticketWeightKg * ticketPricePerKg);

    const saved = await insertMovement({
      flow: ticketFlow,
      flavorName: selectedFlavor,
      barcode,
      raw: barcode,
      weightKg: ticketWeightKg,
      pricePerKg: ticketPricePerKg,
      total,
      status: "ok"
    });

    setUiState("saved");
    setMessage(`✓ ${ticketFlow === "in" ? "Entrada" : "Salida"} guardada: ${saved.weightKg?.toFixed(3)} kg de ${selectedFlavor}`);
    setTicketBarcode(barcode);
    await refresh();
    toast("Guardado", { description: `${ticketFlow === "in" ? "Entrada" : "Salida"} de ${selectedFlavor} registrada.` });

    // Limpiar para siguiente entrada
    setTimeout(() => {
      setSelectedFlavor(null);
      setTicketPricePerKg(null);
      setTicketWeightKg(null);
      setTicketBarcode(null);
      setUiState("idle");
      setMessage("Seleccioná un gusto para empezar.");
    }, 1500);
  }

  function resetTicketView() {
    setTicketBarcode(null);
    setTicketWeightKg(null);
    setTicketTotal(null);
  }

  function cancelOp() {
    scanBufferRef.current = "";
    setSelectedFlavor(null);
    setTicketPricePerKg(null);
    setUiState("idle");
    resetTicketView();
    setPendingScan(null);
    setMessage("Seleccioná un gusto para empezar.");
    toast("Cancelado", { description: "Operación cancelada." });
  }

  async function confirmTicket() {
    if (!pendingScan) {
      toast("Nada para confirmar", { description: "Escaneá un ticket primero." });
      return;
    }
    if (!selectedFlavor) {
      toast("Falta gusto", { description: "Seleccioná un gusto para confirmar." });
      return;
    }

    const total =
      pendingScan.weightKg != null && ticketPricePerKg != null
        ? Math.round(pendingScan.weightKg * ticketPricePerKg)
        : null;

    const saved = await insertMovement({
      flow: ticketFlow,
      flavorName: selectedFlavor,
      barcode: pendingScan.barcode,
      raw: pendingScan.raw,
      weightKg: pendingScan.weightKg,
      pricePerKg: ticketPricePerKg,
      total,
      status: "ok"
    });

    setTicketBarcode(saved.barcode);
    setTicketWeightKg(saved.weightKg);
    setTicketTotal(saved.total);

    setPendingScan(null);
    setUiState("saved");
    setMessage("Guardado. Podés escanear el próximo ticket.");
    toast("OK", { description: `Confirmado: ${saved.flavorName}` });

    setUiState("armed");
    await refresh();
  }

  // Captura scanner HID (teclado)
  useEffect(() => {
    function detectAndBlurForScanner(e: KeyboardEvent) {
      const now = performance.now();
      const delta = now - (lastKeyTsRef.current || 0);
      lastKeyTsRef.current = now;

      if (e.key.length === 1 && delta > 0 && delta < 35) {
        scanLikelyRef.current = true;
      }

      const el = document.activeElement as HTMLElement | null;
      const tag = (el?.tagName || "").toLowerCase();
      if (scanLikelyRef.current && (tag === "input" || tag === "textarea")) {
        (el as HTMLInputElement).blur();
      }

      if (delta > 120) scanLikelyRef.current = false;
    }

    const onKeyDown = async (e: KeyboardEvent) => {
      detectAndBlurForScanner(e);

      const el = document.activeElement;
      const tag = (el?.tagName || "").toLowerCase();
      const isTypingInInput = tag === "input" || tag === "textarea";

      if (isTypingInInput && !scanLikelyRef.current) return;

      if (e.key === "Escape") {
        cancelOp();
        return;
      }

      if (e.key === "Enter") {
        const raw = scanBufferRef.current.trim();
        scanBufferRef.current = "";
        if (!raw) return;

        // Detectar si es un PLU directo (5 dígitos o menos, sin otros caracteres)
        const digitsOnly = raw.replace(/\D+/g, "");
        if (digitsOnly.length > 0 && digitsOnly.length <= 5 && raw.length <= 8) {
          // Es un PLU directo, auto-seleccionar gusto
          const targetPluNum = Number(digitsOnly);
          const match = flavors.find(f => f.plu != null && Number(f.plu) === targetPluNum);
          if (match) {
            setSelectedFlavor(match.name);
            setTicketPricePerKg(match.pricePerKg ?? null);
            setUiState("armed");
            setMessage(`Gusto seleccionado: ${match.name}. Escaneá el ticket.`);
            toast("PLU leído", { description: `${match.name} seleccionado` });
          } else {
            toast("PLU no encontrado", { description: `No hay gusto con PLU ${digitsOnly}` });
          }
          return;
        }

        // Es un barcode completo, parsear normalmente
        const parsed = parseScan(raw);
        console.log("Parsed scan:", parsed);

        let autoFlavorName: string | null = null;
        if (parsed.plu) {
          console.log("PLU detectado:", parsed.plu);
          // Comparar PLU como strings para preservar ceros a la izquierda
          const match = flavors.find(f => f.plu != null && f.plu === parsed.plu);
          console.log("Match encontrado:", match);
          if (match) {
            autoFlavorName = match.name;
            setSelectedFlavor(match.name);
            setTicketPricePerKg(match.pricePerKg ?? null);
          } else {
            console.log("No se encontró gusto con PLU:", parsed.plu);
          }
        } else {
          console.log("No se detectó PLU en el código de barras");
        }

        const effectiveFlavor = autoFlavorName ?? selectedFlavor;
        if (!effectiveFlavor) {
          setUiState("error");
          setMessage("Ticket leído. Seleccioná un gusto.");
          toast("Falta gusto", { description: "Elegí un gusto para el ticket." });
          // Mostrar preview sin guardar
          setTicketBarcode(parsed.barcode);
          setTicketWeightKg(parsed.weightKg);
          const totalPreview = parsed.weightKg != null && ticketPricePerKg != null
            ? Math.round(parsed.weightKg * ticketPricePerKg)
            : null;
          setTicketTotal(totalPreview);
          setPendingScan({ raw: parsed.raw, barcode: parsed.barcode, weightKg: parsed.weightKg });
        } else {
          // Auto-confirmar ticket con sabor detectado
          const currentPricePerKg = flavors.find(f => f.name === effectiveFlavor)?.pricePerKg ?? ticketPricePerKg;
          const total = parsed.weightKg != null && currentPricePerKg != null
            ? Math.round(parsed.weightKg * currentPricePerKg)
            : null;

          const saved = await insertMovement({
            flow: ticketFlow,
            flavorName: effectiveFlavor,
            barcode: parsed.barcode,
            raw: parsed.raw,
            weightKg: parsed.weightKg,
            pricePerKg: currentPricePerKg,
            total,
            status: "ok"
          });

          setTicketBarcode(saved.barcode);
          setTicketWeightKg(saved.weightKg);
          setTicketTotal(saved.total);
          setPendingScan(null);
          setUiState("saved");
          setMessage("Guardado automáticamente. Escaneá el próximo ticket.");
          toast("OK", { description: `${saved.flavorName} - ${saved.weightKg?.toFixed(3)} kg` });
          
          await refresh();
        }
        return;
      }

      if (e.key.length === 1) {
        scanBufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFlavor, flow, ticketPricePerKg, flavors]);

  async function onVoid(id: string) {
    await voidMovement(id);
    await refresh();
    toast("Anulado", { description: "Registro marcado como void." });
  }

  async function onDeleteStock(flavorName: string) {
    const count = await deleteFlavorMovements(flavorName);
    await refresh();
    toast("Stock reseteado", { description: `${flavorName} vuelto a 0 (${count} movimientos eliminados).` });
  }

  async function onExport() {
    setShowExportModal(true);
  }

  async function confirmExport() {
    if (!exportClientName.trim()) {
      toast("Error", { description: "Ingresá el nombre del cliente/proveedor" });
      return;
    }

    const allRows = await exportPdfData();
    // Filtrar solo el flujo actual (no mezclar entradas y salidas)
    const rows = allRows.filter(r => r.flow === flow);
    
    const doc = new jsPDF();
    
    const flowName = flow === "in" ? "Entradas" : "Salidas";
    doc.setFontSize(16);
    doc.text(`Helado Scan - ${flowName}`, 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-AR")}`, 14, 22);
    doc.text(`${flow === "in" ? "Proveedor" : "Cliente"}: ${exportClientName}`, 14, 28);
    
    let y = 36;
    const lineHeight = 6;
    const pageHeight = doc.internal.pageSize.height;
    
    // Header
    doc.setFontSize(9);
    doc.text("Fecha/Hora", 14, y);
    doc.text("Gusto", 50, y);
    doc.text("Kg", 115, y);
    doc.text("$/kg", 130, y);
    doc.text("Total", 150, y);
    doc.text("Estado", 170, y);
    
    y += lineHeight;
    doc.setFontSize(8);
    
    let totalKg = 0;
    let totalPrice = 0;
    
    for (const r of rows) {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 15;
      }
      
      const date = new Date(r.createdAt);
      const dateStr = date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
      const timeStr = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      
      doc.text(`${dateStr} ${timeStr}`, 14, y);
      doc.text(r.flavorName.substring(0, 25), 50, y);
      doc.text(r.weightKg != null ? r.weightKg.toFixed(3) : "—", 115, y);
      doc.text(r.pricePerKg != null ? `$${r.pricePerKg}` : "—", 130, y);
      doc.text(r.total != null ? `$${r.total}` : "—", 150, y);
      doc.text(r.status, 170, y);
      
      if (r.weightKg != null) totalKg += r.weightKg;
      if (r.total != null) totalPrice += r.total;
      
      y += lineHeight;
    }
    
    // Agregar totales
    y += 4;
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("TOTALES:", 14, y);
    doc.text(`${totalKg.toFixed(3)} kg`, 115, y);
    
    // Mostrar baldes solo para salidas (1 ticket = 1 balde)
    if (flow === "out") {
      const totalBaldes = rows.length;  // Contar tickets escaneados
      doc.text(`(${totalBaldes} baldes)`, 115, y + 5);
    }
    
    doc.text(`$${totalPrice}`, 150, y);
    
    const filename = `${flowName.toLowerCase()}_${exportClientName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    setShowExportModal(false);
    setExportClientName("");
    toast("PDF exportado", { description: `${flowName} de ${exportClientName}` });
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Helado Scan</div>
          <div className="text-xs text-muted-foreground">Elegí gusto → escaneá → se guarda</div>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start">
        {/* Izq: Ticket + tabla */}
        <div className="min-h-0 flex flex-col gap-4">
          <div className="min-h-[320px]">
            <TicketCard
              state={uiState}
              flavorName={selectedFlavor}
              barcode={ticketBarcode}
              weightKg={ticketWeightKg}
              pricePerKg={ticketPricePerKg}
              total={ticketTotal}
              message={message}
              flow={ticketFlow}
              onPriceChange={(v) => void setPriceAndPersist(v)}
              onFlowChange={setTicketFlow}
              onWeightChange={setTicketWeightKg}
              onManualAdd={addManually}
            />
            {pendingScan && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button variant="danger" size="lg" onClick={cancelOp}>
                  Cancelar (Esc)
                </Button>

                <Button variant="success" size="lg" onClick={confirmTicket} disabled={!selectedFlavor}>
                  Confirmar Ticket
                </Button>

                <div className="ml-auto text-sm font-medium text-muted-foreground">
                  Ticket listo para confirmar
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-3 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <Tabs value={flow} onValueChange={(v) => setFlow(v as "in" | "out" | "stock" | "monthly")}>
                <TabsList>
                  <Tooltip content="Mostrar historial de entradas de mercadería" side="bottom">
                    <TabsTrigger value="in">Entrada</TabsTrigger>
                  </Tooltip>
                  <Tooltip content="Mostrar historial de salidas de mercadería" side="bottom">
                    <TabsTrigger value="out">Salida</TabsTrigger>
                  </Tooltip>
                  <Tooltip content="Ver stock disponible por gusto" side="bottom">
                    <TabsTrigger value="stock">Stock</TabsTrigger>
                  </Tooltip>
                  <Tooltip content="Controles y análisis mensual de movimientos" side="bottom">
                    <TabsTrigger value="monthly">Control Mensual</TabsTrigger>
                  </Tooltip>
                </TabsList>
              </Tabs>

              <div className="ml-auto flex items-center gap-2">
                <Tooltip content="Exportar datos a PDF con nombre de cliente" side="bottom">
                  <Button variant="warning" size="md" onClick={onExport}>
                    📄 Exportar PDF
                  </Button>
                </Tooltip>
                <div className="hidden lg:block text-xs text-muted-foreground">
                  Atajos: Esc cancelar · / buscar gusto
                </div>
              </div>
            </div>

            <div className="mt-3">
              {flow === "stock" ? (
                <>
                  {/* Tabla de resumen general */}
                  <div className="mb-4 rounded-lg border border-border overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-3 text-foreground">📊 Stock General</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Tooltip content="Total de baldes disponibles (Entrada - Salida)" side="top">
                          <div className="bg-card rounded-lg border border-border p-4">
                            <div className="text-sm text-muted-foreground mb-1">Total Baldes Disponibles</div>
                            <div className="text-3xl font-bold text-foreground">{stockTotals.totalBaldes}</div>
                          </div>
                        </Tooltip>
                        <Tooltip content="Peso total en kilogramos de stock disponible" side="top">
                          <div className="bg-card rounded-lg border border-border p-4">
                            <div className="text-sm text-muted-foreground mb-1">Peso Total Disponible</div>
                            <div className="text-3xl font-bold text-foreground">{stockTotals.totalKg.toFixed(1)} kg</div>
                          </div>
                        </Tooltip>
                        <Tooltip content="Valor monetario total basado en precio de entrada promedio" side="top">
                          <div className="bg-card rounded-lg border border-border p-4">
                            <div className="text-sm text-muted-foreground mb-1">Valor Total Stock (Entrada)</div>
                            <div className="text-3xl font-bold text-green-600">${stockTotals.totalPriceIn.toLocaleString()}</div>
                          </div>
                        </Tooltip>
                        <Tooltip content="Valor monetario total de las salidas registradas" side="top">
                          <div className="bg-card rounded-lg border border-border p-4">
                            <div className="text-sm text-muted-foreground mb-1">Valor Total Salidas</div>
                            <div className="text-3xl font-bold text-red-600">${stockTotals.totalPriceOut.toLocaleString()}</div>
                          </div>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tabla detallada por sabor */}
                  <StockTable items={stockItems} onDelete={onDeleteStock} />
                </>
              ) : flow === "monthly" ? (
                <MonthlyControl movements={allMovements} />
              ) : (
                <MovementsTable rows={rows} onVoid={onVoid} />
              )}
            </div>
          </div>

          {isMobile ? (
            <div className="text-xs text-muted-foreground">
              Mobile: los gustos quedan abajo por el layout. Si querés una barra fija tipo “dock”, la hacemos.
            </div>
          ) : null}
        </div>

        {/* Der: Gustos (desktop derecha) */}
        <div className="lg:sticky lg:top-4">
          <div className="rounded-xl border border-border bg-card p-3 h-[calc(100vh-2rem)] overflow-hidden">
            <div className="font-medium mb-2">Gustos</div>

            {/* scroll SOLO dentro del sidebar */}
            <div className="h-[calc(100%-2.5rem)] overflow-auto pr-1">
              <FlavorPicker flavors={flavors} selected={selectedFlavor} onSelect={selectFlavor} />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de exportación */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowExportModal(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Exportar PDF</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Ingresá el nombre del cliente (para salidas) o proveedor (para entradas)
            </p>
            <input
              type="text"
              className="w-full px-3 py-2 border border-border rounded-md mb-4 bg-background"
              placeholder="Ej: Juan Pérez"
              value={exportClientName}
              onChange={(e) => setExportClientName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmExport()}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowExportModal(false)}>
                Cancelar
              </Button>
              <Button variant="success" onClick={confirmExport}>
                Exportar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer con versión */}
      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border py-2 px-4">
        <div className="text-center text-xs text-muted-foreground">
          Helado Scan v1.0.0
        </div>
      </footer>
    </div>
  );
}
