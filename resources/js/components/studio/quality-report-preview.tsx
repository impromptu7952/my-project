import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Check = {
    name?: string;
    passed?: boolean;
    detail?: string;
};

type Props = {
    payload: unknown;
};

export function QualityReportPreview({ payload }: Props) {
    if (!payload || typeof payload !== 'object') {
        return (
            <p className="text-sm text-muted-foreground">
                No quality report yet. Run quality review.
            </p>
        );
    }

    const data = payload as {
        passed?: boolean;
        summary?: string;
        notes?: string;
        checks?: Check[];
        deterministic?: {
            passed?: boolean;
            checks?: Check[];
        };
        agent?: {
            passed?: boolean;
            notes?: string;
            risks?: string[];
        };
    };

    const detChecks = data.deterministic?.checks ?? data.checks ?? [];
    const overall =
        typeof data.passed === 'boolean'
            ? data.passed
            : typeof data.deterministic?.passed === 'boolean'
              ? data.deterministic.passed
              : null;

    return (
        <div className="space-y-2">
            <Card className="gap-2 py-2 shadow-none">
                <CardHeader className="px-2.5 pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">
                            Quality review
                        </CardTitle>
                        {overall === true ? (
                            <Badge>
                                <CheckCircle2 className="size-3" />
                                Passed
                            </Badge>
                        ) : overall === false ? (
                            <Badge variant="destructive">
                                <XCircle className="size-3" />
                                Failed
                            </Badge>
                        ) : (
                            <Badge variant="outline">Pending</Badge>
                        )}
                    </div>
                    {data.summary || data.notes ? (
                        <CardDescription>
                            {data.summary ?? data.notes}
                        </CardDescription>
                    ) : null}
                </CardHeader>
            </Card>

            {detChecks.length > 0 ? (
                <div className="space-y-2">
                    <p className="text-sm font-medium">Deterministic checks</p>
                    {detChecks.map((check, i) => (
                        <div
                            key={i}
                            className={cn(
                                'flex items-start gap-3 rounded-lg border px-3 py-2 text-sm',
                                check.passed === false &&
                                    'border-destructive/40 bg-destructive/5',
                            )}
                        >
                            {check.passed === false ? (
                                <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                            ) : (
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                            )}
                            <div>
                                <p className="font-medium">
                                    {(check.name ?? `check_${i}`).replaceAll(
                                        '_',
                                        ' ',
                                    )}
                                </p>
                                {check.detail ? (
                                    <p className="text-muted-foreground">
                                        {check.detail}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}

            {data.agent?.notes ||
            (Array.isArray(data.agent?.risks) &&
                data.agent.risks.length > 0) ? (
                <Card className="gap-2 py-2 shadow-none">
                    <CardHeader className="px-2.5 pb-0">
                        <CardTitle className="text-sm">Agent notes</CardTitle>
                        {data.agent.notes ? (
                            <CardDescription>
                                {data.agent.notes}
                            </CardDescription>
                        ) : null}
                    </CardHeader>
                    {Array.isArray(data.agent.risks) &&
                    data.agent.risks.length > 0 ? (
                        <CardContent>
                            <ul className="list-inside list-disc space-y-1 text-sm">
                                {data.agent.risks.map((risk) => (
                                    <li key={risk}>{risk}</li>
                                ))}
                            </ul>
                        </CardContent>
                    ) : null}
                </Card>
            ) : null}
        </div>
    );
}
