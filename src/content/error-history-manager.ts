/**
 * ErrorHistoryManager
 *
 * Manages error history with ring buffer logic to respect memory limits.
 * Provides search, filter, and export functionality.
 */

import type { CatchyError, ErrorType } from '@/types';

export class ErrorHistoryManager {
  private errors: CatchyError[] = [];
  private maxSize = 200; // Default max size, will be loaded from settings

  /**
   * Set the maximum number of errors to store
   */
  public setMaxSize(size: number): void {
    if (import.meta.env.DEV) {
      console.log('[Catchy ErrorHistory] Max size changed:', this.maxSize, '→', size);
    }
    this.maxSize = size;

    // Trim existing errors if new size is smaller
    if (this.errors.length > size) {
      this.errors = this.errors.slice(-size);
      if (import.meta.env.DEV) {
        console.log('[Catchy ErrorHistory] Trimmed to new size:', this.errors.length);
      }
    }
  }

  /**
   * Get the current maximum size
   */
  public getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * Add an error to the history (ring buffer logic)
   */
  public add(error: CatchyError): void {
    // If we're at capacity, remove the oldest error
    if (this.errors.length >= this.maxSize) {
      this.errors.shift(); // Remove first (oldest) element
    }

    // Add new error to the end
    this.errors.push(error);

    if (import.meta.env.DEV) {
      console.log(
        '[Catchy ErrorHistory] Error added:',
        error.type,
        `(${this.errors.length}/${this.maxSize})`
      );
    }
  }

  /**
   * Get all errors in history
   */
  public getAll(): CatchyError[] {
    return [...this.errors]; // Return a copy
  }

  /**
   * Get the count of errors in history
   */
  public getCount(): number {
    return this.errors.length;
  }

  /**
   * Clear all errors from history
   */
  public clear(): void {
    const previousCount = this.errors.length;
    this.errors = [];

    if (import.meta.env.DEV) {
      console.log('[Catchy ErrorHistory] Cleared', previousCount, 'errors');
    }
  }

  /**
   * Search errors by query string (searches message and stack)
   */
  public search(query: string): CatchyError[] {
    if (!query || query.trim() === '') {
      return this.getAll();
    }

    const lowerQuery = query.toLowerCase();

    return this.errors.filter((error) => {
      const messageMatch = error.message.toLowerCase().includes(lowerQuery);
      const stackMatch = error.stack?.toLowerCase().includes(lowerQuery) ?? false;
      const fileMatch = error.file?.toLowerCase().includes(lowerQuery) ?? false;
      const urlMatch = error.url.toLowerCase().includes(lowerQuery);

      return messageMatch || stackMatch || fileMatch || urlMatch;
    });
  }

  /**
   * Filter errors by type
   */
  public filterByType(type: ErrorType): CatchyError[] {
    return this.errors.filter((error) => error.type === type);
  }

  /**
   * Filter errors by multiple types
   */
  public filterByTypes(types: ErrorType[]): CatchyError[] {
    if (types.length === 0) {
      return this.getAll();
    }

    return this.errors.filter((error) => types.includes(error.type));
  }

  /**
   * Get errors within a time range
   */
  public filterByTimeRange(startTime: number, endTime: number): CatchyError[] {
    return this.errors.filter((error) => error.timestamp >= startTime && error.timestamp <= endTime);
  }

  /**
   * Export errors to JSON string
   */
  public exportToJSON(): string {
    const exportData = {
      exportedAt: new Date().toISOString(),
      url: window.location.href,
      hostname: window.location.hostname,
      totalErrors: this.errors.length,
      maxCapacity: this.maxSize,
      errors: this.errors,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export errors to CSV string
   */
  public exportToCSV(): string {
    // CSV header
    const headers = ['Timestamp', 'Date', 'Type', 'Message', 'File', 'Line', 'Column', 'URL', 'Count'];
    const rows = [headers.join(',')];

    // Add each error as a row
    for (const error of this.errors) {
      const timestamp = error.timestamp;
      const date = new Date(timestamp).toISOString();
      const type = error.type;
      const message = this.escapeCSV(error.message);
      const file = this.escapeCSV(error.file || '');
      const line = error.line?.toString() || '';
      const column = error.column?.toString() || '';
      const url = this.escapeCSV(error.url);
      const count = error.count?.toString() || '1';

      rows.push([timestamp, date, type, message, file, line, column, url, count].join(','));
    }

    return rows.join('\n');
  }

  /**
   * Escape CSV field (handle commas, quotes, newlines)
   */
  private escapeCSV(field: string): string {
    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /**
   * Download errors as JSON file
   */
  public downloadJSON(): void {
    const json = this.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `catchy-errors-${window.location.hostname}-${timestamp}.json`;

    this.downloadFile(url, filename);
  }

  /**
   * Download errors as CSV file
   */
  public downloadCSV(): void {
    const csv = this.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `catchy-errors-${window.location.hostname}-${timestamp}.csv`;

    this.downloadFile(url, filename);
  }

  /**
   * Helper to trigger file download
   */
  private downloadFile(url: string, filename: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (import.meta.env.DEV) {
      console.log('[Catchy ErrorHistory] Downloaded:', filename);
    }
  }

  /**
   * Get statistics about the error history
   */
  public getStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
    capacityUsed: number; // Percentage
  } {
    const byType: Record<ErrorType, number> = {
      'console.error': 0,
      uncaught: 0,
      unhandledrejection: 0,
      resource: 0,
      network: 0,
    };

    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    for (const error of this.errors) {
      byType[error.type] = (byType[error.type] || 0) + 1;

      if (oldestTimestamp === null || error.timestamp < oldestTimestamp) {
        oldestTimestamp = error.timestamp;
      }
      if (newestTimestamp === null || error.timestamp > newestTimestamp) {
        newestTimestamp = error.timestamp;
      }
    }

    return {
      total: this.errors.length,
      byType,
      oldestTimestamp,
      newestTimestamp,
      capacityUsed: (this.errors.length / this.maxSize) * 100,
    };
  }
}

// Export singleton instance
export const errorHistoryManager = new ErrorHistoryManager();
