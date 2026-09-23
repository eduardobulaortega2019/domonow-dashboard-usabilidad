# DomoNow Dashboard Usabilidad - Vercel FIX

Versión autocontenida para Vercel. Todo el CSS, JavaScript propio y logo están embebidos en `index.html`, para evitar errores 404 de rutas `/src` o `/public`.

## Despliegue
1. Sube `index.html` y `vercel.json` a la raíz del repositorio.
2. En Vercel, Root Directory debe apuntar a esa misma raíz.
3. Framework Preset: Other.
4. Build Command: vacío.
5. Output Directory: vacío.
6. Redeploy.

Requiere conexión a internet en el navegador para cargar SheetJS y Chart.js desde jsDelivr.
