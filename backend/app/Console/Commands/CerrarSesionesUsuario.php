<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Cierra todas las sesiones de un usuario en todos sus dispositivos.
 * Pensado para cuando se pierde un móvil con la sesión iniciada.
 *
 * Uso: php artisan usuarios:cerrar-sesiones prueba1
 */
class CerrarSesionesUsuario extends Command
{
    protected $signature = 'usuarios:cerrar-sesiones
                            {usuario : Usuario cuyas sesiones se van a cerrar}';

    protected $description = 'Cierra todas las sesiones y anula el "recordarme" de un usuario';

    public function handle(): int
    {
        $usuario = Str::lower(trim($this->argument('usuario')));
        $cuenta = User::where('usuario', $usuario)->first();

        if (! $cuenta) {
            $this->components->error("No existe ningún usuario «{$usuario}».");

            return self::FAILURE;
        }

        // 1. Anular el "recordarme": la cookie del móvil guarda una copia de
        //    remember_token; al cambiarlo, deja de coincidir y Laravel la rechaza.
        $cuenta->forceFill(['remember_token' => Str::random(60)])->save();

        // 2. Borrar sus sesiones. Solo es posible si se guardan en la base de datos.
        if (config('session.driver') !== 'database') {
            $this->components->warn('El "recordarme" se ha anulado, pero las sesiones no se guardan '
                .'en la base de datos (SESSION_DRIVER no es "database") y no se pueden cerrar desde aquí.');

            return self::FAILURE;
        }

        $cerradas = DB::connection(config('session.connection'))
            ->table(config('session.table', 'sessions'))
            ->where('user_id', $cuenta->id)
            ->delete();

        $texto = $cerradas === 1 ? '1 sesión' : "{$cerradas} sesiones";
        $this->components->info("Se han cerrado {$texto} de {$cuenta->usuario} y se ha anulado su \"recordarme\" en todos los dispositivos.");

        return self::SUCCESS;
    }
}
