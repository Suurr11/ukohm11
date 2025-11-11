<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Product;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats()
    {
        $totalProducts = Product::count();
        $totalUsers = User::count();
        $totalLimited = Product::where('limited', 1)->count();
        $totalStock = Product::sum('stock');

        return response()->json([
            'total_products' => $totalProducts,
            'total_users' => $totalUsers,
            'total_limited' => $totalLimited,
            'total_stock' => $totalStock,
        ]);
    }
}
