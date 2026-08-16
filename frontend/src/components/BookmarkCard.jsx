function BookmarkCard({
  bookmark,
  isRetrying,
  isDeleting,
  onRetry,
  onEdit,
  onDelete,
}) {
  return (
    <article className="bookmark-card">
      <div className="bookmark-card-heading">
        <span className={`status-badge status-${bookmark.summary_status}`}>
          {bookmark.summary_status}
        </span>
        <span className="bookmark-id">#{bookmark.id}</span>
      </div>

      <h2>{bookmark.title}</h2>
      {bookmark.description && <p>{bookmark.description}</p>}
      {bookmark.summary && (
        <p className="bookmark-summary">{bookmark.summary}</p>
      )}

      <div className="bookmark-card-actions">
        <a href={bookmark.url} target="_blank" rel="noreferrer">
          Visit page
        </a>
        <div className="card-button-group">
          {bookmark.summary_status === 'failed' && (
            <button type="button" onClick={onRetry} disabled={isRetrying}>
              {isRetrying ? 'Retrying…' : 'Retry summary'}
            </button>
          )}
          <button
            className="neutral-card-button"
            type="button"
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            className="danger-card-button"
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default BookmarkCard
