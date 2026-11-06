<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase, diasEntre, formatFechaDMY, TIPOS_ENVIO,
		type EnvioTaller } from '#lib/supabase';

	type Row = EnvioTaller & {
		moviles?: { patente: string; marca?: string; modelo?: string; estado: string };
		reemplazo?: { patente: string } | null;
	};

	let rows = $state<Row[]>([]);
	let cargando = $state(true);
	let error = $state<string | null>(null);
	let f_movil = $state('Todos');
	let f_tipo = $state('Todos');
	let f_anio = $state('Todos');
	let f_estado = $state('Todos');   // Todos / Cerrados / Abiertos
	let q = $state('');

	async function cargar() {
		cargando = true;
		error = null;
		const { data, error: e } = await supabase
			.from('envios_taller')
			.select('*, moviles!envios_taller_movil_id_fkey(patente,marca,modelo,estado), reemplazo:moviles!envios_taller_reemplazo_movil_id_fkey(patente)')
			.order('fecha_ingreso', { ascending: false });
		if (e) error = e.message;
		else rows = (data ?? []) as Row[];
		cargando = false;
	}
	onMount(cargar);

	let patentes = $derived.by(() => {
		const s = new Set<string>();
		rows.forEach((r) => r.moviles?.patente && s.add(r.moviles.patente));
		return Array.from(s).sort();
	});

	let anios = $derived.by(() => {
		const s = new Set<string>();
		rows.forEach((r) => r.fecha_ingreso && s.add(r.fecha_ingreso.slice(0, 4)));
		return Array.from(s).sort().reverse();
	});

	let filtrados = $derived.by(() => {
		const busq = q.trim().toLowerCase();
		return rows.filter((r) => {
			const abierto = !r.fecha_salida_real;
			if (f_movil !== 'Todos' && r.moviles?.patente !== f_movil) return false;
			if (f_tipo !== 'Todos' && (r.tipo ?? '') !== f_tipo) return false;
			if (f_anio !== 'Todos' && (r.fecha_ingreso ?? '').slice(0, 4) !== f_anio) return false;
			if (f_estado === 'Cerrados' && abierto) return false;
			if (f_estado === 'Abiertos' && !abierto) return false;
			if (busq) {
				const h = `${r.moviles?.patente ?? ''} ${r.taller} ${r.tipo ?? ''} ${r.motivo ?? ''}`.toLowerCase();
				if (!h.includes(busq)) return false;
			}
			return true;
		});
	});

	// KPIs
	let kpi = $derived.by(() => {
		const panne = filtrados.filter((r) => (r.tipo ?? '') === 'Panne');
		const mant = filtrados.filter((r) => (r.tipo ?? '') === 'Mantención');
		const prom = (arr: Row[]) => {
			const cerrados = arr.filter((r) => r.fecha_salida_real);
			if (!cerrados.length) return '—';
			const dias = cerrados.reduce((a, r) => a + (diasEntre(r.fecha_ingreso, r.fecha_salida_real!) ?? 0), 0);
			return (dias / cerrados.length).toFixed(1);
		};
		const movsDistintos = new Set(filtrados.map((r) => r.moviles?.patente).filter(Boolean)).size;
		return {
			panne: panne.length,
			mant: mant.length,
			dias_p: prom(panne),
			dias_m: prom(mant),
			mov: movsDistintos
		};
	});

	async function eliminar(r: Row) {
		if (!r.fecha_salida_real) {
			alert(`No se puede eliminar del historial un envío abierto.\n\nEl móvil ${r.moviles?.patente} sigue en taller. Primero cerralo en la pestaña Taller.`);
			return;
		}
		if (!confirm(`Eliminar envío CERRADO del móvil ${r.moviles?.patente}?\n\nEsta acción no se puede deshacer.`))
			return;
		await supabase.from('envios_taller').delete().eq('id', r.id!);
		cargar();
	}

	function estadoTexto(r: Row): string {
		if (!r.fecha_salida_real) return '● En taller';
		return `● ${r.moviles?.estado ?? 'Operativo'}`;
	}

	function colorEstado(r: Row): string {
		if (!r.fecha_salida_real) return 'text-amber-700';
		const e = r.moviles?.estado;
		if (e === 'Baja') return 'text-slate-500';
		if (e === 'Stand by') return 'text-sky-700';
		return 'text-emerald-700';
	}
</script>

<div class="space-y-5">
	<div>
		<h1 class="text-2xl font-semibold text-slate-900">Historial</h1>
		<p class="text-sm text-slate-500">Envíos a taller — todos los registros filtrables</p>
	</div>

	<!-- KPIs -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<div class="text-xs font-medium text-slate-500 uppercase">Envíos por panne</div>
			<div class="mt-1 text-2xl font-semibold text-red-600">{kpi.panne}</div>
		</div>
		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<div class="text-xs font-medium text-slate-500 uppercase">Envíos por mantención</div>
			<div class="mt-1 text-2xl font-semibold text-sky-600">{kpi.mant}</div>
		</div>
		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<div class="text-xs font-medium text-slate-500 uppercase">Días prom · panne</div>
			<div class="mt-1 text-2xl font-semibold text-amber-600">{kpi.dias_p}</div>
		</div>
		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<div class="text-xs font-medium text-slate-500 uppercase">Días prom · mantención</div>
			<div class="mt-1 text-2xl font-semibold text-emerald-600">{kpi.dias_m}</div>
		</div>
		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<div class="text-xs font-medium text-slate-500 uppercase">Móviles con historial</div>
			<div class="mt-1 text-2xl font-semibold text-slate-700">{kpi.mov}</div>
		</div>
	</div>

	<!-- Filtros -->
	<div class="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
		<select bind:value={f_movil}
			class="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500">
			<option value="Todos">Móvil: todos</option>
			{#each patentes as p (p)}<option value={p}>{p}</option>{/each}
		</select>
		<select bind:value={f_tipo}
			class="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500">
			<option value="Todos">Tipo: todos</option>
			{#each TIPOS_ENVIO as t (t)}<option value={t}>{t}</option>{/each}
		</select>
		<select bind:value={f_anio}
			class="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500">
			<option value="Todos">Año: todos</option>
			{#each anios as a (a)}<option value={a}>{a}</option>{/each}
		</select>
		<select bind:value={f_estado}
			class="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500">
			<option value="Todos">Estado: todos</option>
			<option value="Cerrados">Cerrados</option>
			<option value="Abiertos">Abiertos</option>
		</select>
		<input type="search" bind:value={q}
			placeholder="Buscar…"
			class="flex-1 min-w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200" />
	</div>

	{#if cargando}
		<div class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">Cargando…</div>
	{:else if error}
		<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Error: {error}</div>
	{:else if filtrados.length === 0}
		<div class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
			No hay envíos que coincidan con los filtros.
		</div>
	{:else}
		<div class="rounded-xl border border-slate-200 bg-white shadow-sm">
			<table class="w-full text-sm table-fixed select-none">
				<thead class="bg-slate-100 text-xs font-semibold text-slate-600 uppercase">
					<tr>
						<th class="px-2 py-3 text-center w-12">#</th>
						<th class="px-2 py-3 text-center">Móvil</th>
						<th class="px-2 py-3 text-center">Taller</th>
						<th class="px-2 py-3 text-center">Tipo</th>
						<th class="px-2 py-3 text-center">Motivo</th>
						<th class="px-2 py-3 text-center w-24">Ingreso</th>
						<th class="px-2 py-3 text-center w-24">Salida</th>
						<th class="px-2 py-3 text-center w-16">Días</th>
						<th class="px-2 py-3 text-center">Reemplazo</th>
						<th class="px-2 py-3 text-center">Estado</th>
						<th class="px-2 py-3 text-center">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each filtrados as r (r.id)}
						<tr class="hover:bg-slate-50 {colorEstado(r)}">
							<td class="px-2 py-3 text-center align-middle font-mono text-xs">{r.id}</td>
							<td class="px-2 py-3 text-center align-middle font-mono font-semibold break-words">{r.moviles?.patente ?? `#${r.movil_id}`}</td>
							<td class="px-2 py-3 text-center align-middle break-words">{r.taller}</td>
							<td class="px-2 py-3 text-center align-middle break-words">{r.tipo ?? '—'}</td>
							<td class="px-2 py-3 text-center align-middle break-words">{r.motivo ?? '—'}</td>
							<td class="px-2 py-3 text-center align-middle whitespace-nowrap">{formatFechaDMY(r.fecha_ingreso)}</td>
							<td class="px-2 py-3 text-center align-middle whitespace-nowrap">{formatFechaDMY(r.fecha_salida_real) || '—'}</td>
							<td class="px-2 py-3 text-center align-middle">{diasEntre(r.fecha_ingreso, r.fecha_salida_real) ?? '—'}</td>
							<td class="px-2 py-3 text-center align-middle break-words">{r.reemplazo?.patente ?? '—'}</td>
							<td class="px-2 py-3 text-center align-middle whitespace-nowrap">{estadoTexto(r)}</td>
							<td class="px-2 py-3 text-center align-middle">
								<button class="rounded-md px-2 py-1 text-xs text-red-700 hover:bg-red-100" title="Eliminar de historial" onclick={() => eliminar(r)}>🗑</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="text-xs text-slate-500">
			Mostrando {filtrados.length} de {rows.length} envíos.
		</p>
	{/if}
</div>
