<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferralController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user()->load(['referrals.referred', 'referrals.earnings']);

        $totalReferrals = $user->referrals()->count();
        $completedReferrals = $user->referrals()->where('status', 'completed')->count();
        $totalEarnings = $user->referrals()->sum('reward_amount');

        return $this->successResponse([
            'referral_code' => $user->referral_code,
            'total_referrals' => $totalReferrals,
            'completed_referrals' => $completedReferrals,
            'total_earnings' => number_format($totalEarnings, 2),
            'referrals' => $user->referrals,
        ]);
    }

    public function link(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $referralLink = url('/register?ref=' . $user->referral_code);

        return $this->successResponse([
            'referral_code' => $user->referral_code,
            'referral_link' => $referralLink,
        ]);
    }
}
