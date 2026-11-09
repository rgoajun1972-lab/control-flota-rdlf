<script lang="ts">
	import { onMount } from 'svelte';
	import {
		supabase, LEASINGS_DEFAULT, MOTIVOS_ENVIO_DEFAULT,
		TIPOS_ENVIO, SI_NO,
		listarCatalogo, combinarCatalogo,
		parseFecha, formatFechaDMY, type EnvioTaller, type Movil
	} from '#lib/supabase';

	let LEASINGS = $state<string[]>(LEASINGS_DEFAULT);
	let MOTIVOS_ENVIO = $state<string[]>(MOTIVOS_ENVIO_DEFAULT);

	onMount(async () => {
		const [l, mo] = await Promise.all([
			listarCatalogo('leasing'), listarCatalogo('motivo')
		]);
		LEASINGS = combinarCatalogo(LEASINGS_DEFAULT, l);
		MOTIVOS_ENVIO = combinarCatalogo(MOTIVOS_ENVIO_DEFAULT, mo);
	});

	interface Props {
		item: EnvioTaller | null;
		movilPreseleccionado?: number | null;
		onclose: () => void;
		onguardado: () => void;
	}

	let { item, movilPreseleccionado = null, onclose, onguardado }: Props = $props();

	const hoy = new Date().toISOString().slice(0, 10);

	let moviles = $state<Movil[]>([]);
	let reemplazos = $state<Movil[]>([]);

	// svelte-ignore state_referenced_locally
	let movil_id = $state<number | null>(item?.movil_id ?? movilPreseleccionado ?? null);
	// svelte-ignore state_referenced_locally
	let taller = $state(item?.taller ?? '');
	// svelte-ignore state_referenced_locally
	let tipo = $state(item?.tipo ?? 'Panne');
	// svelte-ignore state_referenced_locally
	let motivo = $state(item?.motivo ?? '');
	// svelte-ignore state_referenced_locally
	let fecha_ingreso_in = $state(item?.fecha_ingreso ? formatFechaDMY(item.fecha_ingreso) : formatFechaDMY(hoy));
	// svelte-ignore state_referenced_locally
	let reemplazo_movil_id = $state<number | null>(item?.reemplazo_movil_id ?? null);
	// svelte-ignore state_referenced_locally
	let reemplazo_fecha_llegada_in = $state(item?.reemplazo_fecha_llegada ? formatFechaDMY(item.reemplazo_fecha_llegada) : '');
	// svelte-ignore state_referenced_locally
	let reemplazo_tct = $state(item?.reemplazo_tct ?? '');

	let guardando = $state(false);
	let error = $state<string | null>(null);

	async function cargarMoviles() {
		const { data } = await supabase.from('moviles').select('*').order('patente');
		moviles = data ?? [];
		reemplazos = moviles.filter((m) => (m.rol ?? '') === 'Reemplazo');
	}
	cargarMoviles();

	// Al elegir el móvil enviado, autocompletar Taller con su leasing (si Taller está vacío)
	function alElegirMovil() {
		if (taller.trim() || !movil_id) return;
		const m = moviles.find((x) => x.id === movil_id);
		if (m?.leasing) taller = m.leasing;
	}

	// Al elegir el reemplazo, autocompletar fecha ingreso + TCT desde el móvil
	function alElegirReemplazo() {
		if (!reemplazo_movil_id) return;
		const r = reemplazos.find((x) => x.id === reemplazo_movil_id);
		if (!r) return;
		if (!reemplazo_fecha_llegada_in.trim() && r.fecha_alta) {
			reemplazo_fecha_llegada_in = formatFechaDMY(r.fecha_alta);
		}
		if (!reemplazo_tct && r.tct) reemplazo_tct = r.tct;
	}

	function fechaBlur(v: string): string {
		const iso = parseFecha(v);
		return iso ? formatFechaDMY(iso) : v;
	}

	async function guardar() {
		error = null;
		if (!movil_id) { error = 'Elegí un móvil.'; return; }
		if (!taller.trim()) { error = 'Taller es obligatorio.'; return; }
		const fi = parseFecha(fecha_ingreso_in);
		if (!fi) { error = 'Fecha de envío inválida.'; return; }
		const rfl = reemplazo_fecha_llegada_in ? parseFecha(reemplazo_fecha_llegada_in) : null;
		if (reemplazo_fecha_llegada_in && !rfl) { error = 'Fecha ingreso reemplazo inválida.'; return; }

		guardando = true;
		const payload = {
			movil_id,
			taller: taller.trim(),
			motivo: motivo || null,
			tipo: tipo || 'Panne',
			fecha_ingreso: fi,
			reemplazo_movil_id: reemplazo_movil_id,
			reemplazo_fecha_llegada: rfl,
			reemplazo_tct: reemplazo_tct || null
		};

		const res = item?.id
			? await supabase.from('envios_taller').update(payload).eq('id', item.id)
			: await supabase.from('envios_taller').insert(payload);
		if (res.error) { error = res.error.message; guardando = false; return; }

		// Si el envío queda abierto (sin fecha salida), el móvil pasa a "En taller"
		if (!item?.fecha_salida_real) {
			await supabase.from('moviles').update({ estado: 'En taller' }).eq('id', movil_id);
		}
		guardando = false;
		onguardado();
	}

	function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onclose(); }

	let etiquetaMovil = (m: Movil) =>
		`${m.patente}${m.marca || m.modelo ? ' — ' + [m.marca, m.modelo].filter(Boolean).join(' ') : ''}`;
</script>

<svelte:window onkeydown={handleKey} />

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
	<div class="absolute inset-0 bg-slate-900/50" onclick={onclose} aria-hidden="true"></div>
	<div class="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
		<header class="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-700">
			<h2 class="text-base font-semibold text-slate-800 dark:text-slate-100">
				{item?.id ? `Editar envío #${item.id}` : 'Enviar a taller'}
			</h2>
			<button aria-label="Cerrar" onclick={onclose} class="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">✕</button>
		</header>
		<form class="max-h-[75vh] space-y-3 overflow-y-auto px-5 py-4 text-sm"
			onsubmit={(e) => { e.preventDefault(); guardar(); }}>

			<label class="block text-slate-600 dark:text-slate-300">Móvil enviado *
				<select bind:value={movil_id} onchange={alElegirMovil}
					class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
					<option value={null}>— elegir —</option>
					{#each moviles as m (m.id)}
						<option value={m.id}>{etiquetaMovil(m)}</option>
					{/each}
				</select>
			</label>

			<div class="grid grid-cols-2 gap-3">
				<label class="col-span-1 text-slate-600 dark:text-slate-300">Taller *
					<select bind:value={taller}
						class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
						<option value=""></option>
						{#each LEASINGS as l (l)}<option value={l}>{l}</option>{/each}
					</select>
				</label>
				<label class="col-span-1 text-slate-600 dark:text-slate-300">Tipo *
					<select bind:value={tipo}
						class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
						{#each TIPOS_ENVIO as t (t)}<option value={t}>{t}</option>{/each}
					</select>
				</label>
				<label class="col-span-2 text-slate-600 dark:text-slate-300">Motivo
					<select bind:value={motivo}
						class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
						<option value=""></option>
						{#each MOTIVOS_ENVIO as m (m)}<option value={m}>{m}</option>{/each}
					</select>
				</label>
				<label class="col-span-2 text-slate-600 dark:text-slate-300">Fecha envío * (dd-mm-aaaa)
					<input bind:value={fecha_ingreso_in}
						onblur={() => (fecha_ingreso_in = fechaBlur(fecha_ingreso_in))}
						class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
				</label>
			</div>

			<div class="flex items-center gap-2 pt-2 text-xs font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
				<span>REEMPLAZO</span>
				<div class="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<label class="col-span-2 text-slate-600 dark:text-slate-300">Patente reemplazo
					<select bind:value={reemplazo_movil_id} onchange={alElegirReemplazo}
						class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
						<option value={null}>— ninguno —</option>
						{#each reemplazos as r (r.id)}
							<option value={r.id}>{etiquetaMovil(r)}</option>
						{/each}
					</select>
				</label>
				<label class="col-span-1 text-slate-600 dark:text-slate-300">Fecha ingreso reemplazo
					<input bind:value={reemplazo_fecha_llegada_in}
						onblur={() => (reemplazo_fecha_llegada_in = fechaBlur(reemplazo_fecha_llegada_in))}
						class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
				</label>
				<label class="col-span-1 text-slate-600 dark:text-slate-300">TCT Reemplazo (Sí / No)
					<select bind:value={reemplazo_tct}
						class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
						<option value=""></option>
						{#each SI_NO as x (x)}<option value={x}>{x}</option>{/each}
					</select>
				</label>
			</div>

			{#if error}
				<div class="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">{error}</div>
			{/if}
			<footer class="flex justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
				<button type="button" onclick={onclose}
					class="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
				<button type="submit" disabled={guardando}
					class="rounded-md bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
					{guardando ? 'Guardando…' : 'Guardar'}
				</button>
			</footer>
		</form>
	</div>
</div>
