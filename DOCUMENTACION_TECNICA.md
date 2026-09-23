# DomoNow · réplica del Dashboard de Usabilidad

## 1. Estructura replicada

La implementación reproduce la arquitectura visible del dashboard de referencia:

1. **Barra superior**
   - Identidad DomoNow.
   - Fecha del corte activo.
   - Número de cortes históricos.
   - Estado de la fuente SharePoint.
   - Acciones: `Actualizar desde SharePoint`, `Vincular carpeta` e `Importar`.

2. **Cabecera de página**
   - Título `Usabilidad por copropiedad`.
   - Mensaje de propósito operativo.

3. **Fuente de datos**
   - Explica que la carpeta de SharePoint se sincroniza localmente mediante OneDrive.
   - Muestra la última actualización.
   - Incluye acceso al SharePoint compartido.

4. **Selector y consolidado de red**
   - Selector de copropiedad.
   - Total de copropiedades.
   - Total de apartamentos.
   - Apartamentos activos en la red.
   - Adopción global.

5. **KPIs de la copropiedad**
   - Cumplimiento general.
   - Apartamentos activos y barra de avance.
   - Apartamentos que requieren enfoque.
   - Inicio de sesión único.
   - Adopción de Accesos consolidada, con desglose Portería / Usuario.

6. **Adopción por módulo**
   - Accesos.
   - Solicitudes.
   - Reservas.
   - Alertas.
   - Paquetería.

   En la versión actual del tablero, Accesos Portería y Accesos Usuario se consolidan como un único módulo. Por tanto, la profundidad de uso se calcula sobre **5 módulos**, no sobre 6.

7. **Profundidad de uso**
   - Promedio de módulos usados por apartamento, sobre 5.

8. **Histórico persistente**
   - Vista de red completa o copropiedad seleccionada.
   - Tendencia temporal de adopción por módulo.
   - Tabla por fecha con avance general, módulos y variación contra el corte anterior.
   - Persistencia en IndexedDB.
   - Un corte nuevo agrega fecha; un archivo corregido reemplaza únicamente el mismo corte.

9. **Detalle por apartamento**
   - Búsqueda textual.
   - Filtros Todos / Solo inactivos / Solo activos.
   - Estado.
   - Número de módulos usados.
   - Etiquetas de módulos activos.
   - Paginación.

## 2. Sistema visual

### Tipografías

- **Sora**: títulos, cifras principales y elementos de alta jerarquía.
- **Inter**: textos de interfaz, etiquetas, tablas y controles.

### Paleta

| Token | Valor | Uso |
|---|---|---|
| Purple 900 | `#22083F` | fondos oscuros / cabecera |
| Purple 800 | `#360A5E` | gradientes |
| Purple 700 | `#4E0C86` | énfasis |
| Purple 600 | `#830AD2` | primario DomoNow |
| Purple 500 | `#9A2EE0` | barras / hover |
| Purple 200 | `#E4CDF7` | bordes / foco |
| Purple 100 | `#F1E4FB` | fondos secundarios |
| Purple 50 | `#FAF6FE` | fondos suaves |
| Gold 600 | `#D89A00` | texto dorado |
| Gold 500 | `#F7B501` | acento / progreso |
| Gold 100 | `#FFF2CE` | fondo de acento |
| Green 600 | `#128A4F` | activo / positivo |
| Green 100 | `#DFF7EA` | fondo positivo |
| Red 600 | `#D93B54` | inactivo / alerta |
| Red 100 | `#FCE4E8` | fondo alerta |
| Ink 900 | `#1B1030` | texto principal |
| Ink 700 | `#3A3049` | texto secundario fuerte |
| Ink 500 | `#6C6379` | texto secundario |
| Line | `#E7DEF5` | divisores |
| Background | `#F7F4FC` | fondo general |
| Card | `#FFFFFF` | tarjetas |

### Layout

- Contenedor principal máximo: `1360px`.
- Cards con radios de 14–20px.
- Sombras violetas de baja opacidad.
- Cabecera sticky con gradiente púrpura.
- Breakpoints para tablet y móvil.
- Tablas con overflow horizontal en pantallas pequeñas.

## 3. Regla de adopción

Un apartamento se considera **activo** cuando presenta al menos una interacción en cualquiera de estos cinco módulos:

`Accesos`, `Solicitudes`, `Reservas`, `Alertas`, `Paquetería`.

La adopción general se calcula como:

`apartamentos activos / total oficial de apartamentos × 100`.

Si no existe un total oficial para la copropiedad, el sistema usa el número de unidades encontradas en la fuente y marca internamente el total como estimado.

## 4. Columnas reconocidas

El parser es tolerante a variaciones de nombre. La estructura base esperada es:

- `property_name`
- `lugar`
- `Accesos (Porteros)`
- `Accesos (Usuarios)`
- `Solicitudes`
- `Reservas`
- `Alertas`
- `Paqueteria Unicos` o `Paquetería Únicos`
- `Inicio de sesion unicos` o `Inicio de sesión únicos`

También se soportan alias de `copropiedad`, `apartamento`, `apto`, `PQR/PQRS`, `zonas comunes`, etc.

Para el universo oficial se busca una hoja que contenga columnas como `Cantidad de Aptos`, `Total Apartamentos`, `Cantidad de Apartamentos` o `Unidades`.

## 5. Selección de hoja

Si un libro contiene varias hojas compatibles, el sistema identifica aquellas con columnas de copropiedad y unidad y selecciona la que presenta mayor actividad acumulada. Esto evita tomar una hoja histórica vacía cuando existen copias o cortes dentro del mismo archivo.

## 6. Integración SharePoint

La réplica implementa el mismo patrón observable en el dashboard de referencia:

`SharePoint -> sincronización OneDrive -> carpeta local -> navegador`.

El botón **Vincular carpeta** utiliza File System Access API. El permiso y el `FileSystemDirectoryHandle` quedan asociados al navegador mediante IndexedDB. `Actualizar desde SharePoint` vuelve a recorrer esa carpeta y procesa archivos nuevos o corregidos.

Este enfoque funciona especialmente bien en Chrome y Edge de escritorio.

### Integración remota alternativa

Si DomoNow requiere que el dashboard consulte SharePoint directamente desde Vercel, sin carpeta OneDrive local, debe añadirse una capa Microsoft Graph/Entra ID. En ese escenario se recomienda:

- App Registration en Microsoft Entra ID.
- Permisos mínimos sobre el site/biblioteca correspondiente.
- OAuth 2.0.
- Endpoint server-side en Vercel para listar y descargar los archivos autorizados.
- Nunca exponer secretos de Microsoft Graph en JavaScript del navegador.

## 7. Archivos que falta auditar directamente en SharePoint

La conexión directa al SharePoint compartido no quedó autorizada durante esta ejecución. Una vez conectada la integración de SharePoint, deben revisarse específicamente:

1. Todos los archivos cuyo nombre empiece o contenga **`Base Datos DomoNow`**.
2. La hoja o archivo que define **totales oficiales de apartamentos por copropiedad**.
3. Archivos con cortes históricos para confirmar el **patrón de fechas del nombre**.
4. Cualquier CSV/JSON que replique o complemente las métricas del Excel.
5. Documentos de especificación que cambien la definición de `activo`, `inicio de sesión único` o cualquiera de los cinco módulos.

El código ya está preparado para adaptar alias de columnas sin modificar el layout.

## 8. Archivos del proyecto

- `index.html`: estructura semántica del dashboard.
- `src/styles.css`: sistema visual y responsive.
- `src/db.js`: persistencia IndexedDB.
- `src/data.js`: parsing, normalización y cálculo de métricas.
- `src/main.js`: estado, renderizado, filtros, histórico e importación.
- `public/domonow-logo.webp`: logo DomoNow disponible en el proyecto.
- `vercel.json`: configuración de despliegue y headers básicos.
- `README.md`: ejecución, despliegue y operación.

## 9. Validaciones realizadas

- Validación sintáctica de los tres módulos JavaScript con `node --check`.
- Verificación de estructura y rutas locales.
- El intento de render headless con Chromium del entorno de trabajo no finalizó por una limitación del proceso Chromium/DBus del contenedor; no se detectó un error JavaScript del proyecto durante esa prueba.
