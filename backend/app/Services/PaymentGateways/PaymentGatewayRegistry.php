<?php

declare(strict_types=1);

namespace App\Services\PaymentGateways;

class PaymentGatewayRegistry
{
    private static ?self $instance = null;

    /** @var array<string, class-string<PaymentGatewayInterface>> */
    private array $adapters = [
        'paystack' => PaystackAdapter::class,
    ];

    private function __construct() {}

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    /**
     * @throws \InvalidArgumentException
     */
    public function getAdapter(string $slug = 'paystack'): PaymentGatewayInterface
    {
        if (!isset($this->adapters[$slug])) {
            throw new \InvalidArgumentException("No payment gateway registered for slug [{$slug}].");
        }

        $class = $this->adapters[$slug];

        return new $class();
    }

    /**
     * Register or replace a gateway adapter.
     *
     * @param class-string<PaymentGatewayInterface> $class
     */
    public function setAdapter(string $slug, string $class): void
    {
        if (!is_subclass_of($class, PaymentGatewayInterface::class)) {
            throw new \InvalidArgumentException(
                "Class [{$class}] must implement " . PaymentGatewayInterface::class
            );
        }

        $this->adapters[$slug] = $class;
    }
}
