export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar skeleton */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center gap-3 h-16 px-6 border-b border-gray-200">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Navigation skeleton */}
        <nav className="px-4 py-6 space-y-6">
          {[1, 2, 3, 4, 5].map((section) => (
            <div key={section}>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header skeleton */}
        <header className="sticky top-0 z-30 flex items-center gap-4 h-16 px-4 bg-white border-b border-gray-200 lg:px-6">
          <div className="flex-1" />
          <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </header>

        {/* Page content skeleton */}
        <main className="p-4 lg:p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
