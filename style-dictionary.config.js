import fs from "fs";
import path from "path";

// Read the JSON file to get collections
const jsonData = JSON.parse(
  fs.readFileSync(path.resolve("output/variables-dtcg.json"), "utf8")
);

// Function to get unique collections from the JSON data
function getCollections(data) {
  const collections = new Set();

  function traverse(obj) {
    if (obj && typeof obj === "object") {
      if (obj.attributes && obj.attributes.collection) {
        collections.add(obj.attributes.collection);
      }
      Object.values(obj).forEach(traverse);
    }
  }

  traverse(data);
  return Array.from(collections);
}

// Get all collections
const collections = getCollections(jsonData);

// Generate file configurations based on collections
const files = collections
  .map((collection) => {
    // Special handling for semantic collection which has light/dark modes
    if (collection === "semantic") {
      return [
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
      ];
    }

    // For other collections
    return {
      destination: `${collection}.css`,
      format: "css/variables",
      options: {
        outputReferences: true,
        selector: ":root",
      },
      filter: {
        attributes: {
          collection: collection,
        },
      },
    };
  })
  .flat();

export default {
  source: ["output/variables-dtcg.json"],
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "output/",
      prefix: "gux",
      files: files,
    },
  },
};
