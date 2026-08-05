import { Link, usePage } from '@inertiajs/react';
import {
    Bot,
    Clapperboard,
    Film,
    Heart,
    History,
    LayoutGrid,
    MonitorPlay,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth, features } = usePage().props;
    const isEditor = Boolean(auth.user?.is_editor);
    const studioEnabled = Boolean(features?.studio);

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Videos',
            href: '/videos',
            icon: MonitorPlay,
        },
        {
            title: 'Favorites',
            href: '/parent/favorites',
            icon: Heart,
        },
        {
            title: 'Watch progress',
            href: '/parent/progress',
            icon: History,
        },
    ];

    if (isEditor && studioEnabled) {
        mainNavItems.push(
            {
                title: 'Studio',
                href: '/studio',
                icon: Clapperboard,
            },
            {
                title: 'Episodes',
                href: '/studio/episodes',
                icon: Film,
            },
            {
                title: 'Agents',
                href: '/studio/agents',
                icon: Bot,
            },
        );
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
