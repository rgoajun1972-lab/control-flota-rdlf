<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ModalEnvio from '#lib/components/ModalEnvio.svelte';

	const movilId = (() => {
		const v = page.url.searchParams.get('movil');
		return v ? Number(v) : null;
	})();

	function volver() {
		goto('/taller');
	}
</script>

<ModalEnvio item={null} movilPreseleccionado={movilId}
	onclose={volver} onguardado={volver} />

<div class="py-10 text-center text-slate-500">Cargando formulario…</div>
