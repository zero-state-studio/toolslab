export default function Loading() {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-muted rounded-lg"></div>
            <div className="space-y-2 flex-1">
              <div className="h-8 bg-muted rounded-md w-1/3"></div>
              <div className="h-4 bg-muted rounded-md w-2/3"></div>
            </div>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded-md w-1/4"></div>
              <div className="h-48 bg-muted rounded-lg"></div>
            </div>
            
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded-md w-1/4"></div>
              <div className="h-48 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}