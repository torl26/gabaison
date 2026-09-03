import type { ReviewStats, ReviewSummary } from '@/lib/reviews/get-reviews';

export function RatingStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);

  return (
    <span aria-label={`5点満点中${rating}点`} className="text-sm">
      {[1, 2, 3, 4, 5].map((value) => (
        <span key={value} className={value <= rounded ? 'text-amber-400' : 'text-border'}>
          ★
        </span>
      ))}
    </span>
  );
}

export function RatingSummary({ stats }: { stats: ReviewStats }) {
  if (stats.average === null) {
    return null;
  }

  return (
    <span className="flex items-center gap-1">
      <RatingStars rating={stats.average} />
      <span className="text-sm font-bold text-foreground">{stats.average.toFixed(1)}</span>
      <span className="text-xs text-muted">({stats.count}件)</span>
    </span>
  );
}

export function ReviewsSection({
  stats,
  reviews,
}: {
  stats: ReviewStats;
  reviews: ReviewSummary[];
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-foreground">レビュー</h2>
        <RatingSummary stats={stats} />
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted">まだレビューはありません。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex items-center gap-2">
                {review.reviewerAvatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={review.reviewerAvatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full border border-border object-cover"
                  />
                )}
                <span className="text-sm font-bold text-foreground">{review.reviewerName}</span>
                <RatingStars rating={review.rating} />
              </div>
              {review.comment && (
                <p className="whitespace-pre-line text-sm text-foreground">{review.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
