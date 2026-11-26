<?php

namespace App\Http\Resources;

use App\Models\Animal;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Datos de un animal que se envían al frontend.
 *
 * - Se responde dentro de "data": { data: {…} } para un animal y
 *   { data: [ … ] } para la lista.
 * - Los nombres de los campos son los mismos que acepta la API al crear y
 *   editar, para que el formulario pueda reutilizarlos tal cual.
 * - madre, padre, creado_por y modificado_por solo aparecen si el controlador
 *   los ha cargado (whenLoaded): en la ficha sí, en la lista no.
 *
 * @mixin Animal
 */
class AnimalResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'codigo_oficial' => $this->codigo_oficial,
            'tipo_electronico' => $this->tipo_electronico->value,
            'nombre_o_numero' => $this->nombre_o_numero,
            'sexo' => $this->sexo->value,
            'reproductor' => $this->reproductor,
            'raza' => $this->raza,
            'fecha_nacimiento' => $this->fecha_nacimiento?->toDateString(),
            'precision_nacimiento' => $this->precision_nacimiento->value,
            'origen' => $this->origen->value,
            'estado' => $this->estado->value,
            'notas' => $this->notas,
            'madre_id' => $this->madre_id,
            'padre_id' => $this->padre_id,
            'madre' => $this->whenLoaded('madre', fn (?Animal $madre) => self::resumen($madre)),
            'padre' => $this->whenLoaded('padre', fn (?Animal $padre) => self::resumen($padre)),
            'creado_por' => $this->whenLoaded('creador', fn () => $this->creador?->only('id', 'nombre')),
            'modificado_por' => $this->whenLoaded('modificador', fn () => $this->modificador?->only('id', 'nombre')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Lo justo para enlazar a la madre o al padre desde la ficha.
     *
     * @return array{id: string, codigo_oficial: string, nombre_o_numero: ?string}|null
     */
    private static function resumen(?Animal $animal): ?array
    {
        return $animal?->only('id', 'codigo_oficial', 'nombre_o_numero');
    }
}
