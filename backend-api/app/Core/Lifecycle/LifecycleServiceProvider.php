<?php

namespace App\Core\Lifecycle;

use App\Core\BusinessRules\Contracts\BusinessRuleEngineInterface;
use App\Core\Lifecycle\Contracts\LifecycleEngineInterface;
use App\Core\Lifecycle\Contracts\LifecycleHistoryRepositoryInterface;
use App\Core\Lifecycle\Contracts\LifecycleRegistryInterface;
use App\Core\Lifecycle\Engine\LifecycleEngine;
use App\Core\Lifecycle\History\LifecycleHistoryRepository;
use App\Core\Lifecycle\Registry\LifecycleRegistry;
use App\Modules\Bookings\Lifecycle\BookingLifecycleProvider;
use App\Modules\Collections\Lifecycle\CollectionLifecycleProvider;
use App\Modules\Layouts\Lifecycle\LayoutLifecycleProvider;
use App\Modules\Maps\Lifecycle\MapVersionLifecycleProvider;
use App\Modules\Plots\Lifecycle\PlotLifecycleProvider;
use App\Modules\Projects\Lifecycle\ProjectLifecycleProvider;
use Illuminate\Support\ServiceProvider;

class LifecycleServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(LifecycleRegistryInterface::class, function () {
            $registry = new LifecycleRegistry();

            // Register Reference Providers
            $registry->register(new ProjectLifecycleProvider());
            $registry->register(new LayoutLifecycleProvider());
            $registry->register(new MapVersionLifecycleProvider());
            $registry->register(new PlotLifecycleProvider());
            $registry->register(new BookingLifecycleProvider());
            $registry->register(new CollectionLifecycleProvider());

            return $registry;
        });

        $this->app->singleton(LifecycleHistoryRepositoryInterface::class, function () {
            return new LifecycleHistoryRepository();
        });

        $this->app->singleton(LifecycleEngineInterface::class, function ($app) {
            return new LifecycleEngine(
                $app->make(LifecycleRegistryInterface::class),
                $app->make(BusinessRuleEngineInterface::class),
                $app->make(LifecycleHistoryRepositoryInterface::class)
            );
        });
    }

    public function boot(): void
    {
        //
    }
}
