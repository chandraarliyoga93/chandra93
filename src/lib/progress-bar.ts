// @ts-expect-error - nprogress has no types
import NProgress from "nprogress";

// Configure NProgress if needed
NProgress.configure({ showSpinner: false });

export const progressBar = {
  start: () => NProgress.start(),
  done: () => NProgress.done(),
};
