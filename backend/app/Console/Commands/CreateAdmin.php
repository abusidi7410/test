<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\AdminRoleEnum;
use App\Models\AdminUser;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CreateAdmin extends Command
{
    protected $signature = 'admin:create
        {--first-name= : First name of the admin}
        {--last-name= : Last name of the admin}
        {--email= : Email address of the admin}
        {--password= : Password for the admin account}
        {--role=super_admin : Role of the admin (super_admin, admin, finance, support)}';

    protected $description = 'Create a new admin user';

    public function handle(): int
    {
        $firstName = $this->option('first-name') ?? $this->ask('First name');
        $lastName = $this->option('last-name') ?? $this->ask('Last name');
        $email = $this->option('email') ?? $this->ask('Email');
        $password = $this->option('password') ?? $this->secret('Password');
        $role = $this->option('role') ?? $this->anticipate('Role', ['super_admin', 'admin', 'finance', 'support']);

        $validator = Validator::make([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'password' => $password,
            'role' => $role,
        ], [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:admin_users'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', Rule::in(array_column(AdminRoleEnum::cases(), 'value'))],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return Command::FAILURE;
        }

        $admin = AdminUser::create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'password' => $password,
            'role' => $role,
            'status' => 'active',
        ]);

        $this->info("Admin user '{$admin->first_name} {$admin->last_name}' ({$admin->email}) created successfully with role: {$admin->role->value}");

        return Command::SUCCESS;
    }
}
