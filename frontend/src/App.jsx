import { useState } from 'react'
import './App.css'

const API_URL = 'http://127.0.0.1:8000'

function App() {
  const [activeForm, setActiveForm] = useState(null)
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  function openForm(formName) {
    setActiveForm(formName)
    setMessage('')
  }

  function closeForm() {
    setActiveForm(null)
    setMessage('')
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
          <p>Store a URL, title, and description in your personal collection.</p>
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
    </main>
  )
}

export default App
