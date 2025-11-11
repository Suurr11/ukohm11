<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $email = 'admin@example.com';
        $password = 'Admin12345';

        $user = User::where('email', $email)->first();

        if (!$user) {
            User::create([
                'name'         => 'Administrator',
                'email'        => $email,
                'password'     => Hash::make($password),
                // jika model User memiliki kolom 'role' & 'otp_verified'
                'role'         => 'admin',
                'otp_verified' => true,
            ]);
        } else {
            $user->name = 'Administrator';
            $user->password = Hash::make($password);
            if (isset($user->role)) $user->role = 'admin';
            if (isset($user->otp_verified)) $user->otp_verified = true;
            $user->save();
        }
    }
}
