<?php

namespace Tests\Feature;

use App\Models\Animal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Soporte\DatosDeAnimal;
use Tests\Soporte\PeticionesDelFrontend;
use Tests\TestCase;

/**
 * Protección de las rutas del censo y ausencia de borrado.
 */
class AnimalRutasTest extends TestCase
{
    use DatosDeAnimal, PeticionesDelFrontend, RefreshDatabase;

    public function test_sin_sesion_todas_las_rutas_responden_401(): void
    {
        $animal = Animal::factory()->create();
        $this->comoFrontend();

        $this->getJson('/api/animales')->assertUnauthorized();
        $this->getJson("/api/animales/{$animal->id}")->assertUnauthorized();
        $this->postJson('/api/animales', $this->datosAnimal(['codigo_oficial' => 'ES000000000999']))->assertUnauthorized();
        $this->putJson("/api/animales/{$animal->id}", $this->datosAnimal())->assertUnauthorized();

        // Sin sesión no se ha creado ni cambiado nada.
        $this->assertSame(1, Animal::count());
    }

    public function test_no_se_puede_borrar_un_animal(): void
    {
        $this->entrar();
        $animal = Animal::factory()->create();

        $this->deleteJson("/api/animales/{$animal->id}")->assertMethodNotAllowed();

        $this->assertModelExists($animal);
    }

    public function test_tampoco_se_puede_borrar_la_lista(): void
    {
        $this->entrar();
        Animal::factory()->create();

        $this->deleteJson('/api/animales')->assertMethodNotAllowed();

        $this->assertSame(1, Animal::count());
    }

    public function test_crear_en_la_direccion_de_un_animal_no_existe(): void
    {
        $this->entrar();

        $this->postJson('/api/animales/'.Str::uuid(), $this->datosAnimal())->assertMethodNotAllowed();
    }
}
