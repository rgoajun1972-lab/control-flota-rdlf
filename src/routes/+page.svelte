<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase, type Movil } from '#lib/supabase';
	import ListadoMoviles from '#lib/components/ListadoMoviles.svelte';

	let moviles = $state<Movil[]>([]);
	let cargando = $state(true);
	let error = $state<string | null>(null);

	async function cargar() {
		cargando = true;
		error = null;
		const { data, error: e } = await supabase
			.from('moviles')
			.select('*')
			.or('rol.is.null,rol.neq.Reemplazo')
			.order('patente', { ascending: true });
		if (e) error = e.message;
		else moviles = data ?? [];
		cargando = false;
	}

	onMount(cargar);
</script>

<ListadoMoviles
	titulo="Flota Titular"
	subtitulo="Catálogo de móviles principales de la concesión"
	{moviles}
	{cargando}
	{error}
	modo="titular"
	oncambio={cargar}
/>
