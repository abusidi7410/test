<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('bills:requery-pending')->everyFiveMinutes()->withoutOverlapping();
