declare module "eslint-plugin-drizzle" {
  const plugin: {
    configs: {
      recommended: {
        rules: Record<string, "error" | "warn" | "off">;
      };
    };
  };
  export = plugin;
}
