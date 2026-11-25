<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class EstadoTest extends TestCase
{
    public function test_devuelve_ok_cuando_la_base_de_datos_responde(): void
    {
        $response = $this->getJson('/api/estado');

        $response
            ->assertStatus(200)
            ->assertExactJson([
                'api' => 'ok',
                'base_datos' => 'ok',
            ]);
    }

    public function test_devuelve_503_sin_detalles_cuando_la_base_de_datos_falla(): void
    {
        // Simulamos una base de datos caída: apuntamos la conexión a un
        // archivo SQLite que no existe y olvidamos la conexión ya abierta.
        config(['database.connections.sqlite.database' => '/ruta/inexistente/prueba.sqlite']);
        DB::purge('sqlite');

        // El fallo se tiene que registrar en el log (y solo ahí).
        Log::shouldReceive('error')->once();

        $response = $this->getJson('/api/estado');

        $response
            ->assertStatus(503)
            ->assertExactJson([
                'api' => 'ok',
                'base_datos' => 'error',
            ]);

        // La respuesta no debe revelar nada de la conexión.
        $this->assertStringNotContainsString('inexistente', $response->getContent());
    }
}
