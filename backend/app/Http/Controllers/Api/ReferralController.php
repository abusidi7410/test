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

        $referrals = $user->referrals->map(fn ($ref) => [
            'id' => $ref->id,
            'name' => $ref->referred ? $ref->referred->first_name . ' ' . $ref->referred->last_name : 'Unknown',
            'email' => $ref->referred?->email ?? 'unknown',
            'status' => $ref->status->value,
            'earned' => (float) $ref->reward_amount,
            'joined_at' => $ref->created_at->toISOString(),
        ]);

        return $this->successResponse([
            'referral_link' => url('/register?ref=' . $user->referral_code),
            'referral_code' => $user->referral_code,
            'total_earned' => (float) $totalEarnings,
            'total_referrals' => $totalReferrals,
            'completed_referrals' => $completedReferrals,
            'referrals' => $referrals,
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
