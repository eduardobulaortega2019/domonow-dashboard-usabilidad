# DomoNow Dashboard de Usabilidad — V7

Versión que conserva el diseño aprobado y separa formalmente **adopción general** de **profundidad de uso**.

## Regla V7

Para cada apartamento:

- `usaDomonow = 1` si utilizó al menos uno de los 5 módulos medidos.
- `usaDomonow = 0` si no utilizó ninguno.
- El apartamento suma **máximo 1** al indicador de adopción general, aunque haya usado varios módulos o realizado muchas transacciones.
- `modulosUsados` sí puede tomar valores de 0 a 5 y se utiliza únicamente para la profundidad de uso.

Ejemplo:

- 50 pases de acceso → Accesos = 1 módulo.
- 8 solicitudes → Solicitudes = 1 módulo.
- 12 reservas → Reservas = 1 módulo.
- 0 alertas → Alertas = 0 módulos.
- 30 registros de paquetería → Paquetería = 1 módulo.

Resultado:

- **Profundidad de uso:** 4 de 5 módulos.
- **Adopción general DomoNow:** 1 apartamento adoptante.

## Accesos

- Accesos portería = apartamentos únicos con al menos un uso de portería.
- Accesos usuario = apartamentos únicos con al menos un uso de usuario.
- Accesos total = unión de ambos grupos; un apartamento presente en ambos se cuenta una sola vez.
- Los porcentajes se calculan sobre la cantidad oficial de apartamentos de `Base Copropiedades.xlsx`.

## Corte vigente

Los KPIs generales siempre se calculan con el archivo `Base Datos DomoNow ...` cuya fecha en el nombre sea la más reciente. Los cortes anteriores permanecen en IndexedDB para el histórico.

## Despliegue

Subir `index.html`, `vercel.json` y `README.md` a la raíz del repositorio conectado a Vercel y volver a desplegar.
