<?php

namespace App\Http\Controllers;

use App\Enums\EstadoAnimal;
use App\Http\Requests\ActualizarAnimalRequest;
use App\Http\Requests\GuardarAnimalRequest;
use App\Http\Resources\AnimalResource;
use App\Models\Animal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * API del censo: listar, ver, crear y editar animales. No se borran.
 *
 * La validación ya está hecha cuando se llega aquí: si los datos no son
 * válidos, el Form Request responde 422 y el método ni se ejecuta.
 */
class AnimalController extends Controller
{
    /**
     * GET /api/animales — el censo completo, activos y de baja, sin paginar.
     * El frontend busca y filtra sobre esta lista.
     */
    public function index(): AnonymousResourceCollection
    {
        return AnimalResource::collection(
            Animal::orderBy('codigo_oficial')->get()
        );
    }

    /**
     * GET /api/animales/{animal} — un animal con su madre, su padre y quién
     * lo creó y modificó. Laravel busca el animal por el UUID de la dirección
     * (route model binding) y responde 404 si no existe.
     */
    public function show(Animal $animal): AnimalResource
    {
        return new AnimalResource($this->conDetalle($animal));
    }

    /**
     * POST /api/animales — alta con el UUID enviado por el cliente.
     */
    public function store(GuardarAnimalRequest $request): JsonResponse
    {
        // validated() solo trae los campos de las reglas: aunque el cliente
        // envíe "estado" o "creado_por", no llegan aquí.
        $animal = new Animal($request->validated());

        // Esto no se acepta del cliente: se fija aquí.
        $animal->estado = EstadoAnimal::Activa;
        $animal->creado_por = $request->user()->id;
        $animal->modificado_por = $request->user()->id;
        $animal->save();

        return (new AnimalResource($this->conDetalle($animal)))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PUT /api/animales/{animal} — edición. El id y el estado no cambian.
     */
    public function update(ActualizarAnimalRequest $request, Animal $animal): AnimalResource
    {
        $animal->fill($request->validated());
        $animal->modificado_por = $request->user()->id;
        $animal->save();

        return new AnimalResource($this->conDetalle($animal));
    }

    /**
     * Carga lo que muestra la ficha: madre, padre y usuarios de auditoría.
     */
    private function conDetalle(Animal $animal): Animal
    {
        return $animal->load(['madre', 'padre', 'creador', 'modificador']);
    }
}
