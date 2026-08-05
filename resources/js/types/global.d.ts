import type { Auth } from '@/types/auth';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            locale: 'sq' | 'en';
            availableLocales: Array<'sq' | 'en'>;
            translations: Record<string, string>;
            features: {
                videos: boolean;
                studio: boolean;
                toddlerHome: boolean;
            };
            [key: string]: unknown;
        };
    }
}
