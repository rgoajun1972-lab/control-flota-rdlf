<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const tabs = [
		{ href: '/', label: 'Flota Titular' },
		{ href: '/reemplazos', label: 'Flota Reemplazos' },
		{ href: '/taller', label: 'Taller' },
		{ href: '/historial', label: 'Historial' },
		{ href: '/dashboard', label: 'Dashboard' }
	];

	let activeHref = $derived(page.url.pathname);
	const isActive = (href: string) =>
		href === '/' ? activeHref === '/' : activeHref.startsWith(href);
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

<div class="min-h-screen bg-slate-50 text-slate-800" style="font-family: Inter, system-ui, sans-serif;">
	<header class="border-b border-slate-200 bg-white">
		<div class="mx-auto flex w-full flex-wrap items-center gap-6 px-6 py-5">
			<div class="flex items-baseline gap-3">
				<span class="font-brand text-3xl text-sky-900">Control de Flota</span>
				<span class="hidden text-sm text-slate-500 sm:inline">· Ruta de la Fruta</span>
			</div>
			<nav class="order-3 flex w-full gap-1 overflow-x-auto sm:order-2 sm:w-auto">
				{#each tabs as t (t.href)}
					<a
						href={t.href}
						class="rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition
							{isActive(t.href)
								? 'bg-sky-700 text-white'
								: 'text-slate-600 hover:bg-slate-100'}"
					>
						{t.label}
					</a>
				{/each}
			</nav>
			<div class="order-2 ml-auto flex items-center gap-3 sm:order-3">
				<a
					href="/moviles/nuevo"
					class="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 shadow-sm"
				>
					<span class="text-base">+</span> Nuevo móvil
				</a>
			</div>
		</div>
	</header>

	<main class="w-full px-6 py-6">
		{@render children()}
	</main>
</div>
