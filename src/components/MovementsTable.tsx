import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";
import type { Movement } from "../lib/types";
import { fmtTime } from "../lib/utils";

type Props = {
  rows: Movement[];
  onVoid: (id: string) => void;
};

export default function MovementsTable({ rows, onVoid }: Props) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="max-h-[calc(100vh-520px)] lg:max-h-[calc(100vh-300px)] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className="sticky top-0 bg-card">Hora</TableHead>
              <TableHead className="sticky top-0 bg-card">Gusto</TableHead>
              <TableHead className="sticky top-0 bg-card">Kg</TableHead>
              <TableHead className="sticky top-0 bg-card">$/kg</TableHead>
              <TableHead className="sticky top-0 bg-card">Total</TableHead>
              <TableHead className="sticky top-0 bg-card">Código</TableHead>
              <TableHead className="sticky top-0 bg-card">Estado</TableHead>
              <TableHead className="sticky top-0 bg-card text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <Tooltip content={new Date(r.createdAt).toLocaleString("es-AR")} side="top">
                  <TableCell className="font-mono text-xs">{fmtTime(r.createdAt)}</TableCell>
                </Tooltip>
                <TableCell>{r.flavorName}</TableCell>
                <Tooltip content={`Peso: ${r.weightKg?.toFixed(3) || 'N/A'} kg`} side="top">
                  <TableCell>{r.weightKg != null ? r.weightKg.toFixed(3) : "—"}</TableCell>
                </Tooltip>
                <Tooltip content={`Precio por kg: $${r.pricePerKg || 'N/A'}`} side="top">
                  <TableCell>{r.pricePerKg != null ? `$${r.pricePerKg}` : "—"}</TableCell>
                </Tooltip>
                <Tooltip content={`Total: $${r.total || 'N/A'}`} side="top">
                  <TableCell>{r.total != null ? `$${r.total}` : "—"}</TableCell>
                </Tooltip>
                <Tooltip content={`Código: ${r.barcode}`} side="top">
                  <TableCell className="font-mono text-xs break-all">{r.barcode}</TableCell>
                </Tooltip>
                <Tooltip content={r.status === "ok" ? "Registro válido" : `Estado: ${r.status}`} side="top">
                  <TableCell>{r.status}</TableCell>
                </Tooltip>
                <TableCell className="text-right">
                  <Tooltip content={r.status === "ok" ? "Eliminar este registro" : "Solo se pueden eliminar registros válidos"} side="left">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={r.status !== "ok"}
                      onClick={() => onVoid(r.id)}
                    >
                      🗑️ Eliminar
                    </Button>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-10">
                  Sin registros todavía
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
