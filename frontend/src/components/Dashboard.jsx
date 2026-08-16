import BookmarkCard from './BookmarkCard'
import BookmarkForm from './BookmarkForm'

function Dashboard({
  bookmarks,
  totalBookmarks,
  hasMore,
  isLoading,
  error,
  searchInput,
  activeSearch,
  showBookmarkForm,
  editingBookmarkId,
  bookmarkUrl,
  bookmarkTitle,
  bookmarkDescription,
  isSaving,
  formError,
  retryingBookmarkId,
  deletingBookmarkId,
  onSearchInputChange,
  onSearch,
  onClearSearch,
  onNewBookmark,
  onBookmarkUrlChange,
  onBookmarkTitleChange,
  onBookmarkDescriptionChange,
  onSaveBookmark,
  onCloseForm,
  onRetrySummary,
  onEditBookmark,
  onDeleteBookmark,
  onLoadMore,
}) {
  return (
    <section className="dashboard" aria-labelledby="dashboard-title">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Your collection</p>
          <h1 id="dashboard-title">Saved bookmarks</h1>
        </div>
        <div className="dashboard-actions">
          <p className="bookmark-count">
            {totalBookmarks} {totalBookmarks === 1 ? 'bookmark' : 'bookmarks'}
          </p>
          <button
            className="primary-button"
            type="button"
            onClick={onNewBookmark}
          >
            New bookmark
          </button>
        </div>
      </div>

      <form className="search-form" onSubmit={onSearch} role="search">
        <label className="visually-hidden" htmlFor="bookmark-search">
          Search bookmark titles
        </label>
        <input
          id="bookmark-search"
          type="search"
          value={searchInput}
          onChange={(event) => onSearchInputChange(event.target.value)}
          placeholder="Search bookmark titles"
        />
        <button className="primary-button" type="submit">
          Search
        </button>
        {activeSearch && (
          <button
            className="secondary-button"
            type="button"
            onClick={onClearSearch}
          >
            Clear
          </button>
        )}
      </form>

      {activeSearch && !isLoading && (
        <p className="search-summary">
          {totalBookmarks} {totalBookmarks === 1 ? 'result' : 'results'} for{' '}
          “{activeSearch}”
        </p>
      )}

      {showBookmarkForm && (
        <BookmarkForm
          isEditing={editingBookmarkId !== null}
          url={bookmarkUrl}
          title={bookmarkTitle}
          description={bookmarkDescription}
          isSaving={isSaving}
          error={formError}
          onUrlChange={onBookmarkUrlChange}
          onTitleChange={onBookmarkTitleChange}
          onDescriptionChange={onBookmarkDescriptionChange}
          onSubmit={onSaveBookmark}
          onClose={onCloseForm}
        />
      )}

      {error && (
        <p className="dashboard-message error-message" role="alert">
          {error}
        </p>
      )}

      {isLoading && bookmarks.length === 0 && (
        <p className="dashboard-message">Loading your bookmarks…</p>
      )}

      {!isLoading && !error && bookmarks.length === 0 && (
        <div className="empty-state">
          {activeSearch ? (
            <>
              <p className="form-label">No matches</p>
              <h2>No bookmark titles match “{activeSearch}”.</h2>
              <p>Try a different search term or clear the current search.</p>
            </>
          ) : (
            <>
              <p className="form-label">Nothing saved yet</p>
              <h2>Your bookmark collection is empty.</h2>
              <p>
                Select New bookmark to save your first useful page. It will
                appear here after the API accepts it.
              </p>
            </>
          )}
        </div>
      )}

      {bookmarks.length > 0 && (
        <div className="bookmark-grid">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              isRetrying={retryingBookmarkId === bookmark.id}
              isDeleting={deletingBookmarkId === bookmark.id}
              onRetry={() => onRetrySummary(bookmark.id)}
              onEdit={() => onEditBookmark(bookmark)}
              onDelete={() => onDeleteBookmark(bookmark)}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="load-more-row">
          <button
            className="secondary-button"
            type="button"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </section>
  )
}

export default Dashboard
