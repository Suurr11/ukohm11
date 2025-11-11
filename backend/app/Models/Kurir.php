<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kurir extends Model
{
    protected $table = 'kurir';

    protected $fillable = [
        'nama', 'kode', 'ongkir', 'aktif',
    ];
}
