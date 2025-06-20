import dotenv from "dotenv";

dotenv.config();

const { FIGMA_STYLES_ACCESS_TOKEN, FIGMA_FILE_KEY } = process.env;

const FIGMA_API_BASE = "https://api.figma.com/v1";

fetch(`${FIGMA_API_BASE}/files/${FIGMA_FILE_KEY}/styles`, {
  method: "GET",
  headers: {
    "X-Figma-Token": FIGMA_STYLES_ACCESS_TOKEN,
  },
})
  .then((res) => {
    console.log("Response status:", res.status);
    return res.json();
  })
  .then((data) => {
    createStyles(data);
  })
  .catch((err) => {
    console.error("Error fetching variables:", err);
  });

function createStyles(data) {
  if (!data.meta?.styles) {
    console.log("No styles found in the response");
    return;
  }

  const styleKeys = [];

  data.meta.styles.forEach((style) => {
    styleKeys.push(style.node_id);
  });

  const nodeIds = encodeURIComponent(styleKeys.join(","));
  const url = `${FIGMA_API_BASE}/files/${FIGMA_FILE_KEY}/nodes?ids=${nodeIds}`;
  fetch(url, {
    method: "GET",
    headers: {
      "X-Figma-Token": FIGMA_STYLES_ACCESS_TOKEN,
    },
  })
    .then((res) => {
      // log the request url
      console.log("Request URL:", res.url);
      console.log("Response status:", res.status);
      return res.json();
    })
    .then((data) => {
      processStyles(data);
    })
    .catch((err) => {
      console.error("Error fetching variables:", err);
    });
}

function processStyles(data) {
  console.log("================");
  console.log("================");
  // console.log(data.nodes);
  console.log("================");
  console.log("================");
}
