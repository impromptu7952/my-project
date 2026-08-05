import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Bot,
    Clapperboard,
    Film,
    LayoutDashboard,
    ListTree,
} from 'lucide-react';
import type { ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

const studioNav = [
    { title: 'Overview', href: '/studio', icon: LayoutDashboard },
    { title: 'Specs', href: '/studio/specs', icon: ListTree },
    { title: 'Episodes', href: '/studio/episodes', icon: Film },
    { title: 'Agents', href: '/studio/agents', icon: Bot },
    { title: 'Brand', href: '/studio/brand', icon: BookOpen },
] as const;

export default function StudioLayout({
    children,
    breadcrumbs = [],
}: {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}) {
    const { url } = usePage();

    return (
        <SidebarProvider defaultOpen={false}>
            <Sidebar collapsible="icon" variant="sidebar" className="border-r">
                <SidebarHeader className="h-10 justify-center p-1.5">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                size="sm"
                                asChild
                                tooltip="Studio"
                                className="data-[slot=sidebar-menu-button]:p-1.5!"
                            >
                                <Link href="/studio" prefetch>
                                    <AppLogoIcon className="size-4 fill-current" />
                                    <span className="font-semibold">
                                        Studio
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
                <SidebarContent className="gap-0 px-1 py-1">
                    <SidebarMenu className="gap-0.5">
                        {studioNav.map((item) => {
                            const active =
                                item.href === '/studio'
                                    ? url === '/studio' ||
                                      url.startsWith('/studio/runs')
                                    : url === item.href ||
                                      url.startsWith(`${item.href}/`);

                            return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        size="sm"
                                        isActive={active}
                                        tooltip={item.title}
                                        className="h-8"
                                    >
                                        <Link href={item.href} prefetch>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="p-1.5">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                size="sm"
                                tooltip="Consumer app"
                                className="h-8"
                            >
                                <Link href="/">
                                    <Clapperboard />
                                    <span>PlayZone</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                    <NavUser />
                </SidebarFooter>
            </Sidebar>

            <SidebarInset className="max-h-svh min-h-0 overflow-hidden">
                <header className="flex h-9 shrink-0 items-center gap-2 border-b bg-background px-2">
                    <SidebarTrigger className="-ml-0.5 size-7" />
                    <div className="min-w-0 flex-1 truncate text-xs">
                        {breadcrumbs.length > 0 ? (
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        ) : (
                            <span className="font-medium text-muted-foreground">
                                Studio workbench
                            </span>
                        )}
                    </div>
                    <nav className="hidden items-center gap-0.5 md:flex">
                        {studioNav.map((item) => {
                            const active =
                                item.href === '/studio'
                                    ? url === '/studio'
                                    : url.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    prefetch
                                    className={cn(
                                        'rounded px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
                                        active &&
                                            'bg-muted text-foreground',
                                    )}
                                >
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </header>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
