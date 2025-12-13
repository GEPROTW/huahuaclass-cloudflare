
// [DEPRECATED]
// This file is no longer used for the `wrangler deploy` workflow.
// The backend logic has been moved to `src/worker.ts` to support
// the unified Worker + Assets architecture.
//
// Please refer to `src/worker.ts` for the active API implementation.

export const onRequest = async () => {
  return new Response("This API endpoint has moved. Please check src/worker.ts", { status: 410 });
};
