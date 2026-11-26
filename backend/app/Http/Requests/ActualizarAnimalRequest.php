<?php

namespace App\Http\Requests;

use App\Enums\Sexo;
use App\Models\Animal;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Edición de un animal (PUT /api/animales/{animal}).
 *
 * - El identificador es el de la dirección; si llega otro en el cuerpo, se
 *   ignora (no está en las reglas, así que no forma parte de validated()).
 * - El estado tampoco se puede cambiar aquí (las bajas son otro cambio).
 */
class ActualizarAnimalRequest extends DatosAnimalRequest
{
    /**
     * Animal que se edita. Laravel lo busca a partir de {animal} en la
     * dirección (route model binding).
     */
    private function animal(): Animal
    {
        return $this->route('animal');
    }

    protected function idDelAnimal(): ?string
    {
        return $this->animal()->id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $reglas = $this->reglasComunes();

        // Repetido = lo tiene OTRO animal. Conservar su propio código es válido.
        $reglas['codigo_oficial'][] = Rule::unique('animales', 'codigo_oficial')->ignore($this->animal()->id);

        return $reglas;
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            ...parent::after(),
            fn (Validator $validator) => $this->comprobarCambioDeSexo($validator),
        ];
    }

    /**
     * Si el animal ya figura como madre de otros, no puede pasar a macho (y al
     * revés con el padre): la genealogía quedaría incoherente.
     */
    private function comprobarCambioDeSexo(Validator $validator): void
    {
        if ($validator->errors()->has('sexo')) {
            return;
        }

        $animal = $this->animal();
        $sexoNuevo = Sexo::tryFrom((string) $this->input('sexo'));

        if ($sexoNuevo === $animal->sexo) {
            return;
        }

        if ($sexoNuevo === Sexo::Macho && Animal::where('madre_id', $animal->id)->exists()) {
            $validator->errors()->add('sexo', 'No se puede cambiar el sexo: figura como madre de otros animales.');
        }

        if ($sexoNuevo === Sexo::Hembra && Animal::where('padre_id', $animal->id)->exists()) {
            $validator->errors()->add('sexo', 'No se puede cambiar el sexo: figura como padre de otros animales.');
        }
    }
}
