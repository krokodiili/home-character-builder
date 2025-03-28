#!/usr/bin/env node

const layoutTypesMapping = {};

function convertLayoutTypes(type) {
  return layoutTypesMapping[type] || type;
}

const fs = require("fs");
const path = require("path");

// Helper to get all JSON files in a directory
function getJsonFiles(dir) {
  return fs.readdirSync(dir).filter((file) => file.endsWith(".json"));
}

// Helper to read and parse a JSON file
function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// Helper to pick a random item from an array
function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Main function to generate a random character JSON
function generateRandomCharacter(inputDir, outputFile) {
  const jsonFiles = getJsonFiles(inputDir);

  // Group files by layer type (e.g., "hair", "body", etc.)
  const layers = {};

  const ignoredLayers = ["beard"];
  jsonFiles.forEach((file) => {
    const layerTypeParts = file.split("_"); // Extract layer type from filename
    if (layerTypeParts.length < 2) return;

    const layerType = convertLayoutTypes(
      layerTypeParts[0] ? layerTypeParts[1] : layerTypeParts[0],
    );

    if (!layers[layerType]) layers[layerType] = [];

    if (ignoredLayers.includes(layerType)) return;

    layers[layerType].push(file);
  });

  console.log("Found layers:");
  console.log(layers);

  const character = {
    bodyTypeName: "male",
    url: "",
    spritesheets: "",
    version: 1,
    datetime: new Date().toLocaleString(),
    credits: [],
    layers: [],
  };

  const mainLayers = ["body", "hair", "head", "legs", "clothes"];
  // Process each layer type
  for (const [layerType, files] of Object.entries(layers)) {
    if (!mainLayers.includes(layerType)) {
      const coinflip = Math.random() > 0.8;
      if (!coinflip) continue;
    }

    const randomFile = pickRandom(files);
    const filePath = path.join(inputDir, randomFile);
    const jsonData = readJsonFile(filePath);

    // Pick a random variant
    const randomVariant = pickRandom(jsonData.variants);

    if (jsonData.name.toLowerCase().includes("placeholder")) {
      console.log("Ignoring placeholder layer:", jsonData.name);
      continue;
    }

    if (
      character.layers.some((layer) => layer.parentName === jsonData.type_name)
    ) {
      console.log("Ignoring duplicate layer:", jsonData.name);
      continue;
    }

    console.log("Adding layer:", jsonData);
    // Add layer information
    character.layers.push({
      fileName: jsonData.fileName,
      zPos: jsonData.layer_1.zPos,
      parentName: jsonData.type_name,
      name: jsonData.name,
      variant: randomVariant,
      supportedAnimations:
        "spellcast,thrust,walk,slash,shoot,hurt,watering,idle,jump,run,sit,emote,climb,combat,1h_slash,1h_backslash,1h_halfslash",
    });

    // Add credits
    jsonData.credits.forEach((credit) => {
      character.credits.push({
        fileName: credit.file,
        licenses: credit.licenses.join(","),
        authors: credit.authors.join(","),
        urls: credit.urls.join(","),
        notes: credit.notes,
      });
    });
  }

  // Generate URL (optional, based on layers)
  character.url = encodeURIComponent(
    "https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/#?" +
      character.layers
        .map((layer) => `${layer.parentName}=${layer.name}_${layer.variant}`)
        .join("&"),
  );
  console.log("Generated character URL:", character.url);

  // Save the generated JSON
  fs.writeFileSync(outputFile, JSON.stringify(character, null, 2));
  console.log(`Random character JSON saved to: ${outputFile}`);
}

// CLI handling
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error(
    "Usage: node generate_random_character.js <input_dir> <output_file>",
  );
  process.exit(1);
}

const [inputDir, outputFile] = args;
generateRandomCharacter(inputDir, outputFile);
