import { Component } from "react";

// Catches any render-time crash anywhere in the app — including, say, a
// corrupted cart in localStorage reaching a page that didn't expect it —
// so a visitor sees a recoverable screen instead of a permanent blank page.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Unhandled error:", error);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch {
      // Ignore — still try to reload.
    }
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-light px-6 text-center">
        <p className="eyebrow">Clean &amp; Care</p>
        <h1 className="font-serif text-2xl font-semibold text-ink">Something went wrong</h1>
        <p className="max-w-sm text-sm text-ink/60">
          Please try reloading the page. If that doesn&rsquo;t help, the button below will reset the
          site&rsquo;s saved data (like your cart) and take you back home.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className="btn-pill-outline !py-2 !text-xs">
            Reload Page
          </button>
          <button type="button" onClick={this.handleReset} className="btn-pill-lime !py-2 !text-xs">
            Reset &amp; Go Home
          </button>
        </div>
      </div>
    );
  }
}
