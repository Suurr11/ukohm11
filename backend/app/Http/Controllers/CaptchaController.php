<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class CaptchaController extends Controller
{
    public function generate()
    {
        $code = strtoupper(Str::random(5));
        $id = (string) Str::uuid();

        $w = 160; $h = 60;
        $img = imagecreatetruecolor($w, $h);

        // background
        $bg = imagecolorallocate($img, 245, 245, 245);
        imagefilledrectangle($img, 0, 0, $w, $h, $bg);

        // noise lines
        for ($i = 0; $i < 8; $i++) {
            $c = imagecolorallocate($img, rand(150, 200), rand(150, 200), rand(150, 200));
            imageline($img, rand(0, $w), rand(0, $h), rand(0, $w), rand(0, $h), $c);
        }

        // draw code
        for ($i = 0; $i < strlen($code); $i++) {
            $x = 20 + $i * 24 + rand(-2, 2);
            $y = 20 + rand(0, 14);
            $col = imagecolorallocate($img, rand(20, 80), rand(20, 80), rand(20, 80));
            imagestring($img, 5, $x, $y, $code[$i], $col);
        }

        ob_start();
        imagepng($img);
        $data = ob_get_clean();
        imagedestroy($img);

        // cache 5 minutes
        Cache::put('captcha:' . $id, $code, now()->addMinutes(5));

        return response()->json([
            'captcha_id' => $id,
            'image' => 'data:image/png;base64,' . base64_encode($data),
        ]);
    }
}
