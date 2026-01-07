# Producto Demo - Base de Datos Local

## Cambios Realizados

Esta es una versión de demostración de **Inventario Vitos** que utiliza **IndexedDB (DexieDB)** como base de datos local en lugar de Supabase.

### ✅ Cambios Efectuados:

1. **Removido Supabase**: Se eliminó la dependencia `@supabase/supabase-js` del `package.json`
2. **Implementado IndexedDB**: El almacenamiento ahora usa completamente IndexedDB a través del archivo `idb.ts`
3. **Simplificado db.ts**: El archivo `db.ts` ahora es un wrapper que re-exporta las funciones de `idb.ts`
4. **Configuración mínima**: Creado archivo `.env.local` con configuración básica para demo

### 📦 Base de Datos Local

- **Almacenamiento**: Todos los datos se guardan en el navegador usando IndexedDB
- **Persistencia**: Los datos persisten incluso después de cerrar el navegador
- **Sin servidor**: No requiere conexión a internet (excepto para cargar la aplicación)
- **Límite**: Típicamente 50MB por dominio (varía según navegador)

### 🚀 Usar la Aplicación

```bash
npm install
npm run dev
```

Luego abre `http://localhost:5174` en tu navegador.

### 📊 Funcionalidades Disponibles

- ✅ Seleccionar sabores de helado
- ✅ Registrar entradas y salidas de stock
- ✅ Escanear códigos de barras
- ✅ Calcular stocks
- ✅ Exportar datos a CSV
- ✅ Generar reportes PDF
- ✅ Controles mensuales

### 💾 Catálogo de Sabores

El sistema viene precargado con 62 sabores de helado con sus respectivos códigos PLU (000001-000062).

### 🔄 Migrar a Supabase

Si en el futuro necesitas migrar a Supabase:

1. Instala `@supabase/supabase-js`: `npm install @supabase/supabase-js`
2. Reemplaza el contenido de `src/lib/db.ts` con la versión anterior de Supabase
3. Crea un archivo `.env.local` con tus credenciales:
   ```
   VITE_SUPABASE_URL=https://tuproyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anonima
   ```

### 📝 Notas

- Los datos están locales en IndexedDB, no en la nube
- Cada navegador/perfil tiene su propia base de datos separada
- Para compartir datos entre dispositivos, usa la función de exportación CSV

---

**Versión**: 1.0.0 - Demo  
**Última actualización**: Enero 2026
