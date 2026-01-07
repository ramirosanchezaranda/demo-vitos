import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";

type Props = {
  state: "idle" | "armed" | "saved" | "error";
  flavorName: string | null;
  barcode: string | null;
  weightKg: number | null;
  pricePerKg: number | null;
  total: number | null;
  message: string | null;
  flow: "in" | "out";
  onPriceChange: (v: number | null) => void;
  onFlowChange: (f: "in" | "out") => void;
  onWeightChange: (v: number | null) => void;
  onManualAdd: () => void;
};

export default function TicketCard(p: Props) {
  const label =
    p.state === "idle" ? "IDLE" :
    p.state === "armed" ? "ARMED" :
    p.state === "saved" ? "SAVED" : "ERROR";

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg">Ticket</CardTitle>
        <Badge aria-live="polite">{label}</Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Tooltip content="Registrar entrada de mercadería" side="bottom">
            <Button
              variant={p.flow === "in" ? "success" : "secondary"}
              size="sm"
              onClick={() => p.onFlowChange("in")}
              className="flex-1"
            >
              Entrada
            </Button>
          </Tooltip>
          <Tooltip content="Registrar salida de mercadería" side="bottom">
            <Button
              variant={p.flow === "out" ? "danger" : "secondary"}
              size="sm"
              onClick={() => p.onFlowChange("out")}
              className="flex-1"
            >
              Salida
            </Button>
          </Tooltip>
        </div>

        <div className="rounded-lg border p-4 space-y-2">
          <Tooltip content="Gusto seleccionado para el movimiento" side="right">
            <div className="text-sm text-muted-foreground">Gusto</div>
          </Tooltip>
          <div className="text-2xl font-semibold">{p.flavorName ?? "—"}</div>

          <div className="grid grid-cols-3 gap-3 pt-3">
            <div>
              <Tooltip content="Peso en kilogramos del balde o contenedor" side="right">
                <div className="text-sm text-muted-foreground">Peso (kg)</div>
              </Tooltip>
              <Input
                inputMode="decimal"
                placeholder="Ej: 5.250"
                aria-label="Peso en kg"
                value={p.weightKg ?? ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d.]/g, "");
                  const n = parseFloat(val);
                  p.onWeightChange(Number.isFinite(n) && n > 0 ? n : null);
                }}
              />
            </div>

            <div>
              <Tooltip content="Precio por kilogramo del producto" side="right">
                <div className="text-sm text-muted-foreground">$/kg</div>
              </Tooltip>
              <Input
                inputMode="numeric"
                placeholder="Ej: 9500"
                aria-label="Precio por kilo"
                value={p.pricePerKg ?? ""}
                onChange={(e) => {
                  const n = Number(String(e.target.value).replace(/[^\d]/g, ""));
                  p.onPriceChange(Number.isFinite(n) && n > 0 ? n : null);
                }}
              />
            </div>

            <div>
              <Tooltip content="Monto total calculado automáticamente (Peso × Precio/kg)" side="right">
                <div className="text-sm text-muted-foreground">Total</div>
              </Tooltip>
              <div className="text-xl font-medium">{p.total != null ? `$${p.total}` : "—"}</div>
            </div>
          </div>

          <div className="pt-3">
            <Tooltip content="Código de barras EAN-13 generado automáticamente según PLU y peso" side="bottom">
              <div className="text-sm text-muted-foreground">Código (auto-generado)</div>
            </Tooltip>
            <div className="font-mono text-sm break-all bg-muted p-2 rounded">{p.barcode ?? "—"}</div>
          </div>

          {p.flavorName && p.weightKg && p.pricePerKg && (
            <div className="pt-3">
              <Tooltip content="Agregar manualmente este movimiento sin escanear código de barras" side="bottom">
                <Button
                  variant="success"
                  size="lg"
                  onClick={p.onManualAdd}
                  className="w-full"
                >
                  Agregar Manualmente
                </Button>
              </Tooltip>
            </div>
          )}
        </div>

        {p.message ? (
          <div className="text-sm text-muted-foreground" aria-live="polite">
            {p.message}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
