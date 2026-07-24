<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function index(): JsonResponse
    {
        $admins = AdminUser::select([
            'id',
            'uuid',
            'first_name',
            'last_name',
            'email',
            'role',
            'status',
            'last_login_at',
            'created_at',
            'updated_at',
        ])->latest()->get();

        return $this->successResponse(['admins' => $admins]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:admin_users'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'in:super_admin,admin,finance,support'],
        ]);

        $admin = AdminUser::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'],
            'status' => 'active',
        ]);

        return $this->successResponse([
            'admin' => $admin->makeHidden('password'),
        ], 'Admin created successfully.', 201);
    }

    public function show(string $id): JsonResponse
    {
        $admin = AdminUser::find($id);

        if (!$admin) {
            return $this->errorResponse('Admin not found.', 404);
        }

        return $this->successResponse([
            'admin' => $admin->makeHidden('password'),
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $admin = AdminUser::find($id);

        if (!$admin) {
            return $this->errorResponse('Admin not found.', 404);
        }

        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', 'unique:admin_users,email,' . $id],
            'password' => ['sometimes', 'string', 'min:8'],
            'role' => ['sometimes', 'string', 'in:super_admin,admin,finance,support'],
        ]);

        $admin->update($validated);

        return $this->successResponse([
            'admin' => $admin->makeHidden('password'),
        ], 'Admin updated successfully.');
    }

    public function destroy(string $id): JsonResponse
    {
        $admin = AdminUser::find($id);

        if (!$admin) {
            return $this->errorResponse('Admin not found.', 404);
        }

        $admin->delete();

        return $this->successResponse(null, 'Admin deleted successfully.');
    }

    public function suspend(string $id): JsonResponse
    {
        $admin = AdminUser::find($id);

        if (!$admin) {
            return $this->errorResponse('Admin not found.', 404);
        }

        $admin->update(['status' => 'suspended']);

        return $this->successResponse([
            'admin' => $admin->makeHidden('password'),
        ], 'Admin suspended successfully.');
    }

    public function activate(string $id): JsonResponse
    {
        $admin = AdminUser::find($id);

        if (!$admin) {
            return $this->errorResponse('Admin not found.', 404);
        }

        $admin->update(['status' => 'active']);

        return $this->successResponse([
            'admin' => $admin->makeHidden('password'),
        ], 'Admin activated successfully.');
    }
}
