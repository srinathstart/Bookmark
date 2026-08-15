import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://127.0.0.1:8000'
const PAGE_SIZE = 6

function App() {
  const [activeForm, setActiveForm] = useState(null)
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [bookmarks, setBookmarks] = useState([])
  const [totalBookmarks, setTotalBookmarks] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false)
  const [bookmarkError, setBookmarkError] = useState('')
  const [bookmarkUrl, setBookmarkUrl] = useState('')
  const [bookmarkTitle, setBookmarkTitle] = useState('')
  const [bookmarkDescription, setBookmarkDescription] = useState('')
  const [isCreatingBookmark, setIsCreatingBookmark] = useState(false)
  const [createBookmarkError, setCreateBookmarkError] = useState('')
  const [retryingBookmarkId, setRetryingBookmarkId] = useState(null)
  const [editingBookmarkId, setEditingBookmarkId] = useState(null)
  const [deletingBookmarkId, setDeletingBookmarkId] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }

    const controller = new AbortController()

    async function loadFirstPage() {
      setIsLoadingBookmarks(true)
      setBookmarkError('')

      try {
        const query = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: '0',
        })
        if (activeSearch) {
          query.set('search', activeSearch)
        }

        const response = await fetch(`${API_URL}/bookmarks/?${query}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (response.status === 401) {
          localStorage.removeItem('accessToken')
          setBookmarks([])
          setTotalBookmarks(0)
          setHasMore(false)
          setBookmarkError('')
          setToken(null)
          return
        }

        const data = await response.json()

        if (!response.ok) {
          throw new Error('Could not load your bookmarks.')
        }

        setBookmarks(data.items)
        setTotalBookmarks(data.total)
        setHasMore(data.has_more)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setBookmarkError(
            error instanceof TypeError
              ? 'Cannot reach the API. Make sure FastAPI is running.'
              : error.message,
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingBookmarks(false)
        }
      }
    }

    loadFirstPage()

    return () => controller.abort()
  }, [activeSearch, token])

  useEffect(() => {
    if (!token) {
      return
    }

    const pendingBookmarks = bookmarks.filter(
      (bookmark) => bookmark.summary_status === 'pending',
    )

    if (pendingBookmarks.length === 0) {
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      try {
        const responses = await Promise.all(
          pendingBookmarks.map((bookmark) =>
            fetch(`${API_URL}/bookmarks/${bookmark.id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              signal: controller.signal,
            }),
          ),
        )

        if (responses.some((response) => response.status === 401)) {
          localStorage.removeItem('accessToken')
          setBookmarks([])
          setTotalBookmarks(0)
          setHasMore(false)
          setToken(null)
          return
        }

        const updatedBookmarks = await Promise.all(
          responses.map(async (response) => {
            if (!response.ok) {
              return null
            }
            return response.json()
          }),
        )

        const updatesById = new Map(
          updatedBookmarks
            .filter((bookmark) => bookmark !== null)
            .map((bookmark) => [bookmark.id, bookmark]),
        )

        setBookmarks((currentBookmarks) =>
          currentBookmarks.map(
            (bookmark) => updatesById.get(bookmark.id) ?? bookmark,
          ),
        )
      } catch (error) {
        if (error.name !== 'AbortError') {
          setBookmarkError('Could not refresh summary status.')
        }
      }
    }, 2000)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [bookmarks, token])

  function openForm(formName) {
    setActiveForm(formName)
    setMessage('')
  }

  function closeForm() {
    setActiveForm(null)
    setMessage('')
    setCreateBookmarkError('')
    setEditingBookmarkId(null)
    setSearchInput('')
    setActiveSearch('')
  }

  function handleSearch(event) {
    event.preventDefault()
    setActiveSearch(searchInput.trim())
  }

  function handleClearSearch() {
    setSearchInput('')
    setActiveSearch('')
  }

  async function handleRegister(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage =
          typeof data.detail === 'string'
            ? data.detail
            : 'Please check your email and password.'
        throw new Error(errorMessage)
      }

      setLoginEmail(data.email)
      setRegisterEmail('')
      setRegisterPassword('')
      setActiveForm('login')
      setMessage(`Account created for ${data.email}. Log in to continue.`)
    } catch (error) {
      if (error instanceof TypeError) {
        setMessage('Cannot reach the API. Make sure FastAPI is running.')
      } else {
        setMessage(error.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogin(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    const formData = new URLSearchParams()
    formData.append('username', loginEmail)
    formData.append('password', loginPassword)

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string' ? data.detail : 'Login failed.',
        )
      }

      localStorage.setItem('accessToken', data.access_token)
      setToken(data.access_token)
      setLoginPassword('')
      setActiveForm(null)
      setMessage('')
    } catch (error) {
      if (error instanceof TypeError) {
        setMessage('Cannot reach the API. Make sure FastAPI is running.')
      } else {
        setMessage(error.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('accessToken')
    setToken(null)
    setLoginEmail('')
    setLoginPassword('')
    setMessage('')
    setBookmarks([])
    setTotalBookmarks(0)
    setHasMore(false)
    setBookmarkError('')
    setActiveForm(null)
    setCreateBookmarkError('')
    setEditingBookmarkId(null)
  }

  function openCreateBookmarkForm() {
    setEditingBookmarkId(null)
    setBookmarkUrl('')
    setBookmarkTitle('')
    setBookmarkDescription('')
    setCreateBookmarkError('')
    setActiveForm('bookmark')
  }

  function openEditBookmarkForm(bookmark) {
    setEditingBookmarkId(bookmark.id)
    setBookmarkUrl(bookmark.url)
    setBookmarkTitle(bookmark.title)
    setBookmarkDescription(bookmark.description ?? '')
    setCreateBookmarkError('')
    setActiveForm('bookmark')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSaveBookmark(event) {
    event.preventDefault()
    setIsCreatingBookmark(true)
    setCreateBookmarkError('')

    try {
      const isEditing = editingBookmarkId !== null
      const endpoint = isEditing
        ? `${API_URL}/bookmarks/${editingBookmarkId}`
        : `${API_URL}/bookmarks/`

      const response = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: bookmarkUrl,
          title: bookmarkTitle,
          description: bookmarkDescription || null,
        }),
      })

      if (response.status === 401) {
        handleLogout()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Please check the bookmark details.',
        )
      }

      const matchesCurrentSearch =
        !activeSearch ||
        data.title.toLowerCase().includes(activeSearch.toLowerCase())

      if (isEditing) {
        if (matchesCurrentSearch) {
          setBookmarks((currentBookmarks) =>
            currentBookmarks.map((bookmark) =>
              bookmark.id === data.id ? data : bookmark,
            ),
          )
        } else {
          const newTotal = Math.max(0, totalBookmarks - 1)
          setBookmarks((currentBookmarks) =>
            currentBookmarks.filter((bookmark) => bookmark.id !== data.id),
          )
          setTotalBookmarks(newTotal)
          setHasMore(bookmarks.length - 1 < newTotal)
        }
      } else if (matchesCurrentSearch) {
        const newTotal = totalBookmarks + 1
        const newDisplayedCount = bookmarks.length + 1
        setBookmarks((currentBookmarks) => [data, ...currentBookmarks])
        setTotalBookmarks(newTotal)
        setHasMore(newDisplayedCount < newTotal)
      }
      setBookmarkUrl('')
      setBookmarkTitle('')
      setBookmarkDescription('')
      setEditingBookmarkId(null)
      setActiveForm(null)
    } catch (error) {
      setCreateBookmarkError(
        error instanceof TypeError
          ? 'Cannot reach the API. Make sure FastAPI is running.'
          : error.message,
      )
    } finally {
      setIsCreatingBookmark(false)
    }
  }

  async function handleDeleteBookmark(bookmark) {
    const confirmed = window.confirm(
      `Delete “${bookmark.title}”? This action cannot be undone.`,
    )
    if (!confirmed) {
      return
    }

    setDeletingBookmarkId(bookmark.id)
    setBookmarkError('')

    try {
      const response = await fetch(`${API_URL}/bookmarks/${bookmark.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        handleLogout()
        return
      }

      if (!response.ok) {
        throw new Error('Could not delete this bookmark.')
      }

      const newTotal = Math.max(0, totalBookmarks - 1)
      const newDisplayedCount = Math.max(0, bookmarks.length - 1)
      setBookmarks((currentBookmarks) =>
        currentBookmarks.filter((item) => item.id !== bookmark.id),
      )
      setTotalBookmarks(newTotal)
      setHasMore(newDisplayedCount < newTotal)

      if (editingBookmarkId === bookmark.id) {
        closeForm()
      }
    } catch (error) {
      setBookmarkError(
        error instanceof TypeError
          ? 'Cannot reach the API. Make sure FastAPI is running.'
          : error.message,
      )
    } finally {
      setDeletingBookmarkId(null)
    }
  }

  async function handleRetrySummary(bookmarkId) {
    setRetryingBookmarkId(bookmarkId)
    setBookmarkError('')

    try {
      const response = await fetch(
        `${API_URL}/bookmarks/${bookmarkId}/summary/retry`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.status === 401) {
        handleLogout()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error('Could not retry this summary.')
      }

      setBookmarks((currentBookmarks) =>
        currentBookmarks.map((bookmark) =>
          bookmark.id === data.id ? data : bookmark,
        ),
      )
    } catch (error) {
      setBookmarkError(
        error instanceof TypeError
          ? 'Cannot reach the API. Make sure FastAPI is running.'
          : error.message,
      )
    } finally {
      setRetryingBookmarkId(null)
    }
  }

  async function handleLoadMore() {
    setIsLoadingBookmarks(true)
    setBookmarkError('')

    try {
      const query = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(bookmarks.length),
      })
      if (activeSearch) {
        query.set('search', activeSearch)
      }

      const response = await fetch(`${API_URL}/bookmarks/?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        handleLogout()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error('Could not load more bookmarks.')
      }

      setBookmarks((currentBookmarks) => [
        ...currentBookmarks,
        ...data.items,
      ])
      setTotalBookmarks(data.total)
      setHasMore(data.has_more)
    } catch (error) {
      setBookmarkError(
        error instanceof TypeError
          ? 'Cannot reach the API. Make sure FastAPI is running.'
          : error.message,
      )
    } finally {
      setIsLoadingBookmarks(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Bookmark Manager home">
          Bookmark Manager
        </a>
        {token ? (
          <div className="session-actions">
            <span className="signed-in-label">Signed in</span>
            <button
              className="login-button"
              type="button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        ) : (
          <button
            className="login-button"
            type="button"
            onClick={() => openForm('login')}
          >
            Log in
          </button>
        )}
      </header>

      {token ? (
        <section className="dashboard" aria-labelledby="dashboard-title">
          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">Your collection</p>
              <h1 id="dashboard-title">Saved bookmarks</h1>
            </div>
            <div className="dashboard-actions">
              <p className="bookmark-count">
                {totalBookmarks}{' '}
                {totalBookmarks === 1 ? 'bookmark' : 'bookmarks'}
              </p>
              <button
                className="primary-button"
                type="button"
                onClick={openCreateBookmarkForm}
              >
                New bookmark
              </button>
            </div>
          </div>

          <form className="search-form" onSubmit={handleSearch} role="search">
            <label className="visually-hidden" htmlFor="bookmark-search">
              Search bookmark titles
            </label>
            <input
              id="bookmark-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search bookmark titles"
            />
            <button className="primary-button" type="submit">
              Search
            </button>
            {activeSearch && (
              <button
                className="secondary-button"
                type="button"
                onClick={handleClearSearch}
              >
                Clear
              </button>
            )}
          </form>

          {activeSearch && !isLoadingBookmarks && (
            <p className="search-summary">
              {totalBookmarks} {totalBookmarks === 1 ? 'result' : 'results'} for{' '}
              “{activeSearch}”
            </p>
          )}

          {activeForm === 'bookmark' && (
            <section
              className="create-bookmark-panel"
              aria-labelledby="create-bookmark-title"
            >
              <div className="create-panel-heading">
                <div>
                  <p className="form-label">
                    {editingBookmarkId === null
                      ? 'Add to your collection'
                      : 'Update saved page'}
                  </p>
                  <h2 id="create-bookmark-title">
                    {editingBookmarkId === null
                      ? 'Create a bookmark'
                      : 'Edit bookmark'}
                  </h2>
                </div>
                <button
                  className="close-button inline-close-button"
                  type="button"
                  aria-label="Close bookmark form"
                  onClick={closeForm}
                >
                  ×
                </button>
              </div>

              <form
                className="register-form bookmark-form"
                onSubmit={handleSaveBookmark}
              >
                <label htmlFor="bookmark-url">Page URL</label>
                <input
                  id="bookmark-url"
                  type="url"
                  value={bookmarkUrl}
                  onChange={(event) => setBookmarkUrl(event.target.value)}
                  placeholder="https://example.com"
                  required
                />

                <label htmlFor="bookmark-title">Title</label>
                <input
                  id="bookmark-title"
                  type="text"
                  value={bookmarkTitle}
                  onChange={(event) => setBookmarkTitle(event.target.value)}
                  placeholder="A useful page"
                  maxLength={255}
                  required
                />

                <label htmlFor="bookmark-description">
                  Description <span className="optional-label">Optional</span>
                </label>
                <textarea
                  id="bookmark-description"
                  value={bookmarkDescription}
                  onChange={(event) =>
                    setBookmarkDescription(event.target.value)
                  }
                  placeholder="Why are you saving this page?"
                  maxLength={500}
                  rows={4}
                />

                <button
                  className="primary-button submit-button"
                  type="submit"
                  disabled={isCreatingBookmark}
                >
                  {isCreatingBookmark
                    ? 'Saving bookmark…'
                    : editingBookmarkId === null
                      ? 'Save bookmark'
                      : 'Save changes'}
                </button>
              </form>

              {createBookmarkError && (
                <p className="form-message error-message" role="alert">
                  {createBookmarkError}
                </p>
              )}
            </section>
          )}

          {bookmarkError && (
            <p className="dashboard-message error-message" role="alert">
              {bookmarkError}
            </p>
          )}

          {isLoadingBookmarks && bookmarks.length === 0 && (
            <p className="dashboard-message">Loading your bookmarks…</p>
          )}

          {!isLoadingBookmarks && !bookmarkError && bookmarks.length === 0 && (
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
                <article className="bookmark-card" key={bookmark.id}>
                  <div className="bookmark-card-heading">
                    <span
                      className={`status-badge status-${bookmark.summary_status}`}
                    >
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
                        <button
                          type="button"
                          onClick={() => handleRetrySummary(bookmark.id)}
                          disabled={retryingBookmarkId === bookmark.id}
                        >
                          {retryingBookmarkId === bookmark.id
                            ? 'Retrying…'
                            : 'Retry summary'}
                        </button>
                      )}
                      <button
                        className="neutral-card-button"
                        type="button"
                        onClick={() => openEditBookmarkForm(bookmark)}
                      >
                        Edit
                      </button>
                      <button
                        className="danger-card-button"
                        type="button"
                        onClick={() => handleDeleteBookmark(bookmark)}
                        disabled={deletingBookmarkId === bookmark.id}
                      >
                        {deletingBookmarkId === bookmark.id
                          ? 'Deleting…'
                          : 'Delete'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="load-more-row">
              <button
                className="secondary-button"
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingBookmarks}
              >
                {isLoadingBookmarks ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </section>
      ) : (
        <>
          <div className="hero-layout">
        <section className="hero" aria-labelledby="hero-title">
          <p className="eyebrow">Your useful links, organized</p>
          <h1 id="hero-title">Save a page. Find it when you need it.</h1>
          <p className="hero-description">
            Keep your bookmarks in one private place, search them quickly, and
            generate short AI summaries of saved pages.
          </p>

          <div className="hero-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                openForm('register')
              }}
            >
              Create an account
            </button>
            <a className="secondary-button" href="#features">
              Learn more
            </a>
          </div>
        </section>

        {activeForm === 'register' && (
          <section className="register-panel" aria-labelledby="register-title">
            <button
              className="close-button"
              type="button"
              aria-label="Close registration form"
              onClick={closeForm}
            >
              ×
            </button>
            <p className="form-label">Get started</p>
            <h2 id="register-title">Create your account</h2>
            <p className="form-description">
              Use a valid email and a password with at least eight characters.
            </p>

            <form className="register-form" onSubmit={handleRegister}>
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                type="email"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />

              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                type="password"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
              />

              <button
                className="primary-button submit-button"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}
          </section>
        )}

        {activeForm === 'login' && (
          <section className="register-panel" aria-labelledby="login-title">
            <button
              className="close-button"
              type="button"
              aria-label="Close login form"
              onClick={closeForm}
            >
              ×
            </button>
            <p className="form-label">Welcome back</p>
            <h2 id="login-title">Log in to your account</h2>
            <p className="form-description">
              Enter the email and password you used when registering.
            </p>

            <form className="register-form" onSubmit={handleLogin}>
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />

              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                required
              />

              <button
                className="primary-button submit-button"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in…' : 'Log in'}
              </button>
            </form>

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}

            <button
              className="switch-form-button"
              type="button"
              onClick={() => openForm('register')}
            >
              Need an account? Register
            </button>
          </section>
        )}
          </div>

          <section
            className="features"
            id="features"
            aria-label="Application features"
          >
            <article className="feature-card">
              <span className="feature-number">01</span>
              <h2>Save bookmarks</h2>
              <p>
                Store a URL, title, and description in your personal collection.
              </p>
            </article>

            <article className="feature-card">
              <span className="feature-number">02</span>
              <h2>Search quickly</h2>
              <p>Find saved pages without scrolling through your entire list.</p>
            </article>

            <article className="feature-card">
              <span className="feature-number">03</span>
              <h2>Read summaries</h2>
              <p>Use your local Ollama model to create concise page summaries.</p>
            </article>
          </section>
        </>
      )}
    </main>
  )
}

export default App
