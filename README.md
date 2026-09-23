# DomoNow Dashboard de Usabilidad - V3

Versión corregida para Vercel.

## Corrección principal
- Corrige el error `waitForXlsx is not defined`.
- Mantiene un alias de compatibilidad `waitForXlsx()` -> `waitForLibraries()`.
- Lee `Base Copropiedades.xlsx` con las columnas `property_name` y `Cantidad de Aptos`.
- Lee los archivos `Base Datos DomoNow ...` como cortes históricos.
- Mantiene histórico local en IndexedDB.

## Despliegue
Subir a la raíz del repositorio:
- `index.html`
- `vercel.json`
- `README.md`

En Vercel usar Framework Preset: `Other`.
