# Sincronización inicial

Cada sesión contiene una copia de la rutina y sus fichas de ejercicios. SQLite guarda la sesión y una operación pendiente en una sola transacción. Una operación tiene UUID, versión base y contenido inmutable. Las modificaciones posteriores generan nuevas operaciones ordenadas.

Nest serializa las escrituras de una cuenta en PostgreSQL. El UUID de operación y un hash del contenido garantizan que un reintento devuelva el mismo resultado, incluso si la primera respuesta se perdió. Reusar un UUID con otro contenido produce 409. Una versión base antigua también produce 409, sin sobrescribir datos.

El cliente elimina una operación de la cola solo después de confirmar su recepción. Después descarga el historial; no reemplaza sesiones que todavía tienen cambios pendientes. La versión local incluye las operaciones en cola. Todos los datos se particionan por cuenta; Nest deriva su propietario de la sesión autenticada.

Ante un conflicto, el usuario puede conservar ambos: se copia el registro local con un nuevo identificador y se recupera el remoto. No se fusionan series automáticamente. La decisión y la copia local son transaccionales.

Primera versión: no hay borrado, cursor ni retención limitada; se descarga el historial completo. Estas funciones requieren ampliar el protocolo con tombstones y paginación antes de escalar. El catálogo de demostración se distribuye con la app; la actualización remota del catálogo llegará con su administración.
