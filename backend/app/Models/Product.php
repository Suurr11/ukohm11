<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_product',
        'harga',
        'scale_diecast',
        'foto',
        'stock',
        'limited',
        'product_code', // + allow mass-assign
    ];
}
