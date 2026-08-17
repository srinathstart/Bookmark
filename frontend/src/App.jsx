import { useEffect, useState } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import Header from './components/Header'
import LandingPage from './components/LandingPage'

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '')
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
      <Header
        isAuthenticated={Boolean(token)}
        onLogin={() => openForm('login')}
        onLogout={handleLogout}
      />

      {token ? (
        <Dashboard
          bookmarks={bookmarks}
          totalBookmarks={totalBookmarks}
          hasMore={hasMore}
          isLoading={isLoadingBookmarks}
          error={bookmarkError}
          searchInput={searchInput}
          activeSearch={activeSearch}
          showBookmarkForm={activeForm === 'bookmark'}
          editingBookmarkId={editingBookmarkId}
          bookmarkUrl={bookmarkUrl}
          bookmarkTitle={bookmarkTitle}
          bookmarkDescription={bookmarkDescription}
          isSaving={isCreatingBookmark}
          formError={createBookmarkError}
          retryingBookmarkId={retryingBookmarkId}
          deletingBookmarkId={deletingBookmarkId}
          onSearchInputChange={setSearchInput}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          onNewBookmark={openCreateBookmarkForm}
          onBookmarkUrlChange={setBookmarkUrl}
          onBookmarkTitleChange={setBookmarkTitle}
          onBookmarkDescriptionChange={setBookmarkDescription}
          onSaveBookmark={handleSaveBookmark}
          onCloseForm={closeForm}
          onRetrySummary={handleRetrySummary}
          onEditBookmark={openEditBookmarkForm}
          onDeleteBookmark={handleDeleteBookmark}
          onLoadMore={handleLoadMore}
        />
      ) : (
        <LandingPage
          activeForm={activeForm}
          registerEmail={registerEmail}
          registerPassword={registerPassword}
          loginEmail={loginEmail}
          loginPassword={loginPassword}
          isSubmitting={isSubmitting}
          message={message}
          onOpenForm={openForm}
          onCloseForm={closeForm}
          onRegisterEmailChange={setRegisterEmail}
          onRegisterPasswordChange={setRegisterPassword}
          onLoginEmailChange={setLoginEmail}
          onLoginPasswordChange={setLoginPassword}
          onRegister={handleRegister}
          onLogin={handleLogin}
        />
      )}
    </main>
  )
}

export default App
