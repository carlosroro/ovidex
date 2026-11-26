<?php

namespace App\Models;

use App\Enums\EstadoAnimal;
use App\Enums\Origen;
use App\Enums\PrecisionFecha;
use App\Enums\Sexo;
use App\Enums\TipoElectronico;
use Database\Factories\AnimalFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Animal del censo (oveja o carnero).
 *
 * - La tabla se llama "animales": sin el atributo #[Table], Laravel buscaría
 *   "animals", porque forma los plurales en inglés.
 * - HasUuids: la clave es un UUID. Normalmente lo envía el cliente al crear;
 *   si no viene (seeder, factoría), Laravel genera uno.
 * - estado, creado_por y modificado_por NO son asignables en bloque: no se
 *   pueden fijar con los datos de una petición. El controlador los asigna
 *   a mano.
 */
#[Table('animales')]
#[Fillable([
    'id',
    'codigo_oficial',
    'tipo_electronico',
    'nombre_o_numero',
    'sexo',
    'reproductor',
    'raza',
    'fecha_nacimiento',
    'precision_nacimiento',
    'origen',
    'madre_id',
    'padre_id',
    'notas',
])]
class Animal extends Model
{
    /** @use HasFactory<AnimalFactory> */
    use HasFactory, HasUuids;

    /**
     * Conversión automática de columnas: al leer, "sexo" llega como
     * Sexo::Hembra en lugar de como el texto "hembra", la fecha como objeto
     * de fecha (Carbon) y "reproductor" como true/false.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tipo_electronico' => TipoElectronico::class,
            'sexo' => Sexo::class,
            'reproductor' => 'boolean',
            'fecha_nacimiento' => 'date',
            'precision_nacimiento' => PrecisionFecha::class,
            'origen' => Origen::class,
            'estado' => EstadoAnimal::class,
        ];
    }

    /**
     * El código oficial se guarda siempre en mayúsculas y sin espacios:
     * "es 0000 0000 0001" → "ES000000000001". Así da igual cómo se escriba
     * y la comprobación de que no se repite funciona siempre.
     */
    protected function codigoOficial(): Attribute
    {
        return Attribute::make(
            set: fn (?string $valor) => self::normalizarCodigo($valor),
        );
    }

    /**
     * Normaliza un código oficial. Es estática para poder usarla también
     * antes de validar (en los Form Requests), sin tener un animal.
     */
    public static function normalizarCodigo(?string $valor): ?string
    {
        if ($valor === null) {
            return null;
        }

        // \s quita espacios, tabuladores y saltos de línea, y \x{00A0} el
        // "espacio duro" que a veces aparece al copiar y pegar. La "u" final
        // hace que la expresión trabaje con texto UTF-8.
        return mb_strtoupper(preg_replace('/[\s\x{00A0}]+/u', '', $valor));
    }

    /**
     * Madre del animal (otra fila de esta misma tabla).
     *
     * @return BelongsTo<Animal, $this>
     */
    public function madre(): BelongsTo
    {
        return $this->belongsTo(Animal::class, 'madre_id');
    }

    /**
     * Padre del animal (otra fila de esta misma tabla).
     *
     * @return BelongsTo<Animal, $this>
     */
    public function padre(): BelongsTo
    {
        return $this->belongsTo(Animal::class, 'padre_id');
    }

    /**
     * Usuario que dio de alta la ficha.
     *
     * @return BelongsTo<User, $this>
     */
    public function creador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    /**
     * Último usuario que modificó la ficha.
     *
     * @return BelongsTo<User, $this>
     */
    public function modificador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'modificado_por');
    }
}
