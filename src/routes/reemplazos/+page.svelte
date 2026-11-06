<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase, type Movil } from '#lib/supabase';
	import ListadoMoviles from '#lib/components/ListadoMoviles.svelte';

	let moviles = $state<Movil[]>([]);
	let cargando = $state(true);
	let error = $state<string | null>(null);

	async function cargar() {
		cargando = true;
		const { data, error: e } = await supabase
			.from('moviles').select('*').eq('rol', 'Reemplazo')
			.order('patente');
		if (e) error = e.message; else moviles = data ?? [];
		cargando = false;
	}
	onMount(cargar);
</script>

<ListadoMoviles titulo="Flota Reemplazos"
	subtitulo="Móviles de reemplazo que cubren cuando un titular está en taller"
	{moviles} {cargando} {error} modo="reemplazos" oncambio={cargar} />
