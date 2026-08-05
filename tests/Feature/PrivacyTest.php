<?php

declare(strict_types=1);

test('privacy page is public', function (): void {
    $this->get(route('privacy'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('privacy'));
});
