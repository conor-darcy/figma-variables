export default {
  source: ["output/variables-dtcg.json"],
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "output/",
      prefix: "gux",
      files: [
        {
          destination: "core.css",
          format: "css/variables",
          options: {
            outputReferences: true,
            selector: ":root",
          },
          filter: {
            attributes: {
              collection: "core",
            },
          },
        },
        {
          destination: "components.css",
          format: "css/variables",
          options: {
            outputReferences: true,
            selector: ":root",
          },
          filter: {
            attributes: {
              collection: "component",
            },
          },
        },
        {
          destination: "theme-light.css",
          format: "css/variables",
          options: {
            outputReferences: true,
            selector: "[data-theme='light']",
          },
          filter: {
            attributes: {
              collection: "semantic",
              mode: "light",
            },
          },
        },
        {
          destination: "theme-dark.css",
          format: "css/variables",
          options: {
            outputReferences: true,
            selector: "[data-theme='dark']",
          },
          filter: {
            attributes: {
              collection: "semantic",
              mode: "dark",
            },
          },
        },
      ],
    },
  },
};
