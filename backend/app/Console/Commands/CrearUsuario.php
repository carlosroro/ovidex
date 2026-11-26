<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

/**
 * Crea una cuenta de usuario. Es la única forma de crear cuentas:
 * la app no tiene registro público.
 *
 * Uso: php artisan usuarios:crear
 */
class CrearUsuario extends Command
{
    protected $signature = 'usuarios:crear';

    protected $description = 'Crea una cuenta de usuario pidiendo nombre, usuario y contraseña';

    /** Letras minúsculas sin tildes, números, punto, guion y guion bajo; de 3 a 30. */
    public const FORMATO_USUARIO = '/^[a-z0-9._-]{3,30}$/';

    public const LONGITUD_MINIMA_PASSWORD = 8;

    public function handle(): int
    {
        // text() vuelve a preguntar mientras "validate" devuelva un mensaje de error
        $nombre = text(
            label: 'Nombre',
            placeholder: 'Nombre que se mostrará en la app',
            required: 'Escribe un nombre.',
            validate: fn (string $valor) => mb_strlen(trim($valor)) > 255
                ? 'El nombre no puede tener más de 255 caracteres.'
                : null,
        );

        $usuario = text(
            label: 'Usuario',
            placeholder: 'Con este nombre se inicia sesión',
            required: 'Escribe un usuario.',
            validate: fn (string $valor) => $this->validarUsuario($valor),
        );

        $password = $this->pedirPassword();

        $cuenta = User::create([
            'nombre' => trim($nombre),
            'usuario' => $usuario, // el modelo lo guarda en minúsculas
            'password' => $password, // el modelo guarda su hash
        ]);

        $this->components->info("Cuenta creada: {$cuenta->nombre} ({$cuenta->usuario}).");

        return self::SUCCESS;
    }

    /**
     * Devuelve el motivo por el que el usuario no es válido, o null si lo es.
     */
    private function validarUsuario(string $valor): ?string
    {
        $usuario = Str::lower(trim($valor));

        if (! preg_match(self::FORMATO_USUARIO, $usuario)) {
            return 'El usuario debe tener entre 3 y 30 caracteres: letras sin tildes, números, punto, guion o guion bajo.';
        }

        if (User::where('usuario', $usuario)->exists()) {
            return 'Ese usuario ya está en uso.';
        }

        return null;
    }

    /**
     * Pide la contraseña dos veces sin mostrarla. Si no coinciden,
     * vuelve a pedir las dos (la primera podía ser la equivocada).
     */
    private function pedirPassword(): string
    {
        while (true) {
            $password = password(
                label: 'Contraseña',
                required: 'Escribe una contraseña.',
                validate: fn (string $valor) => mb_strlen($valor) < self::LONGITUD_MINIMA_PASSWORD
                    ? 'La contraseña debe tener al menos '.self::LONGITUD_MINIMA_PASSWORD.' caracteres.'
                    : null,
            );

            $repetida = password(label: 'Repite la contraseña', required: 'Repite la contraseña.');

            if ($password === $repetida) {
                return $password;
            }

            $this->components->error('Las contraseñas no coinciden. Vuelve a escribirlas.');
        }
    }
}
