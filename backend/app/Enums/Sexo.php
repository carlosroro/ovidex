<?php

namespace App\Enums;

/**
 * Sexo de un animal del censo.
 *
 * Es una enumeración "respaldada" (backed enum): cada caso tiene un valor de
 * texto, que es lo que se guarda en la base de datos y lo que viaja en la API.
 */
enum Sexo: string
{
    case Hembra = 'hembra';
    case Macho = 'macho';
}
