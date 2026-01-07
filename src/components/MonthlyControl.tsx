import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";
import type { Movement } from "../lib/types";

type Props = {
  movements: Movement[];
};

type MonthlyStats = {
  totalBaldesIn: number;
  totalBaldesOut: number;
  totalKgIn: number;
  totalKgOut: number;
  totalRevenue: number;
  topFlavors: { name: string; kg: number; baldes: number; revenue: number }[];
  dailyData: { day: number; in: number; out: number }[];
};

export default function MonthlyControl({ movements }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<MonthlyStats | null>(null);

  useEffect(() => {
    calculateStats();
  }, [selectedMonth, selectedYear, movements]);

  function calculateStats() {
    const monthMovements = movements.filter(m => {
      const date = new Date(m.createdAt);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });

    const inMovements = monthMovements.filter(m => m.flow === "in");
    const outMovements = monthMovements.filter(m => m.flow === "out");

    const totalKgIn = inMovements.reduce((sum, m) => sum + (m.weightKg || 0), 0);
    const totalKgOut = outMovements.reduce((sum, m) => sum + (m.weightKg || 0), 0);
    // Contar movimientos = baldes (1 escaneo = 1 balde)
    const totalBaldesIn = inMovements.length;
    const totalBaldesOut = outMovements.length;

    const totalRevenue = outMovements.reduce((sum, m) => sum + (m.total || 0), 0);

    // Top sabores vendidos
    const flavorMap = new Map<string, { count: number; kg: number; revenue: number }>();
    outMovements.forEach(m => {
      const current = flavorMap.get(m.flavorName) || { count: 0, kg: 0, revenue: 0 };
      current.count += 1;  // Contar baldes
      current.kg += m.weightKg || 0;
      current.revenue += m.total || 0;
      flavorMap.set(m.flavorName, current);
    });

    const topFlavors = Array.from(flavorMap.entries())
      .map(([name, data]) => ({
        name,
        kg: data.kg,
        baldes: data.count,  // Usar contador directo
        revenue: data.revenue
      }))
      .sort((a, b) => b.baldes - a.baldes)  // Ordenar por baldes
      .slice(0, 5);

    // Datos diarios
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const dailyData: { day: number; in: number; out: number }[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayMovements = monthMovements.filter(m => {
        const date = new Date(m.createdAt);
        return date.getDate() === day;
      });
      
      const dayIn = dayMovements
        .filter(m => m.flow === "in")
        .reduce((sum, m) => sum + (m.weightKg || 0), 0);
      
      const dayOut = dayMovements
        .filter(m => m.flow === "out")
        .reduce((sum, m) => sum + (m.weightKg || 0), 0);
      
      dailyData.push({ day, in: dayIn, out: dayOut });
    }

    setStats({
      totalBaldesIn,
      totalBaldesOut,
      totalKgIn,
      totalKgOut,
      totalRevenue,
      topFlavors,
      dailyData
    });
  }

  function changeMonth(delta: number) {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  }

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  if (!stats) return <div className="p-4">Cargando...</div>;

  const balance = stats.totalBaldesIn - stats.totalBaldesOut;

  return (
    <div className="space-y-4">
      {/* Selector de mes */}
      <div className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
        <Tooltip content="Ir al mes anterior" side="bottom">
          <Button variant="secondary" onClick={() => changeMonth(-1)}>
            ← Anterior
          </Button>
        </Tooltip>
        <div className="text-lg font-semibold">
          {monthNames[selectedMonth]} {selectedYear}
        </div>
        <Tooltip content="Ir al mes siguiente" side="bottom">
          <Button variant="secondary" onClick={() => changeMonth(1)}>
            Siguiente →
          </Button>
        </Tooltip>
      </div>

      {/* Resumen general */}
      <div className="rounded-lg border border-border overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <div className="p-4">
          <h3 className="font-bold text-lg mb-3">📊 Resumen del Mes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Tooltip content="Total de baldes ingresados este mes" side="top">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Baldes Entrada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.totalBaldesIn}</div>
                  <div className="text-sm text-muted-foreground">{stats.totalKgIn.toFixed(1)} kg</div>
                </CardContent>
              </Card>
            </Tooltip>

            <Tooltip content="Total de baldes salidos este mes" side="top">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Baldes Salida</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{stats.totalBaldesOut}</div>
                  <div className="text-sm text-muted-foreground">{stats.totalKgOut.toFixed(1)} kg</div>
                </CardContent>
              </Card>
            </Tooltip>

            <Tooltip content="Diferencia entre entradas y salidas (Entrada - Salida)" side="top">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Balance Neto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {balance > 0 ? '+' : ''}{balance}
                  </div>
                  <div className="text-sm text-muted-foreground">baldes</div>
                </CardContent>
              </Card>
            </Tooltip>

            <Tooltip content="Ingresos totales por ventas en este período" side="top">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Facturado</CardTitle>
                </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">${stats.totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">en ventas</div>
              </CardContent>
            </Card>
            </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 sabores */}
        <Card>
          <CardHeader>
            <Tooltip content="Los 5 sabores con más ventas este mes ordenados por cantidad de baldes" side="right">
              <CardTitle>🏆 Top 5 Sabores con Más Salida</CardTitle>
            </Tooltip>
          </CardHeader>
          <CardContent>
            {stats.topFlavors.length === 0 ? (
              <div className="text-muted-foreground text-center py-4">
                No hay ventas registradas este mes
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topFlavors.map((flavor, index) => (
                  <div key={flavor.name} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`font-bold text-xl ${
                        index === 0 ? 'text-yellow-500' :
                        index === 1 ? 'text-gray-400' :
                        index === 2 ? 'text-orange-600' :
                        'text-muted-foreground'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{flavor.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {flavor.baldes} baldes ({flavor.kg.toFixed(1)} kg)
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        ${flavor.revenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico simple de barras */}
        <Card>
          <CardHeader>
            <Tooltip content="Gráfica de movimientos diarios: entradas en verde, salidas en rojo" side="left">
              <CardTitle>📈 Movimientos Diarios</CardTitle>
            </Tooltip>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-auto">
              {stats.dailyData.filter(d => d.in > 0 || d.out > 0).length === 0 ? (
                <div className="text-muted-foreground text-center py-4">
                  No hay movimientos registrados este mes
                </div>
              ) : (
                stats.dailyData
                  .filter(d => d.in > 0 || d.out > 0)
                  .map(d => (
                    <div key={d.day} className="space-y-1">
                      <div className="text-xs text-muted-foreground">Día {d.day}</div>
                      <div className="flex gap-2 items-center">
                        <div className="w-20 text-xs text-right text-green-600">
                          {d.in > 0 ? `+${d.in.toFixed(1)} kg` : ''}
                        </div>
                        <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-green-500 h-full" 
                            style={{ width: `${(d.in / Math.max(d.in, d.out)) * 50}%` }}
                          />
                          <div 
                            className="bg-red-500 h-full" 
                            style={{ width: `${(d.out / Math.max(d.in, d.out)) * 50}%` }}
                          />
                        </div>
                        <div className="w-20 text-xs text-left text-red-600">
                          {d.out > 0 ? `-${d.out.toFixed(1)} kg` : ''}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
