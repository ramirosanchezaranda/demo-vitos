import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tooltip } from "./ui/tooltip";
import type { Flavor } from "../lib/types";

type Props = {
  flavors: Flavor[];
  selected: string | null;
  onSelect: (name: string) => void;
};

export default function FlavorPicker({ flavors, selected, onSelect }: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return flavors;
    return flavors.filter(f => f.name.toLowerCase().includes(s));
  }, [q, flavors]);

  return (
    <div className="space-y-3">
      <Input
        placeholder="Buscar gusto… ( / )"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Buscar gusto"
      />

      {/* Desktop: botones grandes (derecha) / Mobile: quedan abajo igual con scroll */}
      <div className="flex flex-wrap gap-3">
        {filtered.map(f => (
          <Tooltip key={f.id} content={`PLU: ${f.plu || "N/A"} | Precio: $${f.pricePerKg || "N/A"}`} side="top">
            <Button
              type="button"
              variant={selected === f.name ? "success" : "secondary"}
              size="md"
              className="rounded-full min-w-[140px]"
              onClick={() => onSelect(f.name)}
            >
              {selected === f.name ? "✓ " : ""}{f.name}
            </Button>
          </Tooltip>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        Tip: elegí gusto y escaneá. No dejes el cursor dentro del input de precio cuando escanees.
      </div>
    </div>
  );
}
