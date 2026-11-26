<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

/**
 * Alta de un animal (POST /api/animales).
 *
 * El identificador lo genera el cliente (pensando en las altas sin conexión
 * de la fase 2), así que aquí se exige y se comprueba.
 */
class GuardarAnimalRequest extends DatosAnimalRequest
{
    protected function idDelAnimal(): ?string
    {
        $id = $this->input('id');

        return is_string($id) ? $id : null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $reglas = $this->reglasComunes();

        // UUID obligatorio, con formato válido y que no exista ya. Si el mismo
        // alta llega dos veces, la segunda da 422 y no se duplica el animal.
        $reglas['id'] = ['required', 'uuid', Rule::unique('animales', 'id')];

        $reglas['codigo_oficial'][] = Rule::unique('animales', 'codigo_oficial');

        return $reglas;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'id.required' => 'Falta el identificador del animal.',
            'id.uuid' => 'El identificador del animal no es un UUID válido.',
            'id.unique' => 'Ya existe un animal con ese identificador.',
            ...parent::messages(),
        ];
    }
}
