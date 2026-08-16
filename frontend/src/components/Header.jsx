function Header({ isAuthenticated, onLogin, onLogout }) {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="Bookmark Manager home">
        Bookmark Manager
      </a>
      {isAuthenticated ? (
        <div className="session-actions">
          <span className="signed-in-label">Signed in</span>
          <button className="login-button" type="button" onClick={onLogout}>
            Log out
          </button>
        </div>
      ) : (
        <button className="login-button" type="button" onClick={onLogin}>
          Log in
        </button>
      )}
    </header>
  )
}

export default Header
