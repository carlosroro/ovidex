<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Soporte\PeticionesDelFrontend;
use Tests\TestCase;

/**
 * GET /api/animales/{animal}
 */
class AnimalVerTest extends TestCase
{
    use PeticionesDelFrontend, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->entrar();
    }

    public function test_devuelve_el_animal_con_su_madre_su_padre_y_la_auditoria(): void
    {
        $autor = User::factory()->create(['nombre' => 'Usuario de Prueba Uno']);
        $madre = Animal::factory()->create(['codigo_oficial' => 'ES000000000001', 'nombre_o_numero' => 'Prueba 1']);
        $padre = Animal::factory()->reproductor()->create(['codigo_oficial' => 'ES000000000002', 'nombre_o_numero' => null]);
        $cria = Animal::factory()->create([
            'codigo_oficial' => 'ES000000000003',
            'madre_id' => $madre->id,
            'padre_id' => $padre->id,
        ]);
        $cria->forceFill(['creado_por' => $autor->id, 'modificado_por' => $autor->id])->save();

        $this->getJson("/api/animales/{$cria->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $cria->id)
            ->assertJsonPath('data.madre', ['id' => $madre->id, 'codigo_oficial' => 'ES000000000001', 'nombre_o_numero' => 'Prueba 1'])
            ->assertJsonPath('data.padre', ['id' => $padre->id, 'codigo_oficial' => 'ES000000000002', 'nombre_o_numero' => null])
            ->assertJsonPath('data.creado_por', ['id' => $autor->id, 'nombre' => 'Usuario de Prueba Uno'])
            ->assertJsonPath('data.modificado_por', ['id' => $autor->id, 'nombre' => 'Usuario de Prueba Uno']);
    }

    public function test_sin_madre_padre_ni_autor_devuelve_nulos(): void
    {
        $animal = Animal::factory()->create();

        $this->getJson("/api/animales/{$animal->id}")
            ->assertOk()
            ->assertJsonPath('data.madre', null)
            ->assertJsonPath('data.padre', null)
            ->assertJsonPath('data.creado_por', null)
            ->assertJsonPath('data.modificado_por', null);
    }

    public function test_un_animal_de_baja_tambien_se_puede_ver(): void
    {
        $animal = Animal::factory()->deBaja()->create();

        $this->getJson("/api/animales/{$animal->id}")->assertOk()->assertJsonPath('data.estado', 'baja');
    }

    public function test_un_animal_inexistente_da_404(): void
    {
        $this->getJson('/api/animales/'.Str::uuid())->assertNotFound();
    }

    public function test_un_identificador_que_no_es_uuid_da_404(): void
    {
        $this->getJson('/api/animales/no-es-un-uuid')->assertNotFound();
    }
}
