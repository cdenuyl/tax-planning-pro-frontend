import React, { Suspense, lazy } from 'react';

// Lazy load large components for better performance
const SocialSecurityAnalysis = lazy(() => import('./SocialSecurityAnalysis.jsx'));
const InteractiveTaxMap = lazy(() => import('./InteractiveTaxMap.jsx'));
const AssetsTab = lazy(() => import('./AssetsTab.jsx'));
const HelpSystem = lazy(() => import('./HelpSystem.jsx'));
const DataImportExport = lazy(() => import('./DataImportExport.jsx'));

// Generic loading component
const ComponentLoading = ({ name = 'Component' }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-sm text-gray-600">Loading {name}...</p>
    </div>
  </div>
);

// Error boundary for lazy components
class LazyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`Lazy component error (${this.props.componentName}):`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Error loading {this.props.componentName}. 
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy wrapper factory
const createLazyWrapper = (Component, name) => {
  return React.forwardRef((props, ref) => (
    <LazyErrorBoundary componentName={name}>
      <Suspense fallback={<ComponentLoading name={name} />}>
        <Component {...props} ref={ref} />
      </Suspense>
    </LazyErrorBoundary>
  ));
};

// Export lazy-wrapped components
export const LazySocialSecurityAnalysis = createLazyWrapper(SocialSecurityAnalysis, 'Social Security Analysis');
export const LazyInteractiveTaxMap = createLazyWrapper(InteractiveTaxMap, 'Tax Map');
export const LazyAssetsTab = createLazyWrapper(AssetsTab, 'Assets');
export const LazyHelpSystem = createLazyWrapper(HelpSystem, 'Help System');
export const LazyDataImportExport = createLazyWrapper(DataImportExport, 'Data Import/Export');

// Export individual components for direct use if needed
export {
  SocialSecurityAnalysis,
  InteractiveTaxMap,
  AssetsTab,
  HelpSystem,
  DataImportExport
};

