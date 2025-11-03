import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OptionsApp() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">🎯 Catchy Settings</h1>
          <p className="text-muted-foreground">Configure your error catching preferences</p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon!</CardTitle>
              <CardDescription>
                Full settings page is under construction. For now, you can toggle Catchy on/off from
                the popup.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Planned Features:</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Custom ignore rules for specific error types</li>
                    <li>Per-site settings and configurations</li>
                    <li>Theme customization (dark mode, accent colors)</li>
                    <li>Export and import settings</li>
                    <li>Toast notification positioning and styling</li>
                    <li>Error log history and filtering</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>About Catchy</CardTitle>
              <CardDescription>
                A modern Chrome extension for tracking console errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Catchy helps developers catch and display console errors and runtime exceptions with
                clean, customizable toast notifications. Perfect for debugging and monitoring web
                applications during development.
              </p>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 bg-muted rounded">v0.1.0</span>
                <span className="px-2 py-1 bg-muted rounded">React</span>
                <span className="px-2 py-1 bg-muted rounded">TypeScript</span>
                <span className="px-2 py-1 bg-muted rounded">Tailwind CSS</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
