<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration {
    public function up(): void
    {
        $email = 'suryasetiawan402@gmail.com';
        $now   = now();

        $data = [
            'name'          => 'Administrator',
            'email'         => $email,
            'password'      => Hash::make('12312345'),
            'role'          => 'admin',
            'otp_verified'  => true,
            'otp'           => null,
            'created_at'    => $now,
            'updated_at'    => $now,
        ];

        $exists = DB::table('users')->where('email', $email)->first();

        if ($exists) {
            DB::table('users')->where('id', $exists->id)->update([
                'name'         => $data['name'],
                'password'     => $data['password'],
                'role'         => $data['role'],
                'otp_verified' => $data['otp_verified'],
                'otp'          => $data['otp'],
                'updated_at'   => $now,
            ]);
        } else {
            DB::table('users')->insert($data);
        }
    }

    public function down(): void
    {
        DB::table('users')->where('email', 'suryasetiawan402@gmail.com')->delete();
    }
};
