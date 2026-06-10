<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->controller(AuthController::class)->group(function () {
    Route::get('session', 'session')->name('auth.session');
    Route::post('login', 'login')->middleware('guest')->name('auth.login');
    Route::post('logout', 'logout')->middleware('auth')->name('auth.logout');
    Route::get('users', 'users')->middleware('auth')->name('auth.users');
});

Route::get('{any}', function () {
    return view('app');
})->where('any', '.*');
