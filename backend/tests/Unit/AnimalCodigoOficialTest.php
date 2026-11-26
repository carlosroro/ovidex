<?php

namespace Tests\Unit;

use App\Models\Animal;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Normalización del código oficial en el modelo Animal.
 * No necesita base de datos: solo se asigna el valor y se lee.
 */
class AnimalCodigoOficialTest extends TestCase
{
    /**
     * @return array<string, array{string, string}>
     */
    public static function codigos(): array
    {
        return [
            'ya normalizado' => ['ES000000000001', 'ES000000000001'],
            'con espacios' => ['ES 0000 0000 0001', 'ES000000000001'],
            'en minúsculas' => ['es000000000001', 'ES000000000001'],
            'minúsculas y espacios' => ['es 0000 0000 0001', 'ES000000000001'],
            'espacios al principio y al final' => ['  ES000000000001  ', 'ES000000000001'],
            'tabulador' => ["ES0000\t00000001", 'ES000000000001'],
            'espacio duro' => ["ES\u{00A0}0000\u{00A0}0000\u{00A0}0001", 'ES000000000001'],
        ];
    }

    #[DataProvider('codigos')]
    public function test_normaliza_el_codigo_al_asignarlo(string $escrito, string $esperado): void
    {
        $animal = new Animal;
        $animal->codigo_oficial = $escrito;

        $this->assertSame($esperado, $animal->codigo_oficial);
    }

    public function test_tambien_normaliza_al_asignar_en_bloque(): void
    {
        $animal = new Animal(['codigo_oficial' => 'es 0000 0000 0002']);

        $this->assertSame('ES000000000002', $animal->codigo_oficial);
    }

    public function test_un_codigo_nulo_sigue_siendo_nulo(): void
    {
        $this->assertNull(Animal::normalizarCodigo(null));
    }

    public function test_no_corrige_el_formato(): void
    {
        // Normalizar no es validar: un código mal escrito se guarda tal cual
        // (sin espacios y en mayúsculas) y es la validación quien lo rechaza.
        $this->assertSame('FR12', Animal::normalizarCodigo('fr 12'));
    }
}
