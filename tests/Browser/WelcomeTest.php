<?php

declare(strict_types=1);

it('has welcome page', function (): void {
    $page = visit('/');

    $page->assertSee('PlayZone Kids')
        ->assertSee('Memory Match')
        ->assertSee('Pick a game');
});
