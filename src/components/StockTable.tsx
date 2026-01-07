import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";
import type { StockItem } from "../lib/types";

type Props = {
  items: StockItem[];
  onDelete?: (flavorName: string) => void;
};

export default function StockTable({ items, onDelete }: Props) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="max-h-[calc(100vh-520px)] lg:max-h-[calc(100vh-300px)] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className="sticky top-0 bg-card">Gusto</TableHead>
              <TableHead className="sticky top-0 bg-card">Entrada</TableHead>
              <TableHead className="sticky top-0 bg-card">Salida</TableHead>
              <TableHead className="sticky top-0 bg-card">Stock Disponible</TableHead>
              <TableHead className="sticky top-0 bg-card">Baldes</TableHead>
              <TableHead className="sticky top-0 bg-card">Total $ Entrada</TableHead>
              <TableHead className="sticky top-0 bg-card">Total $ Salida</TableHead>
              <TableHead className="sticky top-0 bg-card">Última Actualización</TableHead>
              <TableHead className="sticky top-0 bg-card">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map(item => {
              // Usar contadores de baldes directamente (1 escaneo = 1 balde)
              const baldesIn = item.countIn;
              const baldesOut = item.countOut;
              
              // Baldes disponibles = entrada - salida
              const baldesDisponibles = baldesIn - baldesOut;
              
              const baldesColor = 
                baldesDisponibles >= 5 ? "bg-green-600 text-white" :
                baldesDisponibles >= 2 ? "bg-yellow-500 text-black" :
                "bg-red-600 text-white";
              
              const dateStr = item.lastUpdated 
                ? new Date(item.lastUpdated).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })
                : null;
              const timeStr = item.lastUpdated 
                ? new Date(item.lastUpdated).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
                : null;

              // Calcular totales
              const totalPriceIn = item.totalIn > 0 && item.averagePricePerKgIn != null 
                ? Math.round(item.totalIn * item.averagePricePerKgIn) 
                : null;
              
              const totalPriceOut = item.totalOut > 0 && item.averagePricePerKgOut != null 
                ? Math.round(item.totalOut * item.averagePricePerKgOut) 
                : null;

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.flavorName}</TableCell>
                  <Tooltip content={`Entradas registradas: ${baldesIn} balde${baldesIn !== 1 ? 's' : ''}`} side="top">
                    <TableCell className="font-semibold text-green-600">
                      {baldesIn} {baldesIn === 1 ? "balde" : "baldes"} <span className="text-muted-foreground text-sm">({item.totalIn.toFixed(3)} kg)</span>
                    </TableCell>
                  </Tooltip>
                  <Tooltip content={`Salidas registradas: ${baldesOut} balde${baldesOut !== 1 ? 's' : ''}`} side="top">
                    <TableCell className="font-semibold text-red-600">
                      {baldesOut} {baldesOut === 1 ? "balde" : "baldes"} <span className="text-muted-foreground text-sm">({item.totalOut.toFixed(3)} kg)</span>
                    </TableCell>
                  </Tooltip>
                  <Tooltip content={`Stock disponible: ${item.totalKg.toFixed(3)} kg`} side="top">
                    <TableCell className={item.totalKg < 0 ? "text-red-600 font-bold" : "font-bold text-lg"}>
                      {item.totalKg.toFixed(3)} kg
                    </TableCell>
                  </Tooltip>
                  <Tooltip content={`Baldes disponibles: ${baldesDisponibles} (Entrada - Salida)`} side="top">
                    <TableCell>
                      <span className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${baldesColor}`}>
                        {baldesDisponibles}
                      </span>
                    </TableCell>
                  </Tooltip>
                  <TableCell className="text-green-600 font-semibold">{totalPriceIn != null ? `$${totalPriceIn.toLocaleString()}` : "—"}</TableCell>
                  <TableCell className="text-red-600 font-semibold">{totalPriceOut != null ? `$${totalPriceOut.toLocaleString()}` : "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{dateStr && timeStr ? `${dateStr} ${timeStr}` : "—"}</TableCell>
                  <TableCell>
                    {onDelete && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => onDelete(item.flavorName)}
                        className="h-8 px-2 text-xs"
                      >
                        Eliminar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-10">
                  Sin stock todavía
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
