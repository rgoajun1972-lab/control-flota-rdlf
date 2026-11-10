<script lang="ts">
	import { onMount } from 'svelte';
	import {
		supabase, AREAS_DEFAULT, LEASINGS_DEFAULT,
		listarCatalogo, combinarCatalogo,
		formatFechaDMY, type Movil
	} from '#lib/supabase';
	import ModalMovil from './ModalMovil.svelte';

	let AREAS = $state<string[]>(AREAS_DEFAULT);
	let LEASINGS = $state<string[]>(LEASINGS_DEFAULT);

	onMount(async () => {
		const [a, l] = await Promise.all([
			listarCatalogo('area'), listarCatalogo('leasing')
		]);
		AREAS = combinarCatalogo(AREAS_DEFAULT, a);
		LEASINGS = combinarCatalogo(LEASINGS_DEFAULT, l);
	});

	interface Props {
		titulo: string;
		subtitulo: string;
		moviles: Movil[];
		cargando: boolean;
		error: string | null;
		modo: 'titular' | 'reemplazos';
		oncambio: () => void;
	}

	let { titulo, subtitulo, moviles, cargando, error, modo, oncambio }: Props = $props();

	let q = $state('');
	let f_area = $state('');
	let f_leasing = $state('');
	let editando = $state<Movil | null>(null);
	let modalAbierto = $state(false);

	let filtrados = $derived.by(() => {
		const busq = q.trim().toLowerCase();
		return moviles.filter((m) => {
			if (f_area && (m.area ?? '') !== f_area) return false;
			if (f_leasing && (m.leasing ?? '') !== f_leasing) return false;
			if (busq) {
				const h = `${m.patente} ${m.area} ${m.marca} ${m.modelo} ${m.color} ${m.leasing} ${m.responsable ?? ''}`.toLowerCase();
				if (!h.includes(busq)) return false;
			}
			return true;
		});
	});

	function abrirEdicion(m: Movil | null) {
		editando = m;
		modalAbierto = true;
	}

	async function eliminar(m: Movil) {
		const { data: enviados } = await supabase
			.from('envios_taller').select('id').eq('movil_id', m.id!);
		const { data: comoRep } = await supabase
			.from('envios_taller').select('id').eq('reemplazo_movil_id', m.id!);
		const nEnv = (enviados ?? []).length;
		const nRep = (comoRep ?? []).length;

		if (nEnv > 0) {
			if (!confirm(
				`⚠️ ${m.patente} tiene ${nEnv} envío(s) a taller en el historial.\n\n` +
				'Si aceptás, se eliminarán PERMANENTEMENTE tanto el móvil como su HISTORIAL completo.\n\n' +
				'Esta acción NO se puede deshacer.\n\n¿Confirmás?'
			)) return;
			await supabase.from('envios_taller').delete().eq('movil_id', m.id!);
		} else {
			let msg = `¿Eliminar el móvil ${m.patente}?`;
			if (nRep > 0)
				msg += `\n\nAviso: aparece como reemplazo en ${nRep} envío(s). Esos envíos van a quedar sin reemplazo asignado.`;
			if (!confirm(msg)) return;
		}
		const { error: e } = await supabase.from('moviles').delete().eq('id', m.id!);
		if (e) alert('No se pudo eliminar: ' + e.message);
		else oncambio();
	}

	function enviarATaller(m: Movil) {
		window.location.href = `/taller/nuevo?movil=${m.id}`;
	}

	function colorEstado(estado: string) {
		switch (estado) {
			case 'Operativo': return 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700';
			case 'Stand by':  return 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700';
			case 'En taller': return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700';
			case 'Baja':      return 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
			default:          return 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600';
		}
	}
</script>

<div class="space-y-5">
	<div>
		<h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{titulo}</h1>
		<p class="text-sm text-slate-500 dark:text-slate-400">{subtitulo}</p>
	</div>

	<div class="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
		<input
			type="search"
			bind:value={q}
			placeholder="Buscar por patente, marca, modelo…"
			class="flex-1 min-w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
		/>
		<select bind:value={f_area} class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
			<option value="">Área: todas</option>
			{#each AREAS as a (a)}<option value={a}>{a}</option>{/each}
		</select>
		<select bind:value={f_leasing} class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
			<option value="">Leasing: todos</option>
			{#each LEASINGS as l (l)}<option value={l}>{l}</option>{/each}
		</select>
	</div>

	{#if cargando}
		<div class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
			Cargando…
		</div>
	{:else if error}
		<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
			Error: {error}
		</div>
	{:else if filtrados.length === 0}
		<div class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
			No hay móviles que coincidan con los filtros.
		</div>
	{:else}
		<div class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
			<table class="w-full text-xs table-fixed select-none font-table">
				<thead class="bg-slate-700 text-[11px] font-bold text-white uppercase tracking-wide dark:bg-slate-950 dark:text-slate-100">
					<tr>
						<th class="px-1.5 py-2.5 text-center w-20 whitespace-nowrap">Patente</th>
						<th class="px-1.5 py-2.5 text-center whitespace-nowrap">Área</th>
						<th class="px-1.5 py-2.5 text-center whitespace-nowrap">Marca · Modelo</th>
						<th class="px-1.5 py-2.5 text-center w-12 whitespace-nowrap">Año</th>
						<th class="px-1.5 py-2.5 text-center whitespace-nowrap">Leasing</th>
						<th class="px-1.5 py-2.5 text-center whitespace-nowrap">Responsable</th>
						<th class="px-1.5 py-2.5 text-center w-20 whitespace-nowrap">Chevron</th>
						<th class="px-1.5 py-2.5 text-center w-24 whitespace-nowrap">Fin Leasing</th>
						<th class="px-1.5 py-2.5 text-center w-24 whitespace-nowrap">Estado</th>
						<th class="px-1.5 py-2.5 text-center w-64 whitespace-nowrap">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 text-slate-800 dark:divide-slate-800 dark:text-slate-200">
					{#each filtrados as m (m.id)}
						<tr class="hover:bg-slate-50 dark:hover:bg-slate-800 {m.estado === 'En taller' ? 'text-slate-400 dark:text-slate-500 opacity-70' : ''}">
							<td class="px-1.5 py-2 text-center align-middle font-mono font-semibold break-words">{m.patente}</td>
							<td class="px-1.5 py-2 text-center align-middle break-words">{m.area ?? '—'}</td>
							<td class="px-1.5 py-2 text-center align-middle break-words">{[m.marca, m.modelo].filter(Boolean).join(' ') || '—'}</td>
							<td class="px-1.5 py-2 text-center align-middle">{m.anio ?? '—'}</td>
							<td class="px-1.5 py-2 text-center align-middle break-words">{m.leasing ?? '—'}</td>
							<td class="px-1.5 py-2 text-center align-middle break-words">{m.responsable ?? '—'}</td>
							<td class="px-1.5 py-2 text-center align-middle">{m.chevron ?? '—'}</td>
							<td class="px-1.5 py-2 text-center align-middle text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatFechaDMY(m.fecha_alta)}</td>
							<td class="px-1.5 py-2 text-center align-middle">
								<span class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap {colorEstado(m.estado)}">
									● {m.estado}
								</span>
							</td>
							<td class="px-1.5 py-2 text-center align-middle">
								<div class="inline-flex flex-nowrap items-center justify-center gap-1">
									<button class="rounded-md px-1.5 py-1 text-[11px] whitespace-nowrap text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed dark:text-slate-300 dark:hover:bg-slate-700"
										title="Editar" onclick={() => abrirEdicion(m)} disabled={m.estado === 'En taller'}>✎ Editar</button>
									<button class="rounded-md px-1.5 py-1 text-[11px] whitespace-nowrap text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
										title="Enviar a taller" onclick={() => enviarATaller(m)}>🔧 A taller</button>
									<button class="rounded-md px-1.5 py-1 text-[11px] whitespace-nowrap text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/40"
										title="Eliminar" onclick={() => eliminar(m)}>🗑 Eliminar</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="text-xs text-slate-500 dark:text-slate-400">
			Mostrando {filtrados.length} de {moviles.length} móviles.
		</p>
	{/if}
</div>

{#if modalAbierto}
	<ModalMovil
		item={editando}
		rolInicial={modo === 'reemplazos' ? 'Reemplazo' : 'Titular'}
		onclose={() => (modalAbierto = false)}
		onguardado={() => { modalAbierto = false; oncambio(); }}
	/>
{/if}
