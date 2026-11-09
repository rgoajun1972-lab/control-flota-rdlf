import { createClient } from '@supabase/supabase-js';

// Credenciales de Supabase embebidas directamente. Son valores PÚBLICOS
// (anon key): la autorización se gestiona con RLS del lado de la base, no
// escondiendo la clave. Esto evita problemas de inyección de env vars en
// una SPA estática servida por Vercel.
const SUPABASE_URL = 'https://ftxpggpdbdwwpkpgwyjz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NiByTzmH526VsR8tGlfxAA_cfdbHFxA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Constantes de dominio (valores por defecto — pueden ampliarse desde /catalogos)
export const AREAS_DEFAULT = [
	'Operaciones', 'Conservación', 'Administración', 'Supervisión',
	'Gerencia', 'Jefes de área', 'Mantención Sistemas', 'Otro'
];

export const LEASINGS_DEFAULT = [
	'Mitta', 'Salfa', 'Kaufmann', 'Relsa', 'Eurocar',
	'LED PROYECT', 'Wift', 'SCRDF', 'Propio (Concesionaria)', 'Otro'
];

export const MOTIVOS_ENVIO_DEFAULT = ['Mantención', 'Falla mecánica'];

// Fijos (estructurales; no se editan desde la UI)
export const ESTADOS = ['Operativo', 'Stand by', 'En taller', 'Baja'];
export const ROLES = ['Titular', 'Reemplazo'];
export const SI_NO = ['Sí', 'No'];
export const TIPOS_ENVIO = ['Panne', 'Mantención'];

// Aliases por compatibilidad con código ya escrito
export const AREAS = AREAS_DEFAULT;
export const LEASINGS = LEASINGS_DEFAULT;
export const MOTIVOS_ENVIO = MOTIVOS_ENVIO_DEFAULT;

export const MARCAS_DEFAULT = [
	'AGRALE', 'ASIA', 'AUDI', 'B Y D', 'BAIC', 'BAJAJ', 'BENELLI', 'BMW',
	'Brillance', 'CAMC', 'CATERPILLAR', 'CHANGAN', 'CHERY', 'CHEVROLET',
	'CITROEN', 'CORSA', 'DAEWOO', 'DAF', 'DAIHATSU', 'DFM', 'DFSK', 'DIMEX',
	'DODGE', 'FIAT', 'FORD', 'FOTON', 'FREIGHTLINER', 'GEELY', 'GREAT WALL',
	'Haval', 'Hechizo', 'HIGER', 'HINO', 'HONDA', 'HUANGHAI', 'HYOSUNG',
	'HYUNDAI', 'INTERNATIONAL', 'ISUZU', 'IVECO', 'JAC', 'JEEP', 'JMC',
	'JOHN DEERE', 'KAWASAKI', 'KENWORTH', 'KGM', 'KIA', 'KING LONG', 'KTM',
	'KYC', 'LADA', 'LANDKING', 'LIFAN', 'LMC', 'MACK', 'MAESTRANZA VYN',
	'MAHINDRA', 'MAN', 'MAXUS', 'MAZDA', 'MERCEDES BENZ', 'MG', 'MINI',
	'MITSUBISHI', 'MOTORRAD', 'NEW HOLLAND', 'NISSAN', 'OPEL', 'OTRA MARCA',
	'PEGASO', 'PEUGEOT', 'PULSAR', 'RAM', 'RENAULT(Berliet)', 'SAMSUNG',
	'SANYOUNG', 'SCANIA', 'SINOTRUK', 'SKODA', 'SSANGYONG', 'SUBARU', 'SUZUKI',
	'TATA', 'TOYOTA', 'TREMAC', 'TRIUNPH', 'URAL', 'VOLARE', 'VOLKSWAGEN',
	'VOLVO', 'WESTERN STAR', 'YAMAHA', 'YUE JIN', 'ZNA', 'ZOTIE', 'ZOTYE',
	'ZX', 'ZXAUTO'
];

export const MARCAS = MARCAS_DEFAULT;

// ===================================================================
// Catálogos dinámicos (tabla `catalogos` en Supabase)
// Permite agregar/eliminar valores extra desde la UI /catalogos.
// Los DEFAULTS de arriba son fijos; los personalizados se guardan en BD.
// ===================================================================
export type TipoCatalogo = 'area' | 'leasing' | 'marca' | 'motivo';

export const CATALOGOS: { tipo: TipoCatalogo; etiqueta: string; defaults: string[] }[] = [
	{ tipo: 'area',    etiqueta: 'Áreas',               defaults: AREAS_DEFAULT },
	{ tipo: 'leasing', etiqueta: 'Empresas de leasing', defaults: LEASINGS_DEFAULT },
	{ tipo: 'marca',   etiqueta: 'Marcas',              defaults: MARCAS_DEFAULT },
	{ tipo: 'motivo',  etiqueta: 'Motivos de envío',    defaults: MOTIVOS_ENVIO_DEFAULT }
];

export interface Catalogo {
	id?: number;
	tipo: TipoCatalogo;
	valor: string;
	creado?: string;
}

export async function listarCatalogo(tipo: TipoCatalogo): Promise<Catalogo[]> {
	const { data, error } = await supabase
		.from('catalogos')
		.select('*')
		.eq('tipo', tipo)
		.order('valor');
	if (error) {
		console.warn('catalogos listar', error.message);
		return [];
	}
	return (data ?? []) as Catalogo[];
}

// ===================================================================
// Encargados de flota (tabla `encargados`): nombre + cargo
// La pantalla principal muestra el más reciente.
// ===================================================================
export interface Encargado {
	id?: number;
	nombre: string;
	cargo?: string | null;
	creado?: string;
}

export async function obtenerEncargadoActual(): Promise<Encargado | null> {
	const { data, error } = await supabase
		.from('encargados')
		.select('*')
		.order('creado', { ascending: false })
		.limit(1);
	if (error || !data || data.length === 0) return null;
	return data[0] as Encargado;
}

// Guarda al encargado (único). Si ya hay uno, lo actualiza; si no, lo crea.
// Si por error quedaron varios, se queda con el más reciente y borra el resto.
export async function guardarEncargado(nombre: string, cargo: string) {
	const n = nombre.trim();
	const c = cargo.trim();
	if (!n) return { error: { message: 'El nombre no puede estar vacío.' } };
	const actual = await obtenerEncargadoActual();
	if (actual?.id) {
		const upd = await supabase
			.from('encargados')
			.update({ nombre: n, cargo: c || null })
			.eq('id', actual.id);
		if (upd.error) return upd;
		// limpieza por si quedaron registros viejos
		await supabase.from('encargados').delete().neq('id', actual.id);
		return upd;
	}
	return await supabase.from('encargados').insert({ nombre: n, cargo: c || null });
}

export async function eliminarEncargado() {
	// Borra todo (solo hay uno conceptualmente)
	return await supabase.from('encargados').delete().neq('id', 0);
}

export async function agregarCatalogo(tipo: TipoCatalogo, valor: string) {
	const v = valor.trim();
	if (!v) return { error: 'El valor no puede estar vacío.' };
	return await supabase.from('catalogos').insert({ tipo, valor: v });
}

export async function editarCatalogo(id: number, valor: string) {
	const v = valor.trim();
	if (!v) return { error: 'El valor no puede estar vacío.' };
	return await supabase.from('catalogos').update({ valor: v }).eq('id', id);
}

export async function eliminarCatalogo(id: number) {
	return await supabase.from('catalogos').delete().eq('id', id);
}

// Si la BD tiene valores para ese tipo se usan SOLO los de BD (el usuario
// tomó control). Si está vacía, se usan los defaults del código como fallback.
export function combinarCatalogo(defaults: string[], extras: Catalogo[]): string[] {
	const valores = extras.length > 0 ? extras.map((e) => e.valor) : defaults;
	return Array.from(new Set(valores)).sort((a, b) => a.localeCompare(b, 'es'));
}

// Inserta los defaults en la tabla ignorando los que ya estén (UNIQUE tipo,valor)
export async function sembrarCatalogoPorDefecto(tipo: TipoCatalogo, defaults: string[]) {
	if (!defaults.length) return { error: null, inserted: 0 };
	const filas = defaults.map((valor) => ({ tipo, valor }));
	const res = await supabase
		.from('catalogos')
		.upsert(filas, { onConflict: 'tipo,valor', ignoreDuplicates: true });
	return res;
}

// Normaliza patente chilena a formato con guión:
//   abcd12 → ABCD-12  (nueva, 4L+2D)
//   ab1234 → AB-1234  (antigua, 2L+4D)
export function normalizarPatente(s: string): string {
	const limpio = (s || '').replace(/[\s\-.]/g, '').toUpperCase();
	let m = limpio.match(/^([A-Z]{4})(\d{2})$/);
	if (m) return `${m[1]}-${m[2]}`;
	m = limpio.match(/^([A-Z]{2})(\d{4})$/);
	if (m) return `${m[1]}-${m[2]}`;
	return limpio;
}

// Parsea cualquier formato razonable a ISO (yyyy-mm-dd)
export function parseFecha(s: string): string | null {
	const t = (s || '').trim();
	if (!t) return null;
	const soloDig = t.replace(/\D/g, '');
	let d: number | null = null, m: number | null = null, y: number | null = null;
	if (/^\d{8}$/.test(soloDig)) {
		d = +soloDig.slice(0, 2); m = +soloDig.slice(2, 4); y = +soloDig.slice(4);
	} else if (/^\d{6}$/.test(soloDig)) {
		d = +soloDig.slice(0, 2); m = +soloDig.slice(2, 4); y = 2000 + +soloDig.slice(4);
	} else {
		const partes = t.split(/[-/.\s]+/);
		if (partes.length === 3) {
			if (partes[0].length === 4) {
				y = +partes[0]; m = +partes[1]; d = +partes[2];
			} else {
				d = +partes[0]; m = +partes[1]; y = +partes[2];
				if (y < 100) y += 2000;
			}
		}
	}
	if (d === null || m === null || y === null) return null;
	if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return null;
	const fecha = new Date(Date.UTC(y, m - 1, d));
	if (fecha.getUTCFullYear() !== y || fecha.getUTCMonth() !== m - 1 || fecha.getUTCDate() !== d) {
		return null;
	}
	return fecha.toISOString().slice(0, 10);
}

export function formatFechaDMY(iso: string | null | undefined): string {
	if (!iso) return '';
	const [y, m, d] = iso.slice(0, 10).split('-');
	if (!y || !m || !d) return '';
	return `${d}-${m}-${y}`;
}

export function diasEntre(desde: string | null, hasta: string | null): number | null {
	if (!desde) return null;
	const a = new Date(desde);
	const b = hasta ? new Date(hasta) : new Date();
	const ms = b.getTime() - a.getTime();
	return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// Tipos
export interface Movil {
	id?: number;
	patente: string;
	area?: string | null;
	marca?: string | null;
	modelo?: string | null;
	anio?: number | null;
	color?: string | null;
	leasing?: string | null;
	estado: string;
	rol?: string | null;
	responsable?: string | null;
	chevron?: string | null;
	tct?: string | null;
	observaciones?: string | null;
	fecha_alta?: string;
}

export interface EnvioTaller {
	id?: number;
	movil_id: number;
	taller: string;
	motivo?: string | null;
	tipo?: string | null;
	fecha_ingreso: string;
	fecha_salida_estimada?: string | null;
	fecha_salida_real?: string | null;
	reemplazo_movil_id?: number | null;
	reemplazo_fecha_llegada?: string | null;
	reemplazo_fecha_retiro?: string | null;
	reemplazo_tct?: string | null;
	observaciones?: string | null;
	fecha_registro?: string;
}
