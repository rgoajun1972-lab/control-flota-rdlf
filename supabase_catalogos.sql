-- ========================================================================
-- Tabla `catalogos` para el menú /catalogos
-- Guarda valores extra para las listas desplegables (áreas, leasings,
-- marcas, motivos de envío). Los valores por defecto siguen en el código.
-- ========================================================================
CREATE TABLE IF NOT EXISTS catalogos (
	id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	tipo    text NOT NULL,
	valor   text NOT NULL,
	creado  timestamp with time zone NOT NULL DEFAULT now(),
	UNIQUE(tipo, valor)
);

CREATE INDEX IF NOT EXISTS catalogos_tipo_idx ON catalogos(tipo);
