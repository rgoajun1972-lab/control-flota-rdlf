<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase, diasEntre, formatFechaDMY,
		type Movil, type EnvioTaller } from '#lib/supabase';

	type Row = EnvioTaller & { moviles?: { patente: string; estado: string } };

	let moviles = $state<Movil[]>([]);
	let envios = $state<Row[]>([]);
	let cargando = $state(true);
	let vista = $state<'tal' | 'op' | 'rep' | 'venc' | 'total'>('tal');

	async function cargar() {
		cargando = true;
		const [m, e] = await Promise.all([
			supabase.from('moviles').select('*').order('patente'),
			supabase.from('envios_taller').select('*, moviles!envios_taller_movil_id_fkey(patente,estado)')
		]);
		moviles = (m.data ?? []) as Movil[];
		envios = (e.data ?? []) as Row[];
		cargando = false;
	}
	onMount(cargar);

	let abiertos = $derived(envios.filter((e) => !e.fecha_salida_real));
	let vencidos = $derived(abiertos.filter((e) => (diasEntre(e.fecha_ingreso, null) ?? 0) > 30));

	let kpi = $derived({
		op: moviles.filter((m) => m.estado === 'Operativo').length,
		tal: moviles.filter((m) => m.estado === 'En taller').length,
		rep: envios.filter((e) => e.reemplazo_movil_id && e.reemplazo_fecha_llegada && !e.reemplazo_fecha_retiro).length,
		venc: vencidos.length,
		total: moviles.length
	});

	// Mini-gráfica: últimos 6 meses de envíos panne vs mantención
	let chart = $derived.by(() => {
		const hoy = new Date();
		const meses: { ym: string; label: string; panne: number; mant: number }[] = [];
		for (let i = 5; i >= 0; i--) {
			const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
			const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
			const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
			meses.push({ ym, label, panne: 0, mant: 0 });
		}
		envios.forEach((e) => {
			if (!e.fecha_ingreso) return;
			const ym = e.fecha_ingreso.slice(0, 7);
			const b = meses.find((m) => m.ym === ym);
			if (!b) return;
			if ((e.tipo ?? '') === 'Panne') b.panne++;
			else if ((e.tipo ?? '') === 'Mantención') b.mant++;
		});
		const max = Math.max(1, ...meses.flatMap((m) => [m.panne, m.mant]));
		return { meses, max };
	});

	// Top 5 móviles con más envíos
	let top5 = $derived.by(() => {
		const conteo = new Map<string, number>();
		envios.forEach((e) => {
			const p = e.moviles?.patente;
			if (p) conteo.set(p, (conteo.get(p) ?? 0) + 1);
		});
		return Array.from(conteo.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);
	});

	// Datos de la vista
	let listaMoviles = $derived.by(() => {
		if (vista === 'op') return moviles.filter((m) => m.estado === 'Operativo');
		if (vista === 'total') return moviles;
		return [];
	});

	let listaEnvios = $derived.by(() => {
		if (vista === 'tal') return abiertos;
		if (vista === 'rep') return envios.filter((e) => e.reemplazo_movil_id && e.reemplazo_fecha_llegada && !e.reemplazo_fecha_retiro);
		if (vista === 'venc') return vencidos;
		return [];
	});

	const kpiCfg = [
		{ key: 'op', label: 'Operativos', color: 'bg-emerald-500', text: 'text-emerald-600' },
		{ key: 'tal', label: 'En taller', color: 'bg-amber-500', text: 'text-amber-600' },
		{ key: 'rep', label: 'Reemplazos activos', color: 'bg-sky-500', text: 'text-sky-600' },
		{ key: 'venc', label: '+30 días', color: 'bg-red-500', text: 'text-red-600' },
		{ key: 'total', label: 'Total flota', color: 'bg-slate-500', text: 'text-slate-600' }
	] as const;
</script>

<div class="space-y-5">
	<div>
		<h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
		<p class="text-sm text-slate-500 dark:text-slate-400">Resumen operativo — click en una tarjeta para ver su detalle</p>
	</div>

	<!-- Tarjetas KPI clickeables -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
		{#each kpiCfg as c (c.key)}
			<button
				onclick={() => (vista = c.key)}
				class="group rounded-xl border bg-white p-4 text-left shadow-sm transition dark:bg-slate-900
					{vista === c.key ? 'border-sky-500 ring-2 ring-sky-200 dark:ring-sky-900' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'}">
				<div class="h-1 w-10 rounded-full {c.color}"></div>
				<div class="mt-3 text-3xl font-semibold {c.text}">{kpi[c.key]}</div>
				<div class="mt-1 text-xs font-medium text-slate-500 uppercase dark:text-slate-400">{c.label}</div>
			</button>
		{/each}
	</div>

	<!-- Mini-gráfica + Top 5 en 2 columnas -->
	<div class="grid gap-3 lg:grid-cols-2">
		<!-- Mini-gráfica mensual -->
		<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
			<h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">Envíos por mes</h3>
			<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
				Últimos 6 meses · <span class="text-red-600 dark:text-red-400">● Panne</span> · <span class="text-sky-600 dark:text-sky-400">● Mantención</span>
			</p>
			<div class="mt-4 flex h-40 items-end gap-3">
				{#each chart.meses as m (m.ym)}
					<div class="flex flex-1 flex-col items-center gap-1">
						<div class="flex h-32 w-full items-end justify-center gap-1">
							<div class="w-3 bg-red-500 rounded-t transition-all"
								style="height: {(m.panne / chart.max) * 100}%"
								title="Panne: {m.panne}"></div>
							<div class="w-3 bg-sky-500 rounded-t transition-all"
								style="height: {(m.mant / chart.max) * 100}%"
								title="Mantención: {m.mant}"></div>
						</div>
						<span class="text-xs text-slate-500 dark:text-slate-400">{m.label}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Top 5 móviles con más envíos -->
		<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
			<h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">Top 5 móviles con más envíos</h3>
			<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Candidatos a revisar</p>
			<ol class="mt-4 space-y-2">
				{#if top5.length === 0}
					<li class="py-6 text-center text-xs italic text-slate-400 dark:text-slate-500">— sin envíos aún —</li>
				{:else}
					{#each top5 as [patente, n], i (patente)}
						<li class="flex items-center gap-3">
							<span class="w-5 text-xs font-bold text-slate-400 dark:text-slate-500">#{i + 1}</span>
							<span class="flex-1 font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{patente}</span>
							<div class="h-2 w-28 rounded-full bg-slate-100 dark:bg-slate-800">
								<div class="h-full rounded-full bg-red-500"
									style="width: {(n / top5[0][1]) * 100}%"></div>
							</div>
							<span class="w-16 text-right text-sm font-bold text-red-600 dark:text-red-400">{n} envíos</span>
						</li>
					{/each}
				{/if}
			</ol>
		</div>
	</div>

	<!-- Detalle según vista -->
	{#if cargando}
		<div class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">Cargando…</div>
	{:else if vista === 'op' || vista === 'total'}
		<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
			<h3 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
				{vista === 'op' ? `Móviles operativos (${listaMoviles.length})` : `Toda la flota (${listaMoviles.length})`}
			</h3>
			{#if listaMoviles.length === 0}
				<p class="py-4 text-center text-sm text-slate-500 dark:text-slate-400">Sin móviles.</p>
			{:else}
				<ul class="divide-y divide-slate-100 text-sm dark:divide-slate-800">
					{#each listaMoviles as m (m.id)}
						<li class="flex items-center gap-4 py-2">
							<span class="w-28 font-mono font-semibold text-slate-800 dark:text-slate-100">{m.patente}</span>
							<span class="flex-1 text-slate-600 dark:text-slate-300">{[m.marca, m.modelo].filter(Boolean).join(' ') || '—'}</span>
							<span class="text-xs text-slate-500 dark:text-slate-400">{m.area ?? '—'}</span>
							<span class="rounded-full border px-2 py-0.5 text-xs text-slate-600 dark:border-slate-600 dark:text-slate-300">● {m.estado}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{:else}
		<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
			<h3 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
				{#if vista === 'tal'}Móviles en taller ({listaEnvios.length})
				{:else if vista === 'rep'}Reemplazos activos ({listaEnvios.length})
				{:else}Envíos +30 días ({listaEnvios.length}){/if}
			</h3>
			{#if listaEnvios.length === 0}
				<p class="py-4 text-center text-sm text-slate-500 dark:text-slate-400">Sin registros.</p>
			{:else}
				<ul class="divide-y divide-slate-100 text-sm dark:divide-slate-800">
					{#each listaEnvios as e (e.id)}
						{@const d = diasEntre(e.fecha_ingreso, e.fecha_salida_real) ?? 0}
						<li class="flex items-center gap-4 py-2">
							<span class="w-28 font-mono font-semibold text-slate-800 dark:text-slate-100">{e.moviles?.patente ?? `#${e.movil_id}`}</span>
							<span class="flex-1 text-slate-600 dark:text-slate-300">{e.taller} · {e.tipo ?? '—'}</span>
							<span class="text-xs text-slate-500 dark:text-slate-400">desde {formatFechaDMY(e.fecha_ingreso)}</span>
							<span class="text-xs font-semibold {d > 30 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-300'}">
								{d} días
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>
