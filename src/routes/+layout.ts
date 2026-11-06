// Fuerzo SPA (sin SSR): el programa es un CRUD liviano que anda contra Supabase
// desde el browser; no gana nada con SSR y evita problemas con env vars
// durante el pre-render.
export const ssr = false;
export const prerender = false;
