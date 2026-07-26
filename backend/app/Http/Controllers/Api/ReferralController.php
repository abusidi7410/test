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
        $user = $request->user()->load([
            'referrals.referred' => fn ($q) => $q->select(['id', 'first_name', 'last_name', 'email']),
            'referrals.earnings',
        ]);

        // Use already-loaded collection instead of 3 separate count/sum queries
        $referrals = $user->referrals;
        $totalReferrals = $referrals->count();
        $completedReferrals = $referrals->where('status.value', 'completed')->count();
        $totalEarnings = $referrals->sum('reward_amount');

        $referralList = $referrals->map(fn ($ref) => [
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
            'referrals' => $referralList,
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
