<script lang="ts">
	import { onMount } from 'svelte';
	import {
		CATALOGOS, listarCatalogo, agregarCatalogo, editarCatalogo, eliminarCatalogo,
		sembrarCatalogoPorDefecto, type TipoCatalogo, type Catalogo
	} from '#lib/supabase';

	let tipo = $state<TipoCatalogo>('leasing');
	let extras = $state<Catalogo[]>([]);
	let nuevo = $state('');
	let cargando = $state(true);
	let guardando = $state(false);
	let mensaje = $state<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

	// edición inline
	let editandoId = $state<number | null>(null);
	let editValor = $state('');

	let cfg = $derived(CATALOGOS.find((c) => c.tipo === tipo)!);
	let faltantesPorDefecto = $derived(() => {
		const actuales = new Set(extras.map((e) => e.valor));
		return cfg.defaults.filter((d) => !actuales.has(d));
	});

	async function recargar() {
		cargando = true;
		extras = await listarCatalogo(tipo);
		cargando = false;
	}

	onMount(recargar);
	$effect(() => { tipo; recargar(); });

	async function agregar() {
		mensaje = null;
		const v = nuevo.trim();
		if (!v) return;
		if (extras.some((e) => e.valor === v)) {
			mensaje = { tipo: 'err', texto: 'Ese valor ya está en la lista.' };
			return;
		}
		guardando = true;
		const res = await agregarCatalogo(tipo, v);
		guardando = false;
		if (res.error) {
			mensaje = { tipo: 'err', texto: res.error.message };
			return;
		}
		nuevo = '';
		mensaje = { tipo: 'ok', texto: `"${v}" agregado.` };
		await recargar();
	}

	async function eliminar(c: Catalogo) {
		if (!confirm(`¿Eliminar "${c.valor}" del catálogo?\n\nLos móviles ya cargados con este valor NO se modifican, pero no estará más en la lista desplegable.`))
			return;
		const res = await eliminarCatalogo(c.id!);
		if (res.error) {
			mensaje = { tipo: 'err', texto: res.error.message };
			return;
		}
		mensaje = { tipo: 'ok', texto: `"${c.valor}" eliminado.` };
		await recargar();
	}

	function comenzarEdicion(c: Catalogo) {
		mensaje = null;
		editandoId = c.id!;
		editValor = c.valor;
	}

	function cancelarEdicion() {
		editandoId = null;
		editValor = '';
	}

	async function guardarEdicion() {
		if (editandoId === null) return;
		const v = editValor.trim();
		if (!v) {
			mensaje = { tipo: 'err', texto: 'El valor no puede estar vacío.' };
			return;
		}
		const original = extras.find((e) => e.id === editandoId)?.valor;
		if (v === original) { cancelarEdicion(); return; }
		if (extras.some((e) => e.valor === v && e.id !== editandoId)) {
			mensaje = { tipo: 'err', texto: `"${v}" ya existe en la lista.` };
			return;
		}
		const res = await editarCatalogo(editandoId, v);
		if (res.error) {
			mensaje = { tipo: 'err', texto: res.error.message };
			return;
		}
		mensaje = { tipo: 'ok', texto: `"${original}" → "${v}".` };
		cancelarEdicion();
		await recargar();
	}

	async function importarPorDefecto() {
		const faltan = faltantesPorDefecto();
		if (!faltan.length) {
			mensaje = { tipo: 'ok', texto: 'Ya están todos los valores por defecto.' };
			return;
		}
		guardando = true;
		const res = await sembrarCatalogoPorDefecto(tipo, faltan);
		guardando = false;
		if (res.error) {
			mensaje = { tipo: 'err', texto: res.error.message };
			return;
		}
		mensaje = { tipo: 'ok', texto: `${faltan.length} valor(es) importado(s).` };
		await recargar();
	}
</script>

<div class="space-y-5">
	<div>
		<h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Catálogos</h1>
		<p class="text-sm text-slate-500 dark:text-slate-400">
			Editá las listas desplegables que usan los formularios (áreas, leasings, marcas, motivos).
			Todos los valores se pueden modificar o eliminar.
		</p>
	</div>

	<!-- Pestañas de tipo -->
	<div class="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
		{#each CATALOGOS as c (c.tipo)}
			<button
				onclick={() => (tipo = c.tipo)}
				class="rounded-lg px-4 py-2 text-sm font-medium transition
					{tipo === c.tipo
						? 'bg-sky-600 text-white'
						: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}"
			>
				{c.etiqueta}
			</button>
		{/each}
	</div>

	<!-- Agregar nuevo + Importar defaults -->
	<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
		<h3 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
			Agregar valor a {cfg.etiqueta}
		</h3>
		<form class="flex flex-wrap gap-2" onsubmit={(e) => { e.preventDefault(); agregar(); }}>
			<input
				bind:value={nuevo}
				placeholder={`Nuevo valor de ${cfg.etiqueta.toLowerCase()}`}
				class="flex-1 min-w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
			/>
			<button
				type="submit"
				disabled={guardando || !nuevo.trim()}
				class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
			>
				{guardando ? 'Guardando…' : '+ Agregar'}
			</button>
			{#if faltantesPorDefecto().length > 0}
				<button
					type="button"
					onclick={importarPorDefecto}
					disabled={guardando}
					class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
					title="Carga en la base los valores que trae el programa por defecto y aún no están en tu lista"
				>
					↓ Importar {faltantesPorDefecto().length} por defecto
				</button>
			{/if}
		</form>
		{#if mensaje}
			<p class="mt-3 text-xs {mensaje.tipo === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">
				{mensaje.texto}
			</p>
		{/if}
	</div>

	<!-- Lista actual -->
	<div class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
		<div class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
			<h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
				Valores de {cfg.etiqueta} ({extras.length})
			</h3>
		</div>
		{#if cargando}
			<div class="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Cargando…</div>
		{:else if extras.length === 0}
			<div class="space-y-3 p-10 text-center">
				<p class="text-sm text-slate-500 dark:text-slate-400">
					La lista está vacía. Mientras tanto los formularios usan los valores que
					trae el programa por defecto ({cfg.defaults.length}).
				</p>
				<button
					onclick={importarPorDefecto}
					disabled={guardando}
					class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
				>
					↓ Importar valores por defecto
				</button>
			</div>
		{:else}
			<ul class="divide-y divide-slate-100 dark:divide-slate-800">
				{#each extras as c (c.id)}
					{@const editando = editandoId === c.id}
					<li class="flex items-center justify-between gap-3 px-4 py-2.5">
						{#if editando}
							<form
								class="flex flex-1 items-center gap-2"
								onsubmit={(e) => { e.preventDefault(); guardarEdicion(); }}
							>
								<input
									bind:value={editValor}
									class="flex-1 rounded-md border border-sky-400 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none ring-2 ring-sky-200 dark:border-sky-500 dark:bg-slate-800 dark:text-slate-100 dark:ring-sky-900"
								/>
								<button
									type="submit"
									class="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
								>
									Guardar
								</button>
								<button
									type="button"
									onclick={cancelarEdicion}
									class="rounded-md px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
								>
									Cancelar
								</button>
							</form>
						{:else}
							<span class="text-sm text-slate-800 dark:text-slate-100">{c.valor}</span>
							<div class="flex items-center gap-1">
								<button
									onclick={() => comenzarEdicion(c)}
									class="rounded-md px-2 py-1 text-xs text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
									title="Editar"
								>
									✎ Editar
								</button>
								<button
									onclick={() => eliminar(c)}
									class="rounded-md px-2 py-1 text-xs text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/40"
									title="Eliminar"
								>
									🗑 Eliminar
								</button>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
