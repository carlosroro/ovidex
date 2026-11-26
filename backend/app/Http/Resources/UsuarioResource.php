<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Datos de un usuario que se envían al frontend.
 * Solo lo necesario: nunca la contraseña ni el token de "recordarme".
 *
 * @mixin User
 */
class UsuarioResource extends JsonResource
{
    /**
     * Sin envoltorio: se responde { id, nombre, usuario } y no { data: {…} }.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'usuario' => $this->usuario,
        ];
    }
}
