import dotenv from "dotenv";
import * as fs from "fs";
import path from "path";
import { rgbToHex } from "./utils.js";
import { fileURLToPath } from "url";

dotenv.config();

const { FIGMA_ACCESS_TOKEN, FIGMA_FILE_KEY } = process.env;

const FIGMA_API_BASE = "https://api.figma.com/v1";

// Get current file path and directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const CONFIG_PATH = path.join(__dirname, "style-dictionary.config.json");
const OUTPUT_DIR = path.join(__dirname, "output");
const VARIABLES_PATH = path.join(OUTPUT_DIR, "variables.json");
const DTCG_PATH = path.join(OUTPUT_DIR, "variables-dtcg.json");

async function getLocalFileVariables() {
  try {
    const response = await fetch(
      `${FIGMA_API_BASE}/files/${FIGMA_FILE_KEY}/variables/local`,
      {
        headers: {
          "X-Figma-Token": FIGMA_ACCESS_TOKEN,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Figma API error: ${response.status} ${response.statusText} - ${errorData.err || JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    console.log("Local file variables:", JSON.stringify(data, null, 2));

    // Save to output/variables.json
    const outputDir = path.join(process.cwd(), "output");
    await fs.promises.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, "variables.json");
    await fs.promises.writeFile(outputPath, JSON.stringify(data, null, 2));
    console.log(`Variables saved to ${outputPath}`);
  } catch (error) {
    console.error("Error fetching local file variables:", error.message);
  }
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    throw error;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error.message);
    throw error;
  }
}

function getCollectionName(collections, id) {
  return collections[id]?.name || "Uncategorized";
}

function getModeName(collection, modeId) {
  if (!collection?.modes) return "default";
  const mode = collection.modes.find((m) => m.modeId === modeId);
  return mode ? mode.name : "default";
}

function resolveAlias(variables, val, modeId) {
  if (
    !val ||
    typeof val !== "object" ||
    val.type !== "VARIABLE_ALIAS" ||
    !val.id
  ) {
    return val;
  }

  const aliasedVar = variables[val.id];
  if (!aliasedVar) return undefined;

  const modeIds = Object.keys(aliasedVar.valuesByMode || {});
  if (modeIds.length === 0) return undefined;

  const value =
    aliasedVar.valuesByMode[modeId] || aliasedVar.valuesByMode[modeIds[0]];
  return resolveAlias(variables, value, modeId);
}

function transformValue(value, type) {
  if (
    type === "COLOR" &&
    value &&
    typeof value === "object" &&
    value.r !== undefined
  ) {
    return rgbToHex(value.r, value.g, value.b);
  }
  if (type === "FLOAT" && typeof value === "number") {
    return `${value}px`;
  }
  return value;
}

function createTokenObject(value, type, description, attributes) {
  return {
    value,
    type: type.toLowerCase(),
    ...(description && { description }),
    attributes,
  };
}

function processTokenPath(current, nameParts) {
  for (let i = 0; i < nameParts.length - 1; i++) {
    if (!current[nameParts[i]]) current[nameParts[i]] = {};
    current = current[nameParts[i]];
  }
  return current;
}

function figmaToDTCG(figmaData) {
  if (!figmaData?.meta?.variableCollections || !figmaData?.meta?.variables) {
    throw new Error("Invalid Figma data structure");
  }

  const dtcg = {
    $schema:
      "https://design-tokens.github.io/community-group/format/2023-04-12/schema.json",
  };

  const { variableCollections: collections, variables } = figmaData.meta;

  // Process core and component tokens
  Object.entries(variables).forEach(([variableId, variable]) => {
    const collectionName = getCollectionName(
      collections,
      variable.variableCollectionId
    );
    if (collectionName === "semantic") return;

    if (!dtcg[collectionName]) dtcg[collectionName] = {};
    const nameParts = variable.name.split("/").map((n) => n.trim());
    const current = processTokenPath(dtcg[collectionName], nameParts);

    const modeIds = Object.keys(variable.valuesByMode || {});
    const value =
      modeIds.length > 0
        ? resolveAlias(variables, variable.valuesByMode[modeIds[0]])
        : undefined;

    current[nameParts[nameParts.length - 1]] = createTokenObject(
      transformValue(value, variable.resolvedType),
      variable.resolvedType,
      variable.description,
      { collection: collectionName }
    );
  });

  // Process semantic tokens
  Object.entries(variables).forEach(([variableId, variable]) => {
    const collectionName = getCollectionName(
      collections,
      variable.variableCollectionId
    );
    if (collectionName !== "semantic") return;

    if (!dtcg[collectionName]) dtcg[collectionName] = {};
    const nameParts = variable.name.split("/").map((n) => n.trim());
    const current = processTokenPath(dtcg[collectionName], nameParts);

    const modeIds = Object.keys(variable.valuesByMode || {});
    modeIds.forEach((modeId) => {
      const modeName = getModeName(
        collections[variable.variableCollectionId],
        modeId
      );
      const value = resolveAlias(
        variables,
        variable.valuesByMode[modeId],
        modeId
      );
      const tokenName = nameParts[nameParts.length - 1];

      if (!current[tokenName]) {
        current[tokenName] = createTokenObject(
          transformValue(value, variable.resolvedType),
          variable.resolvedType,
          variable.description,
          { mode: modeName, collection: collectionName }
        );
      } else {
        const modeTokenName = `${tokenName}-${modeName}`;
        current[modeTokenName] = createTokenObject(
          transformValue(value, variable.resolvedType),
          variable.resolvedType,
          variable.description,
          { mode: modeName, collection: collectionName }
        );
      }
    });
  });

  return dtcg;
}

async function convertVariablesToDTCG() {
  const inputPath = path.join(process.cwd(), "output", "variables.json");
  const outputPath = path.join(process.cwd(), "output", "variables-dtcg.json");
  try {
    const raw = await fs.promises.readFile(inputPath, "utf-8");
    const figmaData = JSON.parse(raw);
    const dtcg = figmaToDTCG(figmaData);
    await fs.promises.writeFile(outputPath, JSON.stringify(dtcg, null, 2));
    console.log(`DTCG variables saved to ${outputPath}`);
  } catch (error) {
    console.error("Error converting to DTCG format:", error.message);
  }
}

async function main() {
  await getLocalFileVariables();
  await convertVariablesToDTCG();
}

// Main build function
async function build() {
  try {
    console.log("Starting build process...");
    ensureDirectoryExists(OUTPUT_DIR);

    // First, fetch variables from Figma
    console.log("Fetching variables from Figma...");
    await getLocalFileVariables();

    // Then read and validate Figma data
    console.log("Reading Figma variables...");
    const figmaData = readJsonFile(VARIABLES_PATH);
    if (!figmaData || figmaData.error) {
      throw new Error("Invalid Figma data or error in response");
    }

    // Transform to DTCG format
    console.log("Transforming to DTCG format...");
    const dtcgData = figmaToDTCG(figmaData);
    writeJsonFile(DTCG_PATH, dtcgData);

    // Read and validate Style Dictionary config
    console.log("Reading Style Dictionary config...");
    const config = (await import("./style-dictionary.config.js")).default;

    // Build CSS files
    console.log("Building CSS files...");
    const styleDictionaryImport = await import("style-dictionary");
    console.log("Style Dictionary import:", styleDictionaryImport);
    // Commenting out the rest for now
    // const StyleDictionary = styleDictionaryImport.default;
    // const sd = await StyleDictionary.create(config);
    // await sd.buildAllPlatforms();

    console.log("Build completed successfully!");
  } catch (error) {
    console.error("Build failed:", error.message);
    process.exit(1);
  }
}

// Run build if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  build();
}

export { build, figmaToDTCG };
