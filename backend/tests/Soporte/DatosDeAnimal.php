<?php

namespace Tests\Soporte;

use Illuminate\Support\Str;

/**
 * Datos válidos para dar de alta un animal por la API, con un UUID nuevo
 * cada vez. Cada prueba cambia solo lo que quiere comprobar.
 */
trait DatosDeAnimal
{
    /**
     * @param  array<string, mixed>  $cambios
     * @return array<string, mixed>
     */
    protected function datosAnimal(array $cambios = []): array
    {
        return array_merge([
            'id' => (string) Str::uuid(),
            'codigo_oficial' => 'ES000000000001',
            'tipo_electronico' => 'bolo',
            'nombre_o_numero' => 'Prueba 1',
            'sexo' => 'hembra',
            'reproductor' => false,
            'raza' => null,
            'precision_nacimiento' => 'exacta',
            'fecha_nacimiento' => '2021-03-14',
            'origen' => 'nacida',
            'madre_id' => null,
            'padre_id' => null,
            'notas' => null,
        ], $cambios);
    }
}
