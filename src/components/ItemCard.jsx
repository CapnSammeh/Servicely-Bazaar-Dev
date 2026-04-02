import { Link } from 'react-router-dom'

const CATEGORY_COLORS = {
  Integrations: 'bg-purple-100 text-purple-700',
  Workflows: 'bg-blue-100 text-blue-700',
  Forms: 'bg-green-100 text-green-700',
  Reports: 'bg-amber-100 text-amber-700',
  Utilities: 'bg-cyan-100 text-cyan-700',
  Other: 'bg-slate-100 text-slate-600',
}

export default function ItemCard({ item }) {
  const categoryStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other
  const initials = item.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <Link
      to={`/item/${item.id}`}
      className="group bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden"
    >
      {/* Card header strip */}
      <div className={`h-1.5 bg-gradient-to-r ${item.status === 'pending' ? 'from-amber-400 to-amber-300' : item.status === 'rejected' ? 'from-red-500 to-red-400' : 'from-blue-500 to-blue-400'}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Icon + category */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-[#0f172a] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {item.status === 'pending' && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                Pending Review
              </span>
            )}
            {item.status === 'rejected' && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                Rejected
              </span>
            )}
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryStyle}`}>
              {item.category}
            </span>
          </div>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-slate-900 text-base leading-snug mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
          {item.name}
        </h3>

        {/* Description */}
        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 flex-1 mb-4">
          {item.description}
        </p>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-xs text-slate-400">+{item.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3 mt-auto">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{item.author}</span>
          </div>
          <span className="font-medium text-slate-500">v{item.latestVersion}</span>
        </div>
      </div>
    </Link>
  )
}

/** Skeleton card shown while loading */
export function ItemCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden animate-pulse">
      <div className="h-1.5 bg-slate-200" />
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-lg bg-slate-200" />
          <div className="w-20 h-6 rounded-full bg-slate-200" />
        </div>
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-5/6" />
        <div className="flex gap-1.5 mt-2">
          <div className="h-5 w-14 rounded-full bg-slate-100" />
          <div className="h-5 w-16 rounded-full bg-slate-100" />
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/3 mt-2" />
      </div>
    </div>
  )
}
