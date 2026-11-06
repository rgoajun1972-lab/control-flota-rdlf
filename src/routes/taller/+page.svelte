<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase, diasEntre, formatFechaDMY, parseFecha,
		TIPOS_ENVIO, type EnvioTaller, type Movil } from '#lib/supabase';
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
			<h1 class="text-2xl font-semibold text-slate-900">Taller</h1>
			<p class="text-sm text-slate-500">Envíos activos — móviles en taller ahora</p>
		</div>
		<button onclick={abrirNuevo}
			class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">
			+ Nuevo envío
		</button>
	</div>

	<div class="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
		<label class="text-sm text-slate-600">
			Tipo:
			<select bind:value={f_tipo}
				class="ml-2 rounded-lg border border-slate-200 px-2 py-1 text-sm">
				<option value="Todos">Todos</option>
				{#each TIPOS_ENVIO as t (t)}<option value={t}>{t}</option>{/each}
			</select>
		</label>
		<span class="ml-auto text-sm text-slate-500">
			{filtrados.length} envío{filtrados.length === 1 ? '' : 's'} activo{filtrados.length === 1 ? '' : 's'}
		</span>
	</div>

	{#if cargando}
		<div class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">Cargando…</div>
	{:else if error}
		<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Error: {error}</div>
	{:else if filtrados.length === 0}
		<div class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
			No hay envíos activos.
		</div>
	{:else}
		<div class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
			<table class="w-full text-sm select-none">
				<thead class="bg-slate-100 text-xs font-semibold text-slate-600 uppercase">
					<tr>
						<th class="px-3 py-3 text-center whitespace-nowrap">Móvil</th>
						<th class="px-3 py-3 text-center whitespace-nowrap">Taller</th>
						<th class="px-3 py-3 text-center whitespace-nowrap">Tipo</th>
						<th class="px-3 py-3 text-center whitespace-nowrap">Motivo</th>
						<th class="px-3 py-3 text-center whitespace-nowrap">F. envío</th>
						<th class="px-3 py-3 text-center whitespace-nowrap">Días en taller</th>
						<th class="px-3 py-3 text-center whitespace-nowrap">Reemplazo</th>
						<th class="px-3 py-3 text-center whitespace-nowrap">Llegada rep.</th>
						<th class="px-3 py-3 text-center whitespace-nowrap">TCT</th>
						<th class="px-3 py-3 text-center whitespace-nowrap">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each filtrados as e (e.id)}
						{@const dias = diasEntre(e.fecha_ingreso, null) ?? 0}
						{@const rojo = dias > 30}
						<tr class="hover:bg-slate-50 {rojo ? 'text-red-700' : 'text-amber-700'}">
							<td class="px-3 py-3 text-center align-middle whitespace-nowrap font-mono font-semibold">{e.moviles?.patente ?? `#${e.movil_id}`}</td>
							<td class="px-3 py-3 text-center align-middle whitespace-nowrap">{e.taller}</td>
							<td class="px-3 py-3 text-center align-middle whitespace-nowrap">{e.tipo ?? '—'}</td>
							<td class="px-3 py-3 text-center align-middle whitespace-nowrap">{e.motivo ?? '—'}</td>
							<td class="px-3 py-3 text-center align-middle whitespace-nowrap">{formatFechaDMY(e.fecha_ingreso)}</td>
							<td class="px-3 py-3 text-center align-middle whitespace-nowrap">{dias}</td>
							<td class="px-3 py-3 text-center align-middle whitespace-nowrap">{e.reemplazo?.patente ?? '—'}</td>
							<td class="px-3 py-3 text-center align-middle whitespace-nowrap">{formatFechaDMY(e.reemplazo_fecha_llegada) || '—'}</td>
							<td class="px-3 py-3 text-center align-middle whitespace-nowrap">{e.reemplazo_tct ?? '—'}</td>
							<td class="px-3 py-3 text-center align-middle whitespace-nowrap">
								<button class="rounded-md px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
									onclick={() => abrirEdicion(e)}>✎ Editar</button>
								<button class="rounded-md px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
									onclick={() => marcarSalida(e)}>✓ Marcar salida</button>
								<button class="rounded-md px-2 py-1 text-xs text-red-700 hover:bg-red-100"
									onclick={() => eliminarEnvio(e)}>🗑</button>
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
