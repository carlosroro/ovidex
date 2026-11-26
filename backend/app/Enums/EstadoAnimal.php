<?php

namespace App\Enums;

/**
 * Estado de un animal en el censo. Las bajas no se borran: el animal queda
 * archivado con todo su historial.
 */
enum EstadoAnimal: string
{
    case Activa = 'activa';
    case Baja = 'baja';
}
