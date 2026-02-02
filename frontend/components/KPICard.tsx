interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    subtitleColor?: string;
    tags?: { label: string; color: string }[];
    progress?: number;
    progressColor?: string;
}

export function KPICard({
    title,
    value,
    subtitle,
    subtitleColor = 'text-blue-500',
    tags,
    progress,
    progressColor = 'bg-green-500'
}: KPICardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
                {value}
            </p>
            {subtitle && (
                <p className={`text-sm ${subtitleColor}`}>
                    {subtitle}
                </p>
            )}
            {tags && tags.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                    {tags.map((tag, index) => (
                        <span
                            key={index}
                            className={`text-xs px-2 py-1 rounded-full font-medium ${tag.color}`}
                        >
                            {tag.label}
                        </span>
                    ))}
                </div>
            )}
            {progress !== undefined && (
                <div className="mt-3">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${progressColor} rounded-full transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
