export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Breadcrumb Skeleton */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <span>/</span>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </nav>

      <div className="container mx-auto px-4 pb-12">
        {/* Header Skeleton */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          </div>
          
          <div className="h-10 w-80 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 w-96 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-6 animate-pulse"></div>
          
          <div className="flex items-center justify-center gap-6">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        </div>

        {/* Tools Grid Skeleton */}
        <div className="space-y-12">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}