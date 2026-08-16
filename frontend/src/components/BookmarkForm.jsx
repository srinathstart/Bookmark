function BookmarkForm({
  isEditing,
  url,
  title,
  description,
  isSaving,
  error,
  onUrlChange,
  onTitleChange,
  onDescriptionChange,
  onSubmit,
  onClose,
}) {
  return (
    <section
      className="create-bookmark-panel"
      aria-labelledby="create-bookmark-title"
    >
      <div className="create-panel-heading">
        <div>
          <p className="form-label">
            {isEditing ? 'Update saved page' : 'Add to your collection'}
          </p>
          <h2 id="create-bookmark-title">
            {isEditing ? 'Edit bookmark' : 'Create a bookmark'}
          </h2>
        </div>
        <button
          className="close-button inline-close-button"
          type="button"
          aria-label="Close bookmark form"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <form className="register-form bookmark-form" onSubmit={onSubmit}>
        <label htmlFor="bookmark-url">Page URL</label>
        <input
          id="bookmark-url"
          type="url"
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="https://example.com"
          required
        />

        <label htmlFor="bookmark-title">Title</label>
        <input
          id="bookmark-title"
          type="text"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="A useful page"
          maxLength={255}
          required
        />

        <label htmlFor="bookmark-description">
          Description <span className="optional-label">Optional</span>
        </label>
        <textarea
          id="bookmark-description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Why are you saving this page?"
          maxLength={500}
          rows={4}
        />

        <button
          className="primary-button submit-button"
          type="submit"
          disabled={isSaving}
        >
          {isSaving
            ? 'Saving bookmark…'
            : isEditing
              ? 'Save changes'
              : 'Save bookmark'}
        </button>
      </form>

      {error && (
        <p className="form-message error-message" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

export default BookmarkForm
