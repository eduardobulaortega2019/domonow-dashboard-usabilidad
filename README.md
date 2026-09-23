# DomoNow · Dashboard de Usabilidad

Réplica funcional del tablero de usabilidad de DomoNow con:

- Layout, identidad visual y jerarquía del dashboard original.
- KPIs por copropiedad y consolidados de la red.
- Adopción sobre 5 módulos: Accesos, Solicitudes, Reservas, Alertas y Paquetería.
- Inicio de sesión único como métrica complementaria.
- Accesos consolidados (Portería + Usuario), con desglose por canal.
- Histórico persistente en IndexedDB.
- Tendencia histórica por módulo.
- Tabla histórica de cortes con variación frente al corte anterior.
- Detalle por apartamento, buscador, filtros y paginación.
- Lectura de Excel/CSV.
- Vinculación persistente de una carpeta local sincronizada desde SharePoint por OneDrive.

## Fuente de datos

El flujo replica el comportamiento del tablero publicado: el navegador vincula una carpeta local que está sincronizada por OneDrive con SharePoint. No se suben los archivos a un servidor del dashboard; se leen en el navegador y los cortes normalizados se conservan localmente en IndexedDB.

En Chrome o Edge:

1. Sincroniza en OneDrive la carpeta de SharePoint que contiene los archivos de usabilidad.
2. Abre el dashboard desplegado.
3. Haz clic en **Vincular carpeta** y selecciona la carpeta sincronizada.
4. A partir de ese momento, usa **Actualizar desde SharePoint** cada vez que OneDrive haya sincronizado un corte nuevo o corregido.
5. Si un archivo representa una fecha ya existente, reemplaza solo ese corte. Los demás permanecen intactos.

Si el navegador no soporta File System Access API, usa **Importar** para cargar uno o varios archivos manualmente.

## Estructura de datos reconocida

El parser busca una hoja con columnas equivalentes a:

- `property_name`
- `lugar`
- `Accesos (Porteros)`
- `Accesos (Usuarios)`
- `Solicitudes`
- `Reservas`
- `Alertas`
- `Paqueteria Unicos` / `Paquetería Únicos`
- `Inicio de sesion unicos` / `Inicio de sesión únicos`

También reconoce alias comunes como `copropiedad`, `apartamento`, `apto`, `PQR/PQRS`, `zonas comunes`, etc.

Para los totales oficiales busca una hoja que contenga una columna equivalente a `Cantidad de Aptos`, `Total Apartamentos`, `Cantidad de Apartamentos`, `Unidades`, entre otras. Si no existe, usa como referencia el número de registros encontrados para la copropiedad.

Si hay varias hojas candidatas, se utiliza la de mayor actividad acumulada, reproduciendo la lógica del dashboard anterior de DomoNow.

## Fecha del corte

La fecha se intenta extraer del nombre del archivo en formatos como:

- `2026-09-23`
- `23-09-2026`
- `23_09_2026`
- `23 septiembre 2026`

Si no se encuentra una fecha en el nombre, se utiliza la fecha de última modificación del archivo.

## Ejecución local

Como usa módulos JavaScript, no conviene abrir `index.html` directamente con `file://`. Levántalo con cualquier servidor estático, por ejemplo:

```bash
python -m http.server 8080
```

Luego abre `http://localhost:8080`.

## Despliegue en Vercel

No requiere build ni variables de entorno.

1. Sube esta carpeta a un repositorio Git.
2. Impórtala en Vercel.
3. Framework preset: **Other**.
4. Build command: dejar vacío.
5. Output directory: dejar vacío.
6. Deploy.

También puedes desplegarla con Vercel CLI desde esta carpeta.

## Consideración sobre acceso directo a SharePoint

Un navegador no puede leer silenciosamente una carpeta de SharePoint remota solo con la URL compartida. Para una integración servidor-a-servidor sin depender de OneDrive se requiere autenticación Microsoft Graph/Entra ID (por ejemplo, App Registration, permisos a SharePoint y flujo OAuth). Esta versión reproduce el modelo del dashboard de referencia: SharePoint sincronizado por OneDrive + File System Access API.
