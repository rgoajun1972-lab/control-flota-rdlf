import * as XLSX from 'xlsx';

/**
 * Exporta un arreglo de objetos a un archivo .xlsx que se descarga.
 * - `filas`: arreglo de objetos. Las keys del primer objeto definen las columnas.
 * - `nombreArchivo`: sin extensión; se le agrega la fecha de hoy y ".xlsx".
 * - `nombreHoja`: nombre de la pestaña dentro del Excel.
 */
export function exportarExcel(
	filas: Record<string, unknown>[],
	nombreArchivo: string,
	nombreHoja = 'Datos'
): void {
	if (!filas.length) {
		alert('No hay datos para exportar.');
		return;
	}
	const wb = XLSX.utils.book_new();
	const ws = XLSX.utils.json_to_sheet(filas);

	// Ancho automático aproximado: para cada columna, max(longitud del header, longitud máxima del valor)
	const columnas = Object.keys(filas[0]);
	ws['!cols'] = columnas.map((col) => {
		const maxLen = Math.max(
			col.length,
			...filas.map((f) => String(f[col] ?? '').length)
		);
		return { wch: Math.min(Math.max(maxLen + 2, 8), 50) };
	});

	XLSX.utils.book_append_sheet(wb, ws, nombreHoja.slice(0, 31));

	const fecha = new Date().toISOString().slice(0, 10);
	XLSX.writeFile(wb, `${nombreArchivo}_${fecha}.xlsx`);
}
