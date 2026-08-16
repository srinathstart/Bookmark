function LandingPage({
  activeForm,
  registerEmail,
  registerPassword,
  loginEmail,
  loginPassword,
  isSubmitting,
  message,
  onOpenForm,
  onCloseForm,
  onRegisterEmailChange,
  onRegisterPasswordChange,
  onLoginEmailChange,
  onLoginPasswordChange,
  onRegister,
  onLogin,
}) {
  return (
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
              onClick={() => onOpenForm('register')}
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
              onClick={onCloseForm}
            >
              ×
            </button>
            <p className="form-label">Get started</p>
            <h2 id="register-title">Create your account</h2>
            <p className="form-description">
              Use a valid email and a password with at least eight characters.
            </p>

            <form className="register-form" onSubmit={onRegister}>
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                type="email"
                value={registerEmail}
                onChange={(event) =>
                  onRegisterEmailChange(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
              />

              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                type="password"
                value={registerPassword}
                onChange={(event) =>
                  onRegisterPasswordChange(event.target.value)
                }
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
              onClick={onCloseForm}
            >
              ×
            </button>
            <p className="form-label">Welcome back</p>
            <h2 id="login-title">Log in to your account</h2>
            <p className="form-description">
              Enter the email and password you used when registering.
            </p>

            <form className="register-form" onSubmit={onLogin}>
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(event) => onLoginEmailChange(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />

              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(event) => onLoginPasswordChange(event.target.value)}
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
              onClick={() => onOpenForm('register')}
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
    </>
  )
}

export default LandingPage
