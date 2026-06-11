<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemModule;
use Illuminate\Http\JsonResponse;

class SystemModuleController extends Controller
{
    /** List all system modules (read-only reference). */
    public function index(): JsonResponse
    {
        return response()->json(
            SystemModule::where('is_active', true)->orderBy('name')->get()
        );
    }
}
