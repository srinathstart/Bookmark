import { useState } from 'react'
import './App.css'

const API_URL = 'http://127.0.0.1:8000'

function App() {
  const [showRegister, setShowRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

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
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage =
          typeof data.detail === 'string'
            ? data.detail
            : 'Please check your email and password.'
        throw new Error(errorMessage)
      }

      setMessage(`Account created for ${data.email}. You can now log in.`)
      setEmail('')
      setPassword('')
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

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Bookmark Manager home">
          Bookmark Manager
        </a>
        <button className="login-button" type="button">
          Log in
        </button>
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
                setShowRegister(true)
                setMessage('')
              }}
            >
              Create an account
            </button>
            <a className="secondary-button" href="#features">
              Learn more
            </a>
          </div>
        </section>

        {showRegister && (
          <section className="register-panel" aria-labelledby="register-title">
            <button
              className="close-button"
              type="button"
              aria-label="Close registration form"
              onClick={() => setShowRegister(false)}
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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />

              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
