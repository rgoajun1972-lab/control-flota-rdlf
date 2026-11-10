# Manual de uso · Control de Flota

Aplicación web para administrar la flota de móviles de la concesión: titulares, reemplazos, envíos a taller e historial.

- **Dirección web:** https://control-flota-rdlf.vercel.app
- **Acceso:** no requiere usuario ni contraseña. Cualquiera con el link puede entrar.
- **Datos:** se guardan en línea; se ven iguales desde cualquier computador o celular.

---

## 1. Primer vistazo

Arriba a la izquierda:
- Título **Control de Flota** y el logo.
- Abajo del título aparecen el **Encargado de Flota** y su **Cargo** (los configurás en Catálogos).

Arriba a la derecha:
- Botón azul **+ Nuevo móvil** (crea un móvil titular rápido).
- Botón **☀️ / 🌙** para cambiar entre modo claro y nocturno. La preferencia queda guardada en el navegador.

En el centro hay cinco pestañas:
1. **Flota Titular**
2. **Flota Reemplazos**
3. **Taller**
4. **Historial**
5. **Catálogos**

---

## 2. Configuración inicial (hacer una sola vez)

Antes de cargar móviles conviene configurar dos cosas desde la pestaña **Catálogos**:

### 2.1 Encargado de Flota

1. Entrá a **Catálogos → Encargado de Flota**.
2. Escribí tu **Nombre** y **Cargo**.
3. Clic en **Guardar**.
4. Desde ese momento tu nombre aparece debajo de "Control de Flota" en todas las pantallas.

Si cambia la persona encargada: volvés a la misma pestaña, editás los datos y Guardar — pisa al anterior.

### 2.2 Listas desplegables (Áreas, Leasings, Marcas, Motivos)

La app trae listas por defecto: áreas típicas (Operaciones, Conservación…), empresas de leasing (Mitta, Salfa, Kaufmann…), marcas (Toyota, Ford, Nissan…) y motivos de envío a taller.

Si querés **modificar** cualquiera de esas listas:

1. Catálogos → pestaña a modificar (ej. **Empresas de leasing**).
2. Si la lista aparece vacía, dale **↓ Importar valores por defecto** → se cargan todos a la base.
3. A partir de ahí:
   - **+ Agregar valor** → abre un recuadro para escribir un valor nuevo.
   - **✎ Editar** en cada fila → podés renombrarlo.
   - **🗑 Eliminar** → lo saca del desplegable (no borra los móviles que ya lo usan).
4. Los cambios se reflejan de inmediato en los formularios de "Nuevo móvil" y "Enviar a taller".

---

## 3. Flota Titular

Es el listado principal de móviles operativos.

### Columnas

- **Patente** (formato chileno).
- **Área**, **Marca · Modelo**, **Año**, **Leasing**, **Responsable**, **Chevron** (Sí/No).
- **Fin Leasing** (fecha en que termina el contrato de leasing).
- **Estado**: Operativo, Stand by, En taller, Baja.
- **Acciones**.

### Buscar y filtrar

- Caja de búsqueda al tope: busca por patente, marca, modelo, responsable.
- Desplegables **Área** y **Leasing** para filtrar.

### Agregar un móvil

1. Botón **+ Nuevo móvil** (arriba a la derecha de la pantalla).
2. Completá los campos; **Patente** y **Estado** son obligatorios.
3. **Guardar**.

### Editar, enviar a taller o eliminar

En la columna **Acciones** de cada fila:

- **✎ Editar** → abre el modal con los datos cargados. Si el móvil está **En taller** este botón queda deshabilitado (hay que cerrar el envío primero).
- **🔧 A taller** → te lleva a crear un envío con ese móvil preseleccionado.
- **🗑 Eliminar** → te pregunta antes. Si el móvil tiene envíos en el historial, te lo avisa (y si confirmás, se borra todo junto).

---

## 4. Flota Reemplazos

Misma lógica que Flota Titular, pero muestra solamente los móviles con **rol = Reemplazo**. Estos son los que después se asignan cuando un titular va a taller.

Para dar de alta uno nuevo: botón **+ Nuevo móvil** y en el campo **Rol** elegí **Reemplazo**. Aparece un campo extra **TCT Reemplazo (Sí / No)**.

---

## 5. Taller (envíos activos)

Muestra los móviles que **están actualmente en taller** (envíos con fecha de salida real sin cargar).

### Crear un envío

1. Botón **+ Nuevo envío** (arriba a la derecha).
2. En **Móvil enviado** elegí el titular. El campo **Taller** se autocompleta con el leasing del móvil (podés cambiarlo).
3. Completá **Tipo** (Panne / Mantención), **Motivo** y **Fecha envío**.
4. En **Patente reemplazo** podés asignar uno de los móviles de reemplazo. **La lista muestra solo los reemplazos libres** (no te aparecen los que ya están asignados a otro envío abierto).
5. Al elegir el reemplazo se autocompletan la **Fecha ingreso reemplazo** y **TCT Reemplazo**.
6. **Guardar**. El móvil titular queda marcado como "En taller" automáticamente.

### Acciones en la tabla

- **✎ Editar** → modificar datos del envío.
- **✓ Salida** → te pide la fecha de salida real. Al confirmar, el móvil titular vuelve a **Operativo** y el envío sale de esta pestaña (pasa al Historial).
- **🗑 Eliminar** → anula el envío. Si el móvil había quedado "En taller" por este envío, lo vuelve a Operativo.

Las filas con **más de 30 días** en taller se pintan en rojo, para que resalten los envíos vencidos.

---

## 6. Historial

Lista completa de envíos a taller (abiertos y cerrados).

### KPIs arriba

- Envíos por **Panne**.
- Envíos por **Mantención**.
- **Días promedio** panne.
- **Días promedio** mantención.
- **Cantidad de móviles** distintos con historial.

Los KPIs respetan los filtros que apliques abajo.

### Filtros

Móvil (patente), Tipo, Año, Estado (Cerrados / Abiertos / Todos) y una caja de búsqueda libre.

### Eliminar del historial

Solo se puede borrar un envío **cerrado** (que tenga fecha de salida real). Si el envío sigue abierto, hay que cerrarlo primero desde la pestaña Taller.

---

## 7. Catálogos

Ya explicado en la sección 2. Resumen de lo que podés administrar desde ahí:

- **Áreas** · **Empresas de leasing** · **Marcas** · **Motivos de envío**: listas desplegables de los formularios.
- **Encargado de Flota**: nombre + cargo del responsable (uno solo; al guardar uno nuevo pisa el anterior).

---

## 8. Tips y preguntas frecuentes

**¿Puedo entrar desde el celular?**
Sí. La app está pensada para funcionar bien en pantalla chica.

**¿Necesito guardar los cambios?**
No. Todo lo que hacés (crear, editar, eliminar) queda guardado al instante en la base de datos.

**¿Qué pasa si me equivoco al cerrar un envío?**
Entrá al Historial, buscá ese envío, borralo desde ahí y volvé a crearlo bien en la pestaña Taller.

**¿Cómo cambio de tema claro a nocturno?**
Botón ☀️ / 🌙 en la esquina superior derecha. La preferencia queda guardada en el navegador.

**¿Por qué no me aparece "Mitta" (u otro valor) en el desplegable de Leasing?**
Alguien lo eliminó del Catálogo. Entrá a **Catálogos → Empresas de leasing** y agregalo nuevamente, o dale a **↓ Importar valores por defecto** para restaurar los que trae el sistema.

**¿Por qué no puedo editar un móvil?**
Porque está **En taller**. Primero cerrá el envío (pestaña Taller → ✓ Salida) y después podrás editarlo.

**¿Por qué no me aparecen patentes de reemplazo para elegir?**
Porque todas están ya asignadas a otros envíos abiertos. Al cerrar uno de esos envíos, el reemplazo vuelve a quedar disponible.

**¿Puedo borrar la lista de "Áreas" y dejarla vacía?**
Sí, pero el formulario de "Nuevo móvil" caerá a los valores por defecto del sistema mientras la lista esté vacía. En cuanto agregues al menos uno, pasa a usar solo los que vos cargaste.

---

## 9. Resumen de iconos

| Icono | Significado |
|---|---|
| **+ Agregar** / **+ Nuevo** | Crear nuevo registro |
| **✎ Editar** | Modificar un registro existente |
| **🔧 A taller** | Enviar el móvil a taller (crea un envío) |
| **✓ Salida** | Marcar salida de un móvil del taller |
| **🗑 Eliminar** | Borrar el registro |
| **☀️ / 🌙** | Cambiar tema claro / nocturno |
| **↓ Importar por defecto** | Cargar los valores de fábrica a la base |

---

*Control de Flota · Ruta de la Fruta*
