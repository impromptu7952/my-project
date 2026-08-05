import { Head, Link } from '@inertiajs/react';
import { useLocale } from '@/hooks/use-locale';
import { home } from '@/routes';

export default function Privacy() {
    const { t, locale } = useLocale();

    const isSq = locale === 'sq';

    return (
        <>
            <Head title={t('privacy.title', 'Privacy')} />
            <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-fuchsia-50">
                <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
                    <Link
                        href={home()}
                        className="mb-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow"
                    >
                        ← {t('games.home', 'Home')}
                    </Link>

                    <h1 className="mb-4 text-3xl font-black text-slate-900 sm:text-4xl">
                        {isSq
                            ? 'Privatësia për fëmijët e vegjël'
                            : 'Privacy for little ones'}
                    </h1>
                    <p className="mb-8 text-sm font-medium text-slate-500">
                        PlayZone Kids · ages 1–3 · parent-operated
                    </p>

                    <div className="space-y-6 rounded-3xl bg-white p-6 shadow-lg sm:p-8">
                        {isSq ? (
                            <>
                                <section>
                                    <h2 className="mb-2 text-xl font-black text-slate-900">
                                        Për kë është llogaria?
                                    </h2>
                                    <p className="font-medium text-slate-600">
                                        Llogaritë janë vetëm për prindër / kujdestarë.
                                        Fëmijët nuk krijojnë llogari dhe nuk kenë
                                        kredenciale. Pajisja zakonisht përdoret nga
                                        i rrituri; fëmija shikon ose luan bashkë.
                                    </p>
                                </section>
                                <section>
                                    <h2 className="mb-2 text-xl font-black text-slate-900">
                                        Pa reklama, pa rrjete sociale
                                    </h2>
                                    <p className="font-medium text-slate-600">
                                        Nuk shfaqim reklama. Nuk ka komente, chat, ose
                                        përmbajtje të krijuar nga fëmijë. Nuk gjurmojmë
                                        sjelljen e fëmijës për marketing.
                                    </p>
                                </section>
                                <section>
                                    <h2 className="mb-2 text-xl font-black text-slate-900">
                                        Video e parë-palës (first-party)
                                    </h2>
                                    <p className="font-medium text-slate-600">
                                        Video e pilotit luhet me lojtar HTML5 në
                                        serverin tonë (MP4). Nuk përdorim YouTube ose
                                        Vimeo për pilotin — kështu shmangim gjurmimin e
                                        palëve të treta në përvojën e shikimit.
                                    </p>
                                </section>
                                <section>
                                    <h2 className="mb-2 text-xl font-black text-slate-900">
                                        Të dhënat
                                    </h2>
                                    <p className="font-medium text-slate-600">
                                        Nëse krijoni llogari prindi, mbajmë email dhe
                                        emrin për autentifikim. Favoritet dhe
                                        progresi i shikimit (opsionale) lidhen me
                                        llogarinë e prindit. Nuk kërkojmë të dhëna të
                                        fëmijës.
                                    </p>
                                </section>
                                <section>
                                    <h2 className="mb-2 text-xl font-black text-slate-900">
                                        Gjuha
                                    </h2>
                                    <p className="font-medium text-slate-600">
                                        Përmbajtja e videos është në shqipe letrare
                                        standarde. Ndërfaqja e prindit mund të jetë
                                        shqip ose anglisht.
                                    </p>
                                </section>
                                <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                                    Ky është tekst draft produkti. Pronari i politikës
                                    ligjore (këshilltari) duhet ta rishikojë para
                                    marketingut publik.
                                </p>
                            </>
                        ) : (
                            <>
                                <section>
                                    <h2 className="mb-2 text-xl font-black text-slate-900">
                                        Who is the account for?
                                    </h2>
                                    <p className="font-medium text-slate-600">
                                        Accounts are for parents / caregivers only.
                                        Children do not create accounts or hold
                                        credentials. Devices are parent-operated;
                                        toddlers co-view and co-play.
                                    </p>
                                </section>
                                <section>
                                    <h2 className="mb-2 text-xl font-black text-slate-900">
                                        No ads, no social
                                    </h2>
                                    <p className="font-medium text-slate-600">
                                        We do not show ads. There are no comments,
                                        chat, or child-generated content. We do not
                                        track toddler behavior for marketing.
                                    </p>
                                </section>
                                <section>
                                    <h2 className="mb-2 text-xl font-black text-slate-900">
                                        First-party media
                                    </h2>
                                    <p className="font-medium text-slate-600">
                                        Pilot videos play via our HTML5 player from
                                        our storage (MP4). We do not embed YouTube or
                                        Vimeo for the pilot, avoiding third-party
                                        player tracking on the watch experience.
                                    </p>
                                </section>
                                <section>
                                    <h2 className="mb-2 text-xl font-black text-slate-900">
                                        Data we keep
                                    </h2>
                                    <p className="font-medium text-slate-600">
                                        Parent accounts store email and name for
                                        authentication. Optional favorites and watch
                                        progress attach to the parent account. We do
                                        not ask for child personal data.
                                    </p>
                                </section>
                                <section>
                                    <h2 className="mb-2 text-xl font-black text-slate-900">
                                        Language
                                    </h2>
                                    <p className="font-medium text-slate-600">
                                        Video dialogue uses standard literary
                                        Albanian. Parent chrome may be Albanian or
                                        English.
                                    </p>
                                </section>
                                <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                                    Draft product language. Legal counsel must review
                                    before public marketing launch.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
