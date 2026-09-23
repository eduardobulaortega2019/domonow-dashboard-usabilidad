# DomoNow Dashboard de Usabilidad — V5

Versión alineada visualmente con el diseño aprobado del tablero de usabilidad.

## Cambios V5
- Mantiene los indicadores generales calculados siempre con el corte más reciente.
- Adopción por módulo muestra Accesos total y debajo el detalle de Accesos portería y Accesos usuario.
- La profundidad de uso recupera la tarjeta ejecutiva con posición en la red, mejor/menor adopción, registros analizados y comparación de activos contra el corte anterior.
- La sección histórica vuelve al layout aprobado: encabezado sobre el fondo, panel de gráfico y panel de histórico separados.
- Los módulos son filtros individuales del gráfico: Accesos total, Accesos portería, Accesos usuario, Solicitudes, Reservas, Alertas y Paquetería.
- El histórico de cortes conserva la tabla compacta original; el desglose de accesos se consulta desde los filtros del gráfico.
- Los cortes permanecen en IndexedDB y un archivo corregido reemplaza únicamente la misma fecha.

## Despliegue
Subir `index.html`, `vercel.json` y `README.md` a la raíz del repositorio conectado a Vercel.
