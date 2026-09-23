# DomoNow Dashboard de Usabilidad · V4

Versión V4 preparada para Vercel.

## Reglas funcionales principales

1. **Corte vigente:** todos los indicadores operativos y generales usan siempre el archivo `Base Datos DomoNow ...` con la fecha de corte más reciente. Un archivo de una fecha posterior pasa automáticamente a ser el corte vigente. Si se corrige un archivo del mismo día, ese corte se reemplaza.
2. **Base maestra:** `Base Copropiedades.xlsx` aporta `property_name` y `Cantidad de Aptos`, usados como denominador oficial.
3. **Accesos:** `Accesos total = Accesos Portería + Accesos Usuario`, tanto en cantidad como en porcentaje. Para profundidad de uso, Accesos sigue contando como un solo módulo.
4. **Histórico:** conserva todos los cortes en IndexedDB.
5. **Filtros del gráfico:** permite activar/desactivar Accesos total, Accesos portería, Accesos usuario, Solicitudes, Reservas, Alertas y Paquetería.

## Despliegue

Subir a la raíz del repositorio:

- `index.html`
- `vercel.json`
- `README.md`

En Vercel usar Framework Preset `Other`, sin Build Command ni Output Directory.
