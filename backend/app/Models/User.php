<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Str;

/**
 * Usuario de la app.
 *
 * Se mantiene el nombre "User" de Laravel porque la autenticación lo espera
 * así; los campos propios van en castellano (nombre, usuario).
 */
#[Fillable(['nombre', 'usuario', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasUuids;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            // Al asignar la contraseña, Laravel guarda su hash, nunca el texto.
            'password' => 'hashed',
        ];
    }

    /**
     * El usuario se guarda siempre en minúsculas y sin espacios alrededor,
     * para que "Prueba1" y " prueba1 " sean el mismo usuario.
     */
    protected function usuario(): Attribute
    {
        return Attribute::make(
            set: fn (?string $valor) => $valor === null ? null : Str::lower(trim($valor)),
        );
    }
}
