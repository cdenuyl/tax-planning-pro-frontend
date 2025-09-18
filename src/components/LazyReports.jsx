import React, { Suspense, lazy } from 'react';

// Lazy load all report modules for better performance
const ComprehensiveReports = lazy(() => import('./ComprehensiveReports.jsx'));

// Loading component for report modules
const ReportsLoading = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading Reports...</p>
      <p className="text-sm text-gray-500 mt-2">Preparing comprehensive tax analysis</p>
    </div>
  </div>
);

// Error boundary for report modules
class ReportsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Reports module error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Reports Module Error</h3>
          <p className="text-red-700 mb-4">
            There was an error loading the reports module. Please try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main lazy reports component
export const LazyReports = (props) => {
  return (
    <ReportsErrorBoundary>
      <Suspense fallback={<ReportsLoading />}>
        <ComprehensiveReports {...props} />
      </Suspense>
    </ReportsErrorBoundary>
  );
};

export default LazyReports;

