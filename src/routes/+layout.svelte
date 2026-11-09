<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { aplicarTema, temaInicial, type Tema } from '#lib/tema';
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
	let logoOk = $state(true);

	onMount(() => {
		tema = temaInicial();
		aplicarTema(tema);
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
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital@1&display=swap"
		rel="stylesheet"
	/>
	<title>Control de Flota · Ruta de la Fruta</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-100"
	style="font-family: Inter, system-ui, sans-serif;">
	<header class="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
		<div class="mx-auto flex w-full flex-wrap items-center gap-6 px-6 py-5">
			<div class="flex items-center gap-3">
				<span class="font-brand text-3xl text-sky-900 dark:text-sky-300">Control de Flota</span>
				{#if logoOk}
					<img
						src="/logo-rdlf.png"
						alt="Ruta de la Fruta"
						class="hidden h-10 w-auto sm:inline-block"
						onerror={() => (logoOk = false)}
					/>
				{:else}
					<span class="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">· Ruta de la Fruta</span>
				{/if}
			</div>
			<nav class="order-3 flex w-full gap-1 overflow-x-auto sm:order-2 sm:w-auto">
				{#each tabs as t (t.href)}
					<a
						href={t.href}
						class="rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition
							{isActive(t.href)
								? 'bg-sky-700 text-white dark:bg-sky-600'
								: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}"
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
