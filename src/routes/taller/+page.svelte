<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase, diasEntre, formatFechaDMY, parseFecha,
		TIPOS_ENVIO, type EnvioTaller, type Movil } from '#lib/supabase';
	import { exportarExcel } from '#lib/excel';
	import ModalEnvio from '#lib/components/ModalEnvio.svelte';

	type EnvioExtendido = EnvioTaller & {
		moviles?: { patente: string; marca?: string; modelo?: string; estado: string };
		reemplazo?: { patente: string } | null;
	};

	let envios = $state<EnvioExtendido[]>([]);
	let cargando = $state(true);
	let error = $state<string | null>(null);
	let f_tipo = $state('Todos');
	let modalAbierto = $state(false);
	let editando = $state<EnvioTaller | null>(null);

	async function cargar() {
		cargando = true;
		error = null;
		const { data, error: e } = await supabase
			.from('envios_taller')
			.select('*, moviles!envios_taller_movil_id_fkey(patente,marca,modelo,estado), reemplazo:moviles!envios_taller_reemplazo_movil_id_fkey(patente)')
			.is('fecha_salida_real', null)
			.order('fecha_ingreso', { ascending: false });
		if (e) error = e.message;
		else envios = (data ?? []) as EnvioExtendido[];
		cargando = false;
	}
	onMount(cargar);

	let filtrados = $derived.by(() =>
		envios.filter((e) => f_tipo === 'Todos' || (e.tipo ?? '') === f_tipo)
	);

	function abrirNuevo() {
		editando = null;
		modalAbierto = true;
	}
	function abrirEdicion(e: EnvioExtendido) {
		editando = e as EnvioTaller;
		modalAbierto = true;
	}

	async function marcarSalida(e: EnvioExtendido) {
		const defecto = formatFechaDMY(new Date().toISOString().slice(0, 10));
		const input = prompt(`Fecha de salida real del móvil ${e.moviles?.patente ?? e.movil_id}:`, defecto);
		if (!input) return;
		const iso = parseFecha(input);
		if (!iso) { alert('Fecha inválida.'); return; }
		await supabase.from('envios_taller').update({ fecha_salida_real: iso }).eq('id', e.id!);
		await supabase.from('moviles').update({ estado: 'Operativo' }).eq('id', e.movil_id);
		cargar();
	}

	function exportar() {
		const filas = filtrados.map((e) => {
			const dias = diasEntre(e.fecha_ingreso, null) ?? 0;
			return {
				Móvil: e.moviles?.patente ?? `#${e.movil_id}`,
				'Marca · Modelo': [e.moviles?.marca, e.moviles?.modelo].filter(Boolean).join(' '),
				Taller: e.taller,
				Tipo: e.tipo ?? '',
				Motivo: e.motivo ?? '',
				'F. envío': formatFechaDMY(e.fecha_ingreso),
				'Días en taller': dias,
				Reemplazo: e.reemplazo?.patente ?? '',
				'Llegada reemplazo': formatFechaDMY(e.reemplazo_fecha_llegada),
				'TCT reemplazo': e.reemplazo_tct ?? '',
				Observaciones: e.observaciones ?? ''
			};
		});
		exportarExcel(filas, 'Taller_envios_activos', 'Taller');
	}

	async function eliminarEnvio(e: EnvioExtendido) {
		if (!confirm(`¿Eliminar este envío?\n\nMóvil ${e.moviles?.patente}, enviado el ${formatFechaDMY(e.fecha_ingreso)}.`))
			return;
		// Si el móvil estaba en taller SOLO por este envío abierto, lo vuelvo a Operativo
		await supabase.from('envios_taller').delete().eq('id', e.id!);
		if (e.moviles?.estado === 'En taller') {
			const { data: otros } = await supabase
				.from('envios_taller').select('id').eq('movil_id', e.movil_id)
				.is('fecha_salida_real', null);
			if (!otros || otros.length === 0) {
				await supabase.from('moviles').update({ estado: 'Operativo' }).eq('id', e.movil_id);
			}
		}
		cargar();
	}
</script>

<div class="space-y-5">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Taller</h1>
			<p class="text-sm text-slate-500 dark:text-slate-400">Envíos activos — móviles en taller ahora</p>
		</div>
		<button onclick={abrirNuevo}
			class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">
			+ Nuevo envío
		</button>
	</div>

	<div class="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
		<label class="text-sm text-slate-600 dark:text-slate-300">
			Tipo:
			<select bind:value={f_tipo}
				class="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
				<option value="Todos">Todos</option>
				{#each TIPOS_ENVIO as t (t)}<option value={t}>{t}</option>{/each}
			</select>
		</label>
		<button
			onclick={exportar}
			disabled={filtrados.length === 0}
			title="Descargar la lista filtrada como Excel"
			class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
				fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
				<polyline points="7 10 12 15 17 10"/>
				<line x1="12" y1="15" x2="12" y2="3"/>
			</svg>
			Excel
		</button>
		<span class="ml-auto text-sm text-slate-500 dark:text-slate-400">
			{filtrados.length} envío{filtrados.length === 1 ? '' : 's'} activo{filtrados.length === 1 ? '' : 's'}
		</span>
	</div>

	{#if cargando}
		<div class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">Cargando…</div>
	{:else if error}
		<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">Error: {error}</div>
	{:else if filtrados.length === 0}
		<div class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
			No hay envíos activos.
		</div>
	{:else}
		<div class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
			<table class="w-full text-xs table-fixed select-none font-table">
				<thead class="bg-slate-700 text-[11px] font-bold text-white uppercase tracking-wide dark:bg-slate-950 dark:text-slate-100">
					<tr>
						<th class="px-1.5 py-2.5 text-center w-20 whitespace-nowrap">Móvil</th>
						<th class="px-1.5 py-2.5 text-center whitespace-nowrap">Taller</th>
						<th class="px-1.5 py-2.5 text-center whitespace-nowrap">Tipo</th>
						<th class="px-1.5 py-2.5 text-center whitespace-nowrap">Motivo</th>
						<th class="px-1.5 py-2.5 text-center w-24 whitespace-nowrap">F. envío</th>
						<th class="px-1.5 py-2.5 text-center w-14 whitespace-nowrap">Días</th>
						<th class="px-1.5 py-2.5 text-center w-20 whitespace-nowrap">Reemplazo</th>
						<th class="px-1.5 py-2.5 text-center w-24 whitespace-nowrap">Llegada rep.</th>
						<th class="px-1.5 py-2.5 text-center w-14 whitespace-nowrap">TCT</th>
						<th class="px-1.5 py-2.5 text-center w-56 whitespace-nowrap">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 dark:divide-slate-800">
					{#each filtrados as e (e.id)}
						{@const dias = diasEntre(e.fecha_ingreso, null) ?? 0}
						{@const rojo = dias > 30}
						<tr class="hover:bg-slate-50 dark:hover:bg-slate-800 {rojo ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-300'}">
							<td class="px-1.5 py-2 text-center align-middle font-mono font-semibold break-words">{e.moviles?.patente ?? `#${e.movil_id}`}</td>
							<td class="px-1.5 py-2 text-center align-middle break-words">{e.taller}</td>
							<td class="px-1.5 py-2 text-center align-middle break-words">{e.tipo ?? '—'}</td>
							<td class="px-1.5 py-2 text-center align-middle break-words">{e.motivo ?? '—'}</td>
							<td class="px-1.5 py-2 text-center align-middle whitespace-nowrap">{formatFechaDMY(e.fecha_ingreso)}</td>
							<td class="px-1.5 py-2 text-center align-middle">{dias}</td>
							<td class="px-1.5 py-2 text-center align-middle break-words">{e.reemplazo?.patente ?? '—'}</td>
							<td class="px-1.5 py-2 text-center align-middle whitespace-nowrap">{formatFechaDMY(e.reemplazo_fecha_llegada) || '—'}</td>
							<td class="px-1.5 py-2 text-center align-middle">{e.reemplazo_tct ?? '—'}</td>
							<td class="px-1.5 py-2 text-center align-middle">
								<div class="inline-flex flex-nowrap items-center justify-center gap-1">
									<button class="rounded-md px-1.5 py-1 text-[11px] whitespace-nowrap text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700" title="Editar" onclick={() => abrirEdicion(e)}>✎ Editar</button>
									<button class="rounded-md px-1.5 py-1 text-[11px] whitespace-nowrap text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40" title="Marcar salida" onclick={() => marcarSalida(e)}>✓ Salida</button>
									<button class="rounded-md px-1.5 py-1 text-[11px] whitespace-nowrap text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/40" title="Eliminar" onclick={() => eliminarEnvio(e)}>🗑 Eliminar</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if modalAbierto}
	<ModalEnvio item={editando}
		onclose={() => (modalAbierto = false)}
		onguardado={() => { modalAbierto = false; cargar(); }} />
{/if}
