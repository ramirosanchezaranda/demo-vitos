# Migración a Supabase - Instrucciones

## Pasos para conectar tu aplicación a Supabase

### 1. Crear cuenta y proyecto en Supabase

1. Ve a https://supabase.com y crea una cuenta (o inicia sesión)
2. Crea un nuevo proyecto
3. Espera a que el proyecto se inicialice (puede tardar unos minutos)

### 2. Crear las tablas en Supabase

1. En el panel de Supabase, ve a **SQL Editor**
2. Abre el archivo `supabase-schema.sql` de este proyecto
3. Copia todo el contenido del archivo
4. Pégalo en el SQL Editor de Supabase
5. Haz clic en **Run** para ejecutar el script
6. Verifica que las tablas `flavors` y `movements` se crearon correctamente en la pestaña **Table Editor**

### 3. Obtener las credenciales de Supabase

1. En el panel de Supabase, ve a **Settings** → **API**
2. Copia los siguientes valores:
   - **Project URL**: algo como `https://tuproyecto.supabase.co`
   - **anon public**: una clave larga que empieza con `eyJ...`

### 4. Configurar el archivo .env

1. En la raíz del proyecto, crea un archivo llamado `.env` (sin extensión)
2. Copia el contenido de `.env.example`:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
   ```
3. Reemplaza los valores con tus credenciales:
   - `VITE_SUPABASE_URL`: pega tu Project URL
   - `VITE_SUPABASE_ANON_KEY`: pega tu anon public key

### 5. Instalar dependencias y ejecutar

```bash
npm install
npm run dev
```

### 6. Verificar la migración

La aplicación ahora está conectada a Supabase. Al iniciar:

1. Se crearán automáticamente los 62 sabores con sus PLUs en la base de datos
2. Todos los movimientos nuevos se guardarán en Supabase
3. El stock se calculará desde Supabase

## Migrar datos existentes de IndexedDB (opcional)

Si tenías datos en IndexedDB y quieres migrarlos a Supabase:

1. Abre la consola del navegador (F12)
2. Ejecuta este código para exportar tus datos:

```javascript
// Exportar flavors
const dbReq = indexedDB.open('helado_scan_db', 3);
dbReq.onsuccess = () => {
  const db = dbReq.result;
  const tx = db.transaction('flavors', 'readonly');
  const store = tx.objectStore('flavors');
  const req = store.getAll();
  req.onsuccess = () => {
    console.log('FLAVORS:', JSON.stringify(req.result, null, 2));
  };
};

// Exportar movements
const dbReq2 = indexedDB.open('helado_scan_db', 3);
dbReq2.onsuccess = () => {
  const db = dbReq2.result;
  const tx = db.transaction('movements', 'readonly');
  const store = tx.objectStore('movements');
  const req = store.getAll();
  req.onsuccess = () => {
    console.log('MOVEMENTS:', JSON.stringify(req.result, null, 2));
  };
};
```

3. Copia los datos exportados
4. Contacta para crear un script de migración personalizado

## Diferencias principales

- **Antes (IndexedDB)**: Los datos se guardaban solo en tu navegador
- **Ahora (Supabase)**: Los datos están en la nube y se pueden acceder desde cualquier dispositivo
- **Ventajas**:
  - ✅ Datos sincronizados en la nube
  - ✅ Backup automático
  - ✅ Acceso desde múltiples dispositivos
  - ✅ No se pierden datos si se borra el caché del navegador

## Notas importantes

- El archivo `.env` **NO** debe subirse a GitHub (ya está en .gitignore)
- Las credenciales son específicas para tu proyecto
- Si necesitas compartir el proyecto, cada persona debe crear su propio archivo `.env`
