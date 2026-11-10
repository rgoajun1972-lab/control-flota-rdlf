<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { aplicarTema, temaInicial, type Tema } from '#lib/tema';
	import { obtenerEncargadoActual } from '#lib/supabase';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const tabs = [
		{ href: '/', label: 'Flota Titular' },
		{ href: '/reemplazos', label: 'Flota Reemplazos' },
		{ href: '/taller', label: 'Taller' },
		{ href: '/historial', label: 'Historial' },
		{ href: '/catalogos', label: 'Catálogos' }
	];

	let activeHref = $derived(page.url.pathname);
	const isActive = (href: string) =>
		href === '/' ? activeHref === '/' : activeHref.startsWith(href);

	let tema = $state<Tema>('claro');
	let encargado = $state<string | null>(null);
	let cargo = $state<string | null>(null);

	async function recargarEncargado() {
		const e = await obtenerEncargadoActual();
		encargado = e?.nombre ?? null;
		cargo = e?.cargo ?? null;
	}

	onMount(() => {
		tema = temaInicial();
		aplicarTema(tema);
		recargarEncargado();
	});

	// Al volver a la pestaña o cambiar de ruta, refresco por si el usuario editó
	// el encargado desde /catalogos
	let activeHrefPrev = '';
	$effect(() => {
		if (activeHref !== activeHrefPrev) {
			activeHrefPrev = activeHref;
			recargarEncargado();
		}
	});

	function alternarTema() {
		tema = tema === 'claro' ? 'nocturno' : 'claro';
		aplicarTema(tema);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&family=Barlow+Semi+Condensed:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<title>Control de Flota · Ruta de la Fruta</title>
</svelte:head>

<div class="min-h-screen bg-slate-300 text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-100"
	style="font-family: Inter, system-ui, sans-serif;">
	<header class="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
		<div class="mx-auto flex w-full flex-wrap items-center gap-6 px-6 py-5">
			<div class="flex flex-col">
				<div class="flex items-center gap-3">
					<span class="font-brand text-4xl font-extrabold text-sky-900 dark:text-sky-300">Control de Flota</span>
					<svg
						viewBox="0 0 80 70"
						xmlns="http://www.w3.org/2000/svg"
						class="hidden h-14 w-auto sm:inline-block"
						aria-label="Control de Flota"
					>
						<rect x="2" y="2" width="76" height="66" rx="12" fill="#0c4a6e" class="dark:fill-sky-900" />
						<path d="M18 50 A22 22 0 0 1 62 50" stroke="#f8fafc" stroke-width="5" fill="none" stroke-linecap="round" />
						<path d="M18 50 A22 22 0 0 1 22 38" stroke="#38bdf8" stroke-width="5" fill="none" stroke-linecap="round" />
						<path d="M18 50 L23 44 M40 28 L40 33 M62 50 L57 44" stroke="#f8fafc" stroke-width="2" stroke-linecap="round" />
						<line x1="40" y1="50" x2="56" y2="36" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round" />
						<circle cx="40" cy="50" r="3" fill="#f59e0b" />
					</svg>
				</div>
				{#if encargado || cargo}
					<div class="mt-1 space-y-0.5 text-xs leading-tight">
						{#if encargado}
							<div>
								<span class="text-slate-500 dark:text-slate-400">Encargado de Flota:</span>
								<span class="font-semibold text-slate-800 dark:text-slate-200">{encargado}</span>
							</div>
						{/if}
						{#if cargo}
							<div>
								<span class="text-slate-500 dark:text-slate-400">Cargo:</span>
								<span class="font-semibold text-slate-800 dark:text-slate-200">{cargo}</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>
			<nav class="order-3 flex w-full gap-2 overflow-x-auto sm:order-2 sm:ml-12 sm:w-auto">
				{#each tabs as t (t.href)}
					<a
						href={t.href}
						class="rounded-xl px-6 py-3 text-base font-semibold whitespace-nowrap shadow-sm transition
							{isActive(t.href)
								? 'bg-sky-700 text-white dark:bg-sky-600'
								: 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}"
					>
						{t.label}
					</a>
				{/each}
			</nav>
			<div class="order-2 ml-auto flex items-center gap-2 sm:order-3">
				<a
					href="/moviles/nuevo"
					class="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 shadow-sm"
				>
					<span class="text-base">+</span> Nuevo móvil
				</a>
				<button
					onclick={alternarTema}
					aria-label="Cambiar tema"
					title={tema === 'claro' ? 'Cambiar a modo nocturno' : 'Cambiar a modo claro'}
					class="rounded-lg border border-slate-200 bg-white p-2 text-lg text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
				>
					{#if tema === 'claro'}
						<!-- Luna (para activar nocturno) -->
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
							fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
						</svg>
					{:else}
						<!-- Sol (para volver a claro) -->
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
							fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="5"/>
							<line x1="12" y1="1" x2="12" y2="3"/>
							<line x1="12" y1="21" x2="12" y2="23"/>
							<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
							<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
							<line x1="1" y1="12" x2="3" y2="12"/>
							<line x1="21" y1="12" x2="23" y2="12"/>
							<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
							<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
						</svg>
					{/if}
				</button>
			</div>
		</div>
	</header>

	<main class="w-full px-6 py-6">
		{@render children()}
	</main>
</div>
