import { router, usePage } from '@inertiajs/react';
import { useCallback } from 'react';

export type Locale = 'sq' | 'en';

const setCookie = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

export function useLocale() {
    const { locale, availableLocales, translations } = usePage().props as {
        locale: Locale;
        availableLocales: Locale[];
        translations: Record<string, string>;
    };

    const t = useCallback(
        (key: string, fallback?: string): string => {
            return translations?.[key] ?? fallback ?? key;
        },
        [translations],
    );

    const setLocale = useCallback((next: Locale) => {
        setCookie('locale', next);
        try {
            localStorage.setItem('locale', next);
        } catch {
            // ignore
        }
        router.reload({ only: [] });
    }, []);

    const toggleLocale = useCallback(() => {
        setLocale(locale === 'sq' ? 'en' : 'sq');
    }, [locale, setLocale]);

    return {
        locale,
        availableLocales: availableLocales ?? ['sq', 'en'],
        translations: translations ?? {},
        t,
        setLocale,
        toggleLocale,
    } as const;
}
