import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const VERSION = '1.0.0';

/**
 * AboutSection - Extension information and credits
 *
 * Displays extension version, creator information, feature list,
 * and external links (GitHub, changelog, documentation).
 */
export function AboutSection() {
  return (
    <>
      {/* About Card */}
      <Card className="settings-card">
        <CardHeader>
          <CardTitle className="section-title">
            <span className="title-number">09</span>
            <span className="title-text">About Catchy</span>
          </CardTitle>
          <CardDescription>A modern Chrome extension for tracking console errors</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Catchy helps developers catch and display console errors and runtime exceptions with
            clean, customizable toast notifications. Perfect for debugging and monitoring web
            applications during development.
          </p>

          {/* Creators */}
          <div className="mb-4 pb-4 border-b border-border">
            <div className="text-sm font-medium mb-2">Created by</div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-md font-medium text-sm">
                Lonut
              </span>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-muted rounded">v{VERSION}</span>
            <span className="px-2 py-1 bg-muted rounded">React</span>
            <span className="px-2 py-1 bg-muted rounded">TypeScript</span>
            <span className="px-2 py-1 bg-muted rounded">Tailwind CSS</span>
          </div>
        </CardContent>
      </Card>

      {/* Changelog Card */}
      <Card className="settings-card">
        <CardHeader>
          <CardTitle className="section-title">
            <span className="title-number">10</span>
            <span className="title-text">Changelog</span>
          </CardTitle>
          <CardDescription>Recent updates and improvements</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Version {VERSION} — real-time error toasts, error history drawer, ignore rules, per-site
            controls, customizable keyboard shortcuts, dark mode, and Shadow DOM isolation.
          </p>
          <a
            href="https://github.com/ionutcnu/Catchy/blob/main/CHANGELOG.md"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View full changelog on GitHub"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            View Full Changelog
            <span aria-hidden="true">→</span>
          </a>
        </CardContent>
      </Card>
    </>
  );
}
