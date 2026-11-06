<script lang="ts">
	import { goto } from '$app/navigation';
	import ModalMovil from '#lib/components/ModalMovil.svelte';

	function volver() {
		goto('/');
	}
</script>

<ModalMovil item={null} rolInicial="Titular" onclose={volver} onguardado={volver} />

<div class="py-10 text-center text-slate-500">Cargando formulario…</div>
