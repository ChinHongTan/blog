declare module "@vercel/analytics/vue" {
  import type { DefineComponent } from "vue";
  export const Analytics: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
}
