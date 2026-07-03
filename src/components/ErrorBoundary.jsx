import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="login-shell">
          <div className="card login-card" style={{ width: 420 }}>
            <h1 style={{ fontSize: 18, marginTop: 0 }}>Something went wrong</h1>
            <p className="error-text">{this.state.error.message}</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Try reloading. If it keeps happening, check the server logs.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
