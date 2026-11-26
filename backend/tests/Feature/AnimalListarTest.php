<?php

namespace Tests\Feature;

use App\Models\Animal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Soporte\PeticionesDelFrontend;
use Tests\TestCase;

/**
 * GET /api/animales — el censo completo, sin paginar ni filtrar.
 */
class AnimalListarTest extends TestCase
{
    use PeticionesDelFrontend, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->entrar();
    }

    public function test_devuelve_activos_y_de_baja_ordenados_por_codigo(): void
    {
        Animal::factory()->create(['codigo_oficial' => 'ES000000000003']);
        Animal::factory()->deBaja()->create(['codigo_oficial' => 'ES000000000001']);
        Animal::factory()->reproductor()->create(['codigo_oficial' => 'ES000000000002']);

        $respuesta = $this->getJson('/api/animales');

        $respuesta->assertOk();
        $this->assertSame(
            ['ES000000000001', 'ES000000000002', 'ES000000000003'],
            array_column($respuesta->json('data'), 'codigo_oficial'),
        );
        $this->assertSame(['baja', 'activa', 'activa'], array_column($respuesta->json('data'), 'estado'));
    }

    public function test_no_pagina(): void
    {
        Animal::factory()->count(120)->create();

        $respuesta = $this->getJson('/api/animales');

        $respuesta->assertOk()->assertJsonCount(120, 'data');
        $this->assertNull($respuesta->json('meta'));
    }

    public function test_cada_animal_trae_sus_datos_pero_no_las_relaciones(): void
    {
        $madre = Animal::factory()->create(['codigo_oficial' => 'ES000000000001']);
        Animal::factory()->create(['codigo_oficial' => 'ES000000000002', 'madre_id' => $madre->id]);

        $cria = $this->getJson('/api/animales')->json('data.1');

        $this->assertSame($madre->id, $cria['madre_id']);
        foreach (['id', 'codigo_oficial', 'tipo_electronico', 'nombre_o_numero', 'sexo', 'reproductor', 'raza',
            'fecha_nacimiento', 'precision_nacimiento', 'origen', 'estado', 'notas', 'padre_id'] as $campo) {
            $this->assertArrayHasKey($campo, $cria);
        }
        foreach (['madre', 'padre', 'creado_por', 'modificado_por'] as $relacion) {
            $this->assertArrayNotHasKey($relacion, $cria);
        }
    }

    public function test_censo_vacio(): void
    {
        $this->getJson('/api/animales')->assertOk()->assertExactJson(['data' => []]);
    }
}
