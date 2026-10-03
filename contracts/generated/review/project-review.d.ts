/* Generated from contracts/project-review.schema.json. Do not edit. */

/**
 * needs-decision: waiting for the reviewer; in-progress: the project is working on it; done: nothing left to do; blocked: the project cannot proceed without a fix.
 */
export type ReviewStatus = "needs-decision" | "in-progress" | "done" | "blocked";

/**
 * The items a project currently offers for review, read-only. The project owns each item, its status and its text; the consumer owns where the file lives and how it is shown. Timestamps are UTC RFC3339; validUntil is the freshness deadline, with equality still fresh.
 */
export interface ProjectReview {
  version: 1;
  observedAt: string;
  validUntil: string;
  /**
   * @maxItems 20
   */
  items: ReviewItem[];
}
export interface ReviewItem {
  /**
   * Stable within the project.
   */
  id: string;
  title: string;
  status: ReviewStatus;
  statusText: string;
  /**
   * @maxItems 20
   */
  fields: ReviewField[];
  /**
   * @maxItems 4
   */
  links: ReviewLink[];
}
export interface ReviewField {
  label: string;
  /**
   * Text that may contain line feeds; every other control and bidi formatting character is excluded.
   */
  text: string;
}
/**
 * An https page the project points the reviewer to, opened outside the consumer.
 */
export interface ReviewLink {
  label: string;
  url: string;
}
