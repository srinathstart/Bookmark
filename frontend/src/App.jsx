import './App.css'

function App() {
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

      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">Your useful links, organized</p>
        <h1 id="hero-title">Save a page. Find it when you need it.</h1>
        <p className="hero-description">
          Keep your bookmarks in one private place, search them quickly, and
          generate short AI summaries of saved pages.
        </p>

        <div className="hero-actions">
          <button className="primary-button" type="button">
            Create an account
          </button>
          <button className="secondary-button" type="button">
            Learn more
          </button>
        </div>
      </section>

      <section className="features" aria-label="Application features">
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
