<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
</script>

<div class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
	<h1 class="text-2xl font-semibold text-slate-800">Enviar a taller</h1>
	<p class="mt-2 text-sm">
		Formulario de envío (móvil #{page.url.searchParams.get('movil') ?? '—'}) próximamente.
	</p>
	<button
		onclick={() => goto('/')}
		class="mt-4 rounded-md bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
	>
		Volver
	</button>
</div>
