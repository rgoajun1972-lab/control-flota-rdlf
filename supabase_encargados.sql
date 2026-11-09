-- ========================================================================
-- Tabla `encargados` para la pestaña "Encargado de Flota" de /catalogos
-- Guarda nombre + cargo en un solo registro. Se muestra el más reciente
-- en el header de la app.
-- ========================================================================
CREATE TABLE IF NOT EXISTS encargados (
	id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nombre  text NOT NULL,
	cargo   text,
	creado  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS encargados_creado_idx ON encargados(creado DESC);
