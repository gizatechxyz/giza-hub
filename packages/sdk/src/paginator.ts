export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type PageFetcher<T> = (
  page: number,
  limit: number,
) => Promise<PaginatedResponse<T>>;

/**
 * Async-iterable paginator that auto-pages through API results.
 *
 * Normalizes two API response shapes:
 * - `{ transactions, pagination }` (transaction endpoints)
 * - `{ items, total }` (executions, logs, rewards endpoints)
 */
export class Paginator<T> implements AsyncIterable<T> {
  constructor(
    private readonly fetchPage: PageFetcher<T>,
    private readonly defaultLimit: number = 20,
  ) {}

  async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.fetchPage(page, this.defaultLimit);
      for (const item of response.items) {
        yield item;
      }
      hasMore = response.hasMore;
      page++;
    }
  }

  /** Fetch a single page of results. */
  async page(
    num: number,
    opts?: { limit?: number },
  ): Promise<PaginatedResponse<T>> {
    return this.fetchPage(num, opts?.limit ?? this.defaultLimit);
  }

  /** Convenience: return the first N items (defaults to one page). */
  async first(count?: number): Promise<T[]> {
    const limit = count ?? this.defaultLimit;
    const response = await this.fetchPage(1, limit);
    return count !== undefined
      ? response.items.slice(0, count)
      : response.items;
  }
}
