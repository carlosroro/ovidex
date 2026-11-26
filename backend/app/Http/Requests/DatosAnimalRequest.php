<?php

namespace App\Http\Requests;

use App\Enums\Origen;
use App\Enums\PrecisionFecha;
use App\Enums\Sexo;
use App\Enums\TipoElectronico;
use App\Models\Animal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\In;
use Illuminate\Validation\Validator;

/**
 * Reglas comunes al alta (GuardarAnimalRequest) y a la edición
 * (ActualizarAnimalRequest) de un animal.
 *
 * Orden en que Laravel ejecuta un Form Request:
 *   1. prepareForValidation(): se ajustan los datos recibidos (normalizar).
 *   2. rules(): reglas de cada campo por separado.
 *   3. after(): comprobaciones que necesitan varios campos o la base de datos.
 *      Se ejecutan siempre, aunque el paso 2 haya encontrado errores; por eso
 *      cada comprobación se salta si su campo ya tiene un error.
 * Si algo falla, Laravel responde 422 con { message, errors: { campo: [...] } }.
 *
 * Las clases hijas indican el animal que se está guardando con
 * idDelAnimal() y añaden sus reglas propias.
 */
abstract class DatosAnimalRequest extends FormRequest
{
    /**
     * Identificador del animal que se guarda: el recibido en el alta o el de
     * la dirección en la edición. Sirve para impedir que sea su propia madre.
     */
    abstract protected function idDelAnimal(): ?string;

    /**
     * Paso 1: normalizar los datos antes de validarlos.
     */
    protected function prepareForValidation(): void
    {
        $cambios = [];

        // El código se valida (formato y repetido) ya normalizado:
        // "es 0000 0000 0001" y "ES000000000001" son el mismo crotal.
        if (is_string($this->input('codigo_oficial'))) {
            $cambios['codigo_oficial'] = Animal::normalizarCodigo($this->input('codigo_oficial'));
        }

        // Los UUID se comparan en minúsculas: "ABC…" y "abc…" son el mismo.
        foreach (['id', 'madre_id', 'padre_id'] as $campo) {
            if (is_string($this->input($campo))) {
                $cambios[$campo] = strtolower($this->input($campo));
            }
        }

        // Si no se indica, el animal no es reproductor. Así, al pasar un
        // carnero a hembra sin enviar este campo, no queda una "hembra reproductora".
        if (! $this->has('reproductor')) {
            $cambios['reproductor'] = false;
        }

        $fecha = $this->fechaNormalizada();
        if ($fecha !== null) {
            $cambios['fecha_nacimiento'] = $fecha;
        }

        $this->merge($cambios);
    }

    /**
     * Con precisión de mes, la fecha se guarda con el día 1; con precisión de
     * año, como el 1 de enero. Solo se toca si la fecha es válida: si no, se
     * deja tal cual para que la regla de formato dé el error.
     */
    private function fechaNormalizada(): ?string
    {
        $fecha = $this->input('fecha_nacimiento');
        $precision = PrecisionFecha::tryFrom((string) $this->input('precision_nacimiento'));

        if (! is_string($fecha) || ! preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $fecha, $partes)) {
            return null;
        }

        [, $anio, $mes, $dia] = $partes;
        if (! checkdate((int) $mes, (int) $dia, (int) $anio)) {
            return null;
        }

        return match ($precision) {
            PrecisionFecha::Mes => "{$anio}-{$mes}-01",
            PrecisionFecha::Anio => "{$anio}-01-01",
            default => null,
        };
    }

    /**
     * Paso 2: reglas de cada campo. Las hijas añaden "id" (alta) y la regla
     * de código repetido (distinta en alta y edición).
     *
     * @return array<string, mixed>
     */
    protected function reglasComunes(): array
    {
        return [
            // Formato: ES + 12 dígitos, para todos los animales.
            'codigo_oficial' => ['required', 'string', 'regex:/^ES\d{12}$/'],
            'tipo_electronico' => ['required', self::unoDe(TipoElectronico::class)],
            'nombre_o_numero' => ['nullable', 'string', 'max:40'],
            'sexo' => ['required', self::unoDe(Sexo::class)],
            'reproductor' => ['boolean'],
            'raza' => ['nullable', 'string', 'max:50'],
            'precision_nacimiento' => ['required', self::unoDe(PrecisionFecha::class)],
            // Obligatoria salvo con precisión desconocida, y prohibida en ese caso.
            'fecha_nacimiento' => [
                'nullable',
                'required_unless:precision_nacimiento,desconocida',
                'prohibited_if:precision_nacimiento,desconocida',
                'date_format:Y-m-d',
                'before_or_equal:today',
            ],
            'origen' => ['required', self::unoDe(Origen::class)],
            // Que existan se comprueba aquí; que sean hembra/macho, en after().
            'madre_id' => ['nullable', 'uuid', 'exists:animales,id'],
            'padre_id' => ['nullable', 'uuid', 'exists:animales,id'],
            'notas' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Regla "el valor tiene que ser uno de los de esta enumeración".
     *
     * Se usa Rule::in con los valores de la enumeración en lugar de Rule::enum
     * porque Rule::enum no usa los mensajes de messages() y respondería en inglés.
     *
     * @param  class-string<\BackedEnum>  $enumeracion
     */
    private static function unoDe(string $enumeracion): In
    {
        return Rule::in(array_column($enumeracion::cases(), 'value'));
    }

    /**
     * Paso 3: comprobaciones entre campos.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            fn (Validator $validator) => $this->comprobarReproductor($validator),
            fn (Validator $validator) => $this->comprobarProgenitor($validator, 'madre_id', Sexo::Hembra),
            fn (Validator $validator) => $this->comprobarProgenitor($validator, 'padre_id', Sexo::Macho),
        ];
    }

    private function comprobarReproductor(Validator $validator): void
    {
        if ($validator->errors()->hasAny(['reproductor', 'sexo'])) {
            return;
        }

        if ($this->boolean('reproductor') && $this->input('sexo') !== Sexo::Macho->value) {
            $validator->errors()->add('reproductor', 'Solo los machos pueden marcarse como reproductores.');
        }
    }

    /**
     * La madre tiene que ser hembra y el padre macho, y ninguno puede ser el
     * propio animal. Un animal de baja sí vale (una oveja muerta sigue siendo
     * la madre).
     */
    private function comprobarProgenitor(Validator $validator, string $campo, Sexo $sexoEsperado): void
    {
        $id = $this->input($campo);
        // Sin progenitor, o con un error previo (no es UUID, no existe): nada que añadir.
        if ($id === null || $validator->errors()->has($campo)) {
            return;
        }

        $esMadre = $campo === 'madre_id';

        if ($id === $this->idDelAnimal()) {
            $validator->errors()->add($campo, $esMadre
                ? 'Un animal no puede ser su propia madre.'
                : 'Un animal no puede ser su propio padre.');

            return;
        }

        // value() aplica los casts del modelo: devuelve Sexo::Hembra, no 'hembra'.
        $sexo = Animal::whereKey($id)->value('sexo');
        if ($sexo !== $sexoEsperado) {
            $validator->errors()->add($campo, $esMadre
                ? 'La madre tiene que ser una hembra.'
                : 'El padre tiene que ser un macho.');
        }
    }

    /**
     * Mensajes en castellano. Las claves "campo.regla" son para un campo
     * concreto; las que solo llevan la regla valen para cualquier campo y
     * usan el nombre de attributes().
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'codigo_oficial.required' => 'Escribe el código oficial.',
            'codigo_oficial.regex' => 'El código oficial debe ser ES seguido de 12 dígitos.',
            'codigo_oficial.unique' => 'Ya existe un animal con ese código oficial.',
            'tipo_electronico.required' => 'Elige el identificador electrónico.',
            'sexo.required' => 'Elige el sexo.',
            'precision_nacimiento.required' => 'Elige qué se sabe de la fecha de nacimiento.',
            'fecha_nacimiento.required_unless' => 'Indica la fecha de nacimiento.',
            'fecha_nacimiento.prohibited_if' => 'Si la fecha es desconocida, no se indica ninguna fecha.',
            'fecha_nacimiento.date_format' => 'La fecha de nacimiento no es válida.',
            'fecha_nacimiento.before_or_equal' => 'La fecha de nacimiento no puede ser posterior a hoy.',
            'origen.required' => 'Elige el origen.',
            'madre_id.exists' => 'La madre elegida no existe en el censo.',
            'padre_id.exists' => 'El padre elegido no existe en el censo.',

            // Mensajes generales
            'required' => 'Falta :attribute.',
            'string' => ':Attribute tiene que ser un texto.',
            'max' => ':Attribute no puede tener más de :max caracteres.',
            'boolean' => ':Attribute tiene que ser sí o no.',
            'uuid' => ':Attribute no es un identificador válido.',
            'in' => 'El valor elegido en :attribute no es válido.',
        ];
    }

    /**
     * Nombres de los campos en los mensajes generales.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'id' => 'el identificador',
            'codigo_oficial' => 'el código oficial',
            'tipo_electronico' => 'identificador electrónico',
            'nombre_o_numero' => 'el nombre o número',
            'sexo' => 'sexo',
            'reproductor' => 'reproductor',
            'raza' => 'la raza',
            'precision_nacimiento' => 'fecha de nacimiento',
            'fecha_nacimiento' => 'la fecha de nacimiento',
            'origen' => 'origen',
            'madre_id' => 'la madre',
            'padre_id' => 'el padre',
            'notas' => 'las notas',
        ];
    }
}
