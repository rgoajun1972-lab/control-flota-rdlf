import { browser } from '$app/environment';

export type Tema = 'claro' | 'nocturno';

const KEY = 'control-flota-tema';

export function temaInicial(): Tema {
	if (!browser) return 'claro';
	try {
		const t = localStorage.getItem(KEY);
		if (t === 'claro' || t === 'nocturno') return t;
	} catch {}
	return 'claro';
}

export function aplicarTema(t: Tema) {
	if (!browser) return;
	const html = document.documentElement;
	if (t === 'nocturno') html.classList.add('dark');
	else html.classList.remove('dark');
	try { localStorage.setItem(KEY, t); } catch {}
}
