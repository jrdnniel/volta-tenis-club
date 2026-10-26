import React from 'react';
import { HiExclamationTriangle, HiArrowPath } from 'react-icons/hi2';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-slate-800">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-200/80 p-8 text-center space-y-5">
            <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-200">
              <HiExclamationTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Terjadi Kendala Tampilan
              </h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Aplikasi mengalami kendala saat memuat komponen ini. Silakan muat ulang halaman.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="bg-stone-100 p-3 rounded-xl text-left text-xs font-mono text-slate-700 overflow-x-auto border border-stone-200">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              <HiArrowPath className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

