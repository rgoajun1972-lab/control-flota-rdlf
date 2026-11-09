<script lang="ts">
	import { onMount } from 'svelte';
	import {
		supabase, AREAS_DEFAULT, LEASINGS_DEFAULT, MARCAS_DEFAULT,
		ESTADOS, ROLES, SI_NO,
		listarCatalogo, combinarCatalogo,
		normalizarPatente, type Movil
	} from '#lib/supabase';

	let AREAS = $state<string[]>(AREAS_DEFAULT);
	let LEASINGS = $state<string[]>(LEASINGS_DEFAULT);
	let MARCAS = $state<string[]>(MARCAS_DEFAULT);

	onMount(async () => {
		const [a, l, m] = await Promise.all([
			listarCatalogo('area'), listarCatalogo('leasing'), listarCatalogo('marca')
		]);
		AREAS = combinarCatalogo(AREAS_DEFAULT, a);
		LEASINGS = combinarCatalogo(LEASINGS_DEFAULT, l);
		MARCAS = combinarCatalogo(MARCAS_DEFAULT, m);
	});

	interface Props {
		item: Movil | null;
		rolInicial?: string;
		onclose: () => void;
		onguardado: () => void;
	}

	let { item, rolInicial = 'Titular', onclose, onguardado }: Props = $props();

	const hoy = new Date().toISOString().slice(0, 10);

	// svelte-ignore state_referenced_locally
	let patente = $state(item?.patente ?? '');
	// svelte-ignore state_referenced_locally
	let area = $state(item?.area ?? '');
	// svelte-ignore state_referenced_locally
	let marca = $state(item?.marca ?? '');
	// svelte-ignore state_referenced_locally
	let modelo = $state(item?.modelo ?? '');
	// svelte-ignore state_referenced_locally
	let anio = $state<number | ''>(item?.anio ?? '');
	// svelte-ignore state_referenced_locally
	let color = $state(item?.color ?? '');
	// svelte-ignore state_referenced_locally
	let leasing = $state(item?.leasing ?? '');
	// svelte-ignore state_referenced_locally
	let rol = $state(item?.rol ?? rolInicial);
	// svelte-ignore state_referenced_locally
	let estado = $state(item?.estado ?? 'Operativo');
	// svelte-ignore state_referenced_locally
	let responsable = $state(item?.responsable ?? '');
	// svelte-ignore state_referenced_locally
	let chevron = $state(item?.chevron ?? '');
	// svelte-ignore state_referenced_locally
	let tct = $state(item?.tct ?? '');
	// svelte-ignore state_referenced_locally
	let observaciones = $state(item?.observaciones ?? '');
	// svelte-ignore state_referenced_locally
	let fecha_alta = $state(item?.fecha_alta ?? hoy);

	let guardando = $state(false);
	let error = $state<string | null>(null);

	let esReemplazo = $derived(rol === 'Reemplazo');
	let soloLectura = $derived(!!item && item.estado === 'En taller');

	async function guardar() {
		error = null;
		const patenteN = normalizarPatente(patente);
		if (!patenteN) { error = 'La Patente es obligatoria.'; return; }
		guardando = true;
		const payload: Partial<Movil> = {
			patente: patenteN,
			area: area || null,
			marca: marca || null,
			modelo: modelo || null,
			anio: anio === '' ? null : Number(anio),
			color: color || null,
			leasing: leasing || null,
			rol: rol || null,
			estado: estado || 'Operativo',
			responsable: responsable || null,
			chevron: chevron || null,
			tct: esReemplazo ? (tct || null) : null,
			observaciones: observaciones || null,
			fecha_alta
		};
		const res = item?.id
			? await supabase.from('moviles').update(payload).eq('id', item.id)
			: await supabase.from('moviles').insert(payload);
		if (res.error) { error = res.error.message; guardando = false; return; }
		guardando = false;
		onguardado();
	}

	function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onclose(); }
</script>

<svelte:window onkeydown={handleKey} />

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
	<div class="absolute inset-0 bg-slate-900/50" onclick={onclose} aria-hidden="true"></div>
	<div class="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
		<header class="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-700">
			<h2 class="text-base font-semibold text-slate-800 dark:text-slate-100">
				{item?.id ? `Editar móvil ${item.patente}` : 'Nuevo móvil'}
			</h2>
			<button aria-label="Cerrar" onclick={onclose} class="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">✕</button>
		</header>
		<form class="max-h-[75vh] space-y-3 overflow-y-auto px-5 py-4 text-sm"
			onsubmit={(e) => { e.preventDefault(); guardar(); }}>
			{#if soloLectura}
				<div class="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
					El móvil está en taller — sólo lectura.
				</div>
			{/if}
			<div class="grid grid-cols-2 gap-3">
				<label class="col-span-1 text-slate-600 dark:text-slate-300">Área
					<input list="areas" bind:value={area} disabled={soloLectura} class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
					<datalist id="areas">{#each AREAS as a (a)}<option value={a}></option>{/each}</datalist>
				</label>
				<label class="col-span-1 text-slate-600 dark:text-slate-300">Marca
					<input list="marcas" bind:value={marca} disabled={soloLectura} class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
					<datalist id="marcas">{#each MARCAS as m (m)}<option value={m}></option>{/each}</datalist>
				</label>
				<label class="col-span-1 text-slate-600 dark:text-slate-300">Modelo
					<input bind:value={modelo} disabled={soloLectura} class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
				</label>
				<label class="col-span-1 text-slate-600 dark:text-slate-300">Año
					<input type="number" bind:value={anio} disabled={soloLectura} class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
				</label>
				<label class="col-span-1 text-slate-600 dark:text-slate-300">Color
					<input bind:value={color} disabled={soloLectura} class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
				</label>
				<label class="col-span-1 text-slate-600 dark:text-slate-300">Patente *
					<input bind:value={patente} disabled={soloLectura}
						onblur={() => (patente = normalizarPatente(patente))}
						class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-mono font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
				</label>
				<label class="col-span-1 text-slate-600 dark:text-slate-300">Leasing
					<select bind:value={leasing} disabled={soloLectura} class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
						<option value=""></option>
						{#each LEASINGS as l (l)}<option value={l}>{l}</option>{/each}
					</select>
				</label>
				<label class="col-span-1 text-slate-600 dark:text-slate-300">Rol
					<select bind:value={rol} disabled={soloLectura} class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
						<option value=""></option>
						{#each ROLES as r (r)}<option value={r}>{r}</option>{/each}
					</select>
				</label>
				<label class="col-span-1 text-slate-600 dark:text-slate-300">Estado *
					<select bind:value={estado} disabled={soloLectura} class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
						{#each ESTADOS as e (e)}<option value={e}>{e}</option>{/each}
					</select>
				</label>
				<label class="col-span-1 text-slate-600 dark:text-slate-300">Responsable
					<input bind:value={responsable} disabled={soloLectura} class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
				</label>
				<label class="col-span-1 text-slate-600 dark:text-slate-300">Chevron
					<select bind:value={chevron} disabled={soloLectura} class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
						<option value=""></option>
						{#each SI_NO as x (x)}<option value={x}>{x}</option>{/each}
					</select>
				</label>
				{#if esReemplazo}
					<label class="col-span-1 text-slate-600 dark:text-slate-300">TCT Reemplazo (Sí / No)
						<select bind:value={tct} disabled={soloLectura} class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
							<option value=""></option>
							{#each SI_NO as x (x)}<option value={x}>{x}</option>{/each}
						</select>
					</label>
				{/if}
				<label class="col-span-1 text-slate-600 dark:text-slate-300">Fecha término Leasing
					<input type="date" bind:value={fecha_alta} disabled={soloLectura}
						class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
				</label>
			</div>
			<label class="block text-slate-600 dark:text-slate-300">Observaciones
				<input bind:value={observaciones} disabled={soloLectura} class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
			</label>
			{#if error}
				<div class="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">{error}</div>
			{/if}
			<footer class="flex justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
				<button type="button" onclick={onclose} class="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
				{#if !soloLectura}
					<button type="submit" disabled={guardando}
						class="rounded-md bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
						{guardando ? 'Guardando…' : 'Guardar'}
					</button>
				{/if}
			</footer>
		</form>
	</div>
</div>
