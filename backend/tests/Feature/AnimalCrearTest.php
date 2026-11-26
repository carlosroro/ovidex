<?php

namespace Tests\Feature;

use App\Enums\EstadoAnimal;
use App\Models\Animal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Soporte\DatosDeAnimal;
use Tests\Soporte\PeticionesDelFrontend;
use Tests\TestCase;

/**
 * POST /api/animales
 */
class AnimalCrearTest extends TestCase
{
    use DatosDeAnimal, PeticionesDelFrontend, RefreshDatabase;

    private User $usuario;

    protected function setUp(): void
    {
        parent::setUp();

        $this->usuario = $this->entrar();
    }

    /**
     * @param  array<string, mixed>  $cambios
     */
    private function crear(array $cambios = []): TestResponse
    {
        return $this->postJson('/api/animales', $this->datosAnimal($cambios));
    }

    // --- Alta correcta ---------------------------------------------------

    public function test_crea_el_animal_con_el_uuid_recibido(): void
    {
        $id = (string) Str::uuid();

        $respuesta = $this->crear(['id' => $id]);

        $respuesta->assertCreated()
            ->assertJsonPath('data.id', $id)
            ->assertJsonPath('data.codigo_oficial', 'ES000000000001')
            ->assertJsonPath('data.sexo', 'hembra')
            ->assertJsonPath('data.fecha_nacimiento', '2021-03-14');
        $this->assertDatabaseHas('animales', ['id' => $id, 'codigo_oficial' => 'ES000000000001']);
    }

    public function test_un_uuid_en_mayusculas_se_guarda_en_minusculas(): void
    {
        $id = (string) Str::uuid();

        $this->crear(['id' => strtoupper($id)])->assertCreated()->assertJsonPath('data.id', $id);
    }

    public function test_guarda_quien_lo_crea_y_queda_activa_aunque_se_envie_otra_cosa(): void
    {
        $otro = User::factory()->create();

        $respuesta = $this->crear([
            'estado' => 'baja',
            'creado_por' => $otro->id,
            'modificado_por' => $otro->id,
        ]);

        $respuesta->assertCreated()
            ->assertJsonPath('data.estado', 'activa')
            ->assertJsonPath('data.creado_por', ['id' => $this->usuario->id, 'nombre' => $this->usuario->nombre])
            ->assertJsonPath('data.modificado_por.id', $this->usuario->id);

        $animal = Animal::findOrFail($respuesta->json('data.id'));
        $this->assertSame(EstadoAnimal::Activa, $animal->estado);
        $this->assertSame($this->usuario->id, $animal->creado_por);
        $this->assertSame($this->usuario->id, $animal->modificado_por);
    }

    public function test_alta_con_los_datos_minimos(): void
    {
        $datos = [
            'id' => (string) Str::uuid(),
            'codigo_oficial' => 'ES000000000001',
            'tipo_electronico' => 'ninguno',
            'sexo' => 'hembra',
            'precision_nacimiento' => 'desconocida',
            'origen' => 'comprada',
        ];

        $this->postJson('/api/animales', $datos)
            ->assertCreated()
            ->assertJsonPath('data.nombre_o_numero', null)
            ->assertJsonPath('data.raza', null)
            ->assertJsonPath('data.fecha_nacimiento', null)
            ->assertJsonPath('data.madre', null)
            ->assertJsonPath('data.padre', null)
            ->assertJsonPath('data.reproductor', false);
    }

    public function test_un_carnero_reproductor(): void
    {
        $this->crear(['sexo' => 'macho', 'reproductor' => true])
            ->assertCreated()
            ->assertJsonPath('data.reproductor', true);
    }

    // --- Identificador -----------------------------------------------------

    public function test_falta_el_identificador(): void
    {
        $this->crear(['id' => null])
            ->assertJsonValidationErrors(['id' => 'Falta el identificador del animal.']);
    }

    /**
     * @return array<string, array{mixed}>
     */
    public static function identificadoresNoValidos(): array
    {
        return [
            'texto cualquiera' => ['no-es-un-uuid'],
            'número' => [123],
            'UUID incompleto' => ['123e4567-e89b-12d3-a456'],
        ];
    }

    #[DataProvider('identificadoresNoValidos')]
    public function test_el_identificador_tiene_que_ser_un_uuid(mixed $id): void
    {
        $this->crear(['id' => $id])
            ->assertJsonValidationErrors(['id' => 'El identificador del animal no es un UUID válido.']);
        $this->assertSame(0, Animal::count());
    }

    public function test_el_mismo_alta_enviada_dos_veces_no_duplica_el_animal(): void
    {
        $datos = $this->datosAnimal();

        $this->postJson('/api/animales', $datos)->assertCreated();
        $this->postJson('/api/animales', $datos)
            ->assertJsonValidationErrors(['id' => 'Ya existe un animal con ese identificador.']);

        $this->assertSame(1, Animal::count());
    }

    public function test_un_identificador_existente_escrito_en_mayusculas_tambien_esta_repetido(): void
    {
        $existente = Animal::factory()->create();

        $this->crear(['id' => strtoupper($existente->id)])
            ->assertJsonValidationErrors(['id' => 'Ya existe un animal con ese identificador.']);
    }

    // --- Código oficial ----------------------------------------------------

    public function test_normaliza_el_codigo_oficial(): void
    {
        $this->crear(['codigo_oficial' => 'es 0000 0000 0001'])
            ->assertCreated()
            ->assertJsonPath('data.codigo_oficial', 'ES000000000001');
    }

    /**
     * @return array<string, array{string}>
     */
    public static function codigosNoValidos(): array
    {
        return [
            'faltan dígitos' => ['ES 0000 0001'],
            'sobran dígitos' => ['ES0000000000012'],
            'otro país' => ['FR000000000001'],
            'letras en los dígitos' => ['ES00000000000A'],
        ];
    }

    #[DataProvider('codigosNoValidos')]
    public function test_rechaza_un_codigo_con_formato_incorrecto(string $codigo): void
    {
        $this->crear(['codigo_oficial' => $codigo])
            ->assertJsonValidationErrors(['codigo_oficial' => 'El código oficial debe ser ES seguido de 12 dígitos.']);
    }

    public function test_rechaza_un_codigo_repetido_aunque_se_escriba_de_otra_forma(): void
    {
        Animal::factory()->create(['codigo_oficial' => 'ES000000000001']);

        $this->crear(['codigo_oficial' => 'es 0000 0000 0001'])
            ->assertJsonValidationErrors(['codigo_oficial' => 'Ya existe un animal con ese código oficial.']);
    }

    public function test_el_codigo_de_un_animal_de_baja_tambien_cuenta_como_repetido(): void
    {
        Animal::factory()->deBaja()->create(['codigo_oficial' => 'ES000000000001']);

        $this->crear()->assertJsonValidationErrors(['codigo_oficial' => 'Ya existe']);
    }

    // --- Obligatorios y valores permitidos --------------------------------

    public function test_campos_obligatorios(): void
    {
        $respuesta = $this->postJson('/api/animales', ['id' => (string) Str::uuid()]);

        $respuesta->assertJsonValidationErrors([
            'codigo_oficial' => 'Escribe el código oficial.',
            'tipo_electronico' => 'Elige el identificador electrónico.',
            'sexo' => 'Elige el sexo.',
            'precision_nacimiento' => 'Elige qué se sabe de la fecha de nacimiento.',
            'origen' => 'Elige el origen.',
        ]);
    }

    /**
     * @return array<string, array{string, string}>
     */
    public static function valoresNoPermitidos(): array
    {
        return [
            'sexo' => ['sexo', 'otro'],
            'identificador' => ['tipo_electronico', 'chip'],
            'precisión' => ['precision_nacimiento', 'aproximada'],
            'origen' => ['origen', 'regalada'],
        ];
    }

    #[DataProvider('valoresNoPermitidos')]
    public function test_rechaza_valores_no_permitidos(string $campo, string $valor): void
    {
        $this->crear([$campo => $valor])
            ->assertJsonValidationErrors([$campo => 'no es válido']);
    }

    public function test_longitudes_maximas(): void
    {
        $this->crear([
            'nombre_o_numero' => str_repeat('a', 41),
            'raza' => str_repeat('a', 51),
            'notas' => str_repeat('a', 2001),
        ])->assertJsonValidationErrors([
            'nombre_o_numero' => 'no puede tener más de 40 caracteres',
            'raza' => 'no puede tener más de 50 caracteres',
            'notas' => 'no puede tener más de 2000 caracteres',
        ]);
    }

    // --- Fecha de nacimiento ----------------------------------------------

    public function test_normaliza_la_fecha_con_precision_de_mes(): void
    {
        $this->crear(['precision_nacimiento' => 'mes', 'fecha_nacimiento' => '2021-03-14'])
            ->assertCreated()
            ->assertJsonPath('data.fecha_nacimiento', '2021-03-01');
    }

    public function test_normaliza_la_fecha_con_precision_de_anio(): void
    {
        $this->crear(['precision_nacimiento' => 'anio', 'fecha_nacimiento' => '2021-03-14'])
            ->assertCreated()
            ->assertJsonPath('data.fecha_nacimiento', '2021-01-01');
    }

    /**
     * @return array<string, array{string}>
     */
    public static function precisionesConFecha(): array
    {
        return [['exacta'], ['mes'], ['anio']];
    }

    #[DataProvider('precisionesConFecha')]
    public function test_la_fecha_es_obligatoria_salvo_si_es_desconocida(string $precision): void
    {
        $this->crear(['precision_nacimiento' => $precision, 'fecha_nacimiento' => null])
            ->assertJsonValidationErrors(['fecha_nacimiento' => 'Indica la fecha de nacimiento.']);
    }

    public function test_con_fecha_desconocida_no_se_admite_fecha(): void
    {
        $this->crear(['precision_nacimiento' => 'desconocida', 'fecha_nacimiento' => '2021-03-14'])
            ->assertJsonValidationErrors(['fecha_nacimiento' => 'Si la fecha es desconocida, no se indica ninguna fecha.']);
    }

    public function test_rechaza_una_fecha_futura(): void
    {
        $this->crear(['fecha_nacimiento' => today()->addDay()->toDateString()])
            ->assertJsonValidationErrors(['fecha_nacimiento' => 'La fecha de nacimiento no puede ser posterior a hoy.']);
    }

    public function test_rechaza_una_fecha_que_no_existe(): void
    {
        $this->crear(['fecha_nacimiento' => '2021-02-30'])
            ->assertJsonValidationErrors(['fecha_nacimiento' => 'La fecha de nacimiento no es válida.']);
    }

    public function test_con_precision_de_mes_acepta_el_mes_en_curso(): void
    {
        // Aunque se envíe el último día del mes (futuro), se guarda el día 1.
        $this->crear(['precision_nacimiento' => 'mes', 'fecha_nacimiento' => today()->endOfMonth()->toDateString()])
            ->assertCreated()
            ->assertJsonPath('data.fecha_nacimiento', today()->startOfMonth()->toDateString());
    }

    public function test_con_precision_de_mes_rechaza_el_mes_siguiente(): void
    {
        $this->crear([
            'precision_nacimiento' => 'mes',
            'fecha_nacimiento' => today()->addMonthNoOverflow()->startOfMonth()->toDateString(),
        ])->assertJsonValidationErrors(['fecha_nacimiento' => 'posterior a hoy']);
    }

    // --- Madre, padre y reproductor ---------------------------------------

    public function test_madre_y_padre_validos_y_aparecen_en_la_respuesta(): void
    {
        $madre = Animal::factory()->create(['codigo_oficial' => 'ES000000000101', 'nombre_o_numero' => 'Madre de prueba']);
        $padre = Animal::factory()->reproductor()->create(['codigo_oficial' => 'ES000000000102']);

        $this->crear(['madre_id' => $madre->id, 'padre_id' => $padre->id])
            ->assertCreated()
            ->assertJsonPath('data.madre_id', $madre->id)
            ->assertJsonPath('data.madre', [
                'id' => $madre->id,
                'codigo_oficial' => 'ES000000000101',
                'nombre_o_numero' => 'Madre de prueba',
            ])
            ->assertJsonPath('data.padre.codigo_oficial', 'ES000000000102');
    }

    public function test_la_madre_tiene_que_ser_hembra(): void
    {
        $macho = Animal::factory()->macho()->create();

        $this->crear(['madre_id' => $macho->id])
            ->assertJsonValidationErrors(['madre_id' => 'La madre tiene que ser una hembra.']);
    }

    public function test_el_padre_tiene_que_ser_macho(): void
    {
        $hembra = Animal::factory()->create();

        $this->crear(['padre_id' => $hembra->id])
            ->assertJsonValidationErrors(['padre_id' => 'El padre tiene que ser un macho.']);
    }

    public function test_madre_o_padre_inexistentes_dan_un_solo_error(): void
    {
        $respuesta = $this->crear(['madre_id' => (string) Str::uuid(), 'padre_id' => (string) Str::uuid()]);

        $respuesta->assertJsonValidationErrors([
            'madre_id' => 'La madre elegida no existe en el censo.',
            'padre_id' => 'El padre elegido no existe en el censo.',
        ]);
        // Solo "no existe", sin añadir además "tiene que ser hembra/macho".
        $this->assertCount(1, $respuesta->json('errors.madre_id'));
        $this->assertCount(1, $respuesta->json('errors.padre_id'));
    }

    public function test_madre_que_no_es_un_uuid(): void
    {
        $this->crear(['madre_id' => 'no-es-un-uuid'])
            ->assertJsonValidationErrors(['madre_id' => 'no es un identificador válido']);
    }

    public function test_una_madre_de_baja_vale(): void
    {
        $madre = Animal::factory()->deBaja()->create();

        $this->crear(['madre_id' => $madre->id])->assertCreated();
    }

    public function test_una_hembra_no_puede_ser_reproductora(): void
    {
        $this->crear(['reproductor' => true])
            ->assertJsonValidationErrors(['reproductor' => 'Solo los machos pueden marcarse como reproductores.']);
    }

    public function test_sin_el_campo_reproductor_no_es_reproductor(): void
    {
        $datos = $this->datosAnimal(['sexo' => 'macho']);
        unset($datos['reproductor']);

        $this->postJson('/api/animales', $datos)->assertCreated()->assertJsonPath('data.reproductor', false);
    }
}
