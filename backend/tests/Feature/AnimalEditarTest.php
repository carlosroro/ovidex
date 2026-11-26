<?php

namespace Tests\Feature;

use App\Enums\EstadoAnimal;
use App\Models\Animal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\Soporte\DatosDeAnimal;
use Tests\Soporte\PeticionesDelFrontend;
use Tests\TestCase;

/**
 * PUT /api/animales/{animal}
 */
class AnimalEditarTest extends TestCase
{
    use DatosDeAnimal, PeticionesDelFrontend, RefreshDatabase;

    private User $creador;

    private Animal $oveja;

    protected function setUp(): void
    {
        parent::setUp();

        $this->creador = User::factory()->create();
        $this->oveja = Animal::factory()->create(['codigo_oficial' => 'ES000000000001']);
        $this->oveja->forceFill(['creado_por' => $this->creador->id, 'modificado_por' => $this->creador->id])->save();
    }

    /**
     * Envía los datos del animal con los cambios indicados (PUT envía la
     * ficha completa, como hará el formulario).
     *
     * @param  array<string, mixed>  $cambios
     */
    private function editar(Animal $animal, array $cambios = []): TestResponse
    {
        $datos = $this->datosAnimal(array_merge([
            'codigo_oficial' => $animal->codigo_oficial,
            'sexo' => $animal->sexo->value,
            'reproductor' => $animal->reproductor,
        ], $cambios));
        unset($datos['id']);

        return $this->putJson("/api/animales/{$animal->id}", $datos);
    }

    public function test_edita_y_guarda_quien_lo_modifica_sin_cambiar_quien_lo_creo(): void
    {
        $editor = $this->entrar();

        $this->editar($this->oveja, ['raza' => 'Raza de prueba B'])
            ->assertOk()
            ->assertJsonPath('data.raza', 'Raza de prueba B')
            ->assertJsonPath('data.creado_por.id', $this->creador->id)
            ->assertJsonPath('data.modificado_por', ['id' => $editor->id, 'nombre' => $editor->nombre]);

        $this->oveja->refresh();
        $this->assertSame('Raza de prueba B', $this->oveja->raza);
        $this->assertSame($this->creador->id, $this->oveja->creado_por);
        $this->assertSame($editor->id, $this->oveja->modificado_por);
    }

    public function test_conservar_su_propio_codigo_no_es_repetido(): void
    {
        $this->entrar();

        $this->editar($this->oveja, ['codigo_oficial' => 'es 0000 0000 0001'])->assertOk();
    }

    public function test_puede_corregir_su_codigo(): void
    {
        $this->entrar();

        $this->editar($this->oveja, ['codigo_oficial' => 'ES000000000009'])
            ->assertOk()
            ->assertJsonPath('data.codigo_oficial', 'ES000000000009');
    }

    public function test_no_puede_usar_el_codigo_de_otro_animal(): void
    {
        $this->entrar();
        Animal::factory()->create(['codigo_oficial' => 'ES000000000002']);

        $this->editar($this->oveja, ['codigo_oficial' => 'ES000000000002'])
            ->assertJsonValidationErrors(['codigo_oficial' => 'Ya existe un animal con ese código oficial.']);
    }

    public function test_ignora_el_id_y_el_estado_del_cuerpo(): void
    {
        $this->entrar();
        $datos = $this->datosAnimal(['id' => (string) Str::uuid(), 'estado' => 'baja']);

        $this->putJson("/api/animales/{$this->oveja->id}", $datos)
            ->assertOk()
            ->assertJsonPath('data.id', $this->oveja->id)
            ->assertJsonPath('data.estado', 'activa');

        $this->assertSame(1, Animal::count());
        $this->assertSame(EstadoAnimal::Activa, $this->oveja->refresh()->estado);
    }

    public function test_no_puede_ser_su_propia_madre(): void
    {
        $this->entrar();

        $this->editar($this->oveja, ['madre_id' => $this->oveja->id])
            ->assertJsonValidationErrors(['madre_id' => 'Un animal no puede ser su propia madre.']);
    }

    public function test_no_puede_ser_su_propio_padre(): void
    {
        $this->entrar();
        $carnero = Animal::factory()->reproductor()->create();

        $this->editar($carnero, ['padre_id' => $carnero->id])
            ->assertJsonValidationErrors(['padre_id' => 'Un animal no puede ser su propio padre.']);
    }

    public function test_una_madre_no_puede_pasar_a_macho(): void
    {
        $this->entrar();
        Animal::factory()->create(['madre_id' => $this->oveja->id]);

        $this->editar($this->oveja, ['sexo' => 'macho'])
            ->assertJsonValidationErrors(['sexo' => 'No se puede cambiar el sexo: figura como madre de otros animales.']);

        $this->assertSame('hembra', $this->oveja->refresh()->sexo->value);
    }

    public function test_un_padre_no_puede_pasar_a_hembra(): void
    {
        $this->entrar();
        $carnero = Animal::factory()->reproductor()->create();
        Animal::factory()->create(['padre_id' => $carnero->id]);

        $this->editar($carnero, ['sexo' => 'hembra', 'reproductor' => false])
            ->assertJsonValidationErrors(['sexo' => 'No se puede cambiar el sexo: figura como padre de otros animales.']);
    }

    public function test_sin_descendencia_si_puede_cambiar_de_sexo(): void
    {
        $this->entrar();

        $this->editar($this->oveja, ['sexo' => 'macho'])->assertOk()->assertJsonPath('data.sexo', 'macho');
    }

    public function test_un_carnero_que_pasa_a_hembra_sin_enviar_reproductor_deja_de_serlo(): void
    {
        $this->entrar();
        $carnero = Animal::factory()->reproductor()->create();
        $datos = $this->datosAnimal(['codigo_oficial' => $carnero->codigo_oficial, 'sexo' => 'hembra']);
        unset($datos['id'], $datos['reproductor']);

        $this->putJson("/api/animales/{$carnero->id}", $datos)
            ->assertOk()
            ->assertJsonPath('data.reproductor', false);
    }

    public function test_quitar_la_madre(): void
    {
        $this->entrar();
        $madre = Animal::factory()->create();
        $this->oveja->update(['madre_id' => $madre->id]);

        $this->editar($this->oveja, ['madre_id' => null])->assertOk()->assertJsonPath('data.madre', null);
        $this->assertNull($this->oveja->refresh()->madre_id);
    }

    public function test_las_reglas_del_alta_tambien_se_aplican_al_editar(): void
    {
        $this->entrar();
        $macho = Animal::factory()->macho()->create();

        $this->editar($this->oveja, [
            'codigo_oficial' => 'FR000000000001',
            'madre_id' => $macho->id,
            'precision_nacimiento' => 'desconocida',
            'fecha_nacimiento' => '2021-03-14',
        ])->assertJsonValidationErrors(['codigo_oficial', 'madre_id', 'fecha_nacimiento']);
    }

    public function test_editar_un_animal_que_no_existe_da_404(): void
    {
        $this->entrar();

        $this->putJson('/api/animales/'.Str::uuid(), $this->datosAnimal())->assertNotFound();
    }
}
