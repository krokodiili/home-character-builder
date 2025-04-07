#!/usr/bin/env node

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
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// Main function to generate a random character JSON
function generateRandomCharacter(inputDir, outputFile) {
  const jsonFiles = getJsonFiles(inputDir);

  // Group files by layer type (e.g., "hair", "body", etc.)
  const layers = {};

  const ignoredLayers = [
    "sash",
    "tail",
    "wheelchair",
    "dress_sleeves",
    "chainmail",
    "prosthesis_hand",
    "prosthesis_leg",
  ];

  jsonFiles.forEach((file) => {
    const filePath = path.join(inputDir, file);
    const jsonData = readJsonFile(filePath);

    const layerType = jsonData.type_name;

    if (ignoredLayers.includes(layerType)) {
      console.log("Ignoring layer:", layerType);
      return;
    }

    if (!layers[layerType]) layers[layerType] = [];

    layers[layerType].push(file);
  });

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

  const conditionalLayerPairs = {
    backpack_straps: "backpack",
    sash_tied: "sash",
    cape_trim: "cape",
    dress_sleeves: "dress",
    dress_trim: "dress",
    shoes_toes: "shoes",
    bandana_overlay: "bandana",
    hat_accessory: "hat",
    hat_trim: "hat",
    hat_overlay: "hat",
    hat_buckle: "hat",
    dress_sleeves_trim: "dress",
    hairtie_rune: "hair",
    headcover_rune: "headcover",
    shield_paint: "shield",
    shield_pattern: "shield",
    shield_trim: "shield",
    jacket_trim: "jacket",
    jacket_collar: "jacket",
    jacket_pockets: "jacket",
    wings_dots: "wings",
    wings_edge: "wings",
  };

  const sex = pickRandom(["male", "female", "muscular"]);
  // Process each layer type
  for (const [layerType, files] of Object.entries(layers)) {
    const isConditionalLayer = Object.keys(conditionalLayerPairs).includes(
      layerType,
    );

    if (isConditionalLayer) {
      //TODO: Implement conditional layer handling
      continue;
    }

    if (!mainLayers.includes(layerType) && !isConditionalLayer) {
      const coinflip = Math.random() > 0.8;
      if (!coinflip) continue;
    }

    const randomFile = pickRandom(files);
    const filePath = path.join(inputDir, randomFile);
    const jsonData = readJsonFile(filePath);

    if (jsonData.name.includes("'"))
      if (!jsonData.layer_1[sex]) {
        continue;
      }

    console.log("Processing layer type:", layerType);

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

    if (!jsonData.ids[randomVariant]) {
      console.log("Ignoring layer with no id:", jsonData.name);
      continue;
    }

    // Add layer information
    character.layers.push({
      fileName: jsonData.fileName,
      zPos: jsonData.layer_1.zPos,
      parentName: jsonData.type_name,
      name: jsonData.name,
      variant: randomVariant,
      id: jsonData.ids[randomVariant],
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

  ///home/melty/personal/home-character-builder/index.html#?body=Body_color_light&head=Minotaur_light&wound_ribs=Ribs_ribs&prosthesis_hand=Hook_hand_hook&wings_edge=Monarch_Wings_Edge_red&wings=Pixie_Wings_orange&expression=Blush_light&eyes=Child_Eyes_gray&mustache=French_Mustache_dark_gray&hair=Bangsshort_green&bandana=Bandana_navy&hat=Christmas_Hat_bluegray&visor=Horned_visor_steel&facial_eyes=Round_Glasses_green&neck=Scarf_gray&dress=Sash_dress_teal&dress_sleeves=Kimono_Oversized_Sleeves_white&clothes=Sleeveless_2_Polo_charcoal&bandages=Bandages_white&chainmail=Chainmail_gray&cape=Tattered_green&backpack=Square_pack_white&cargo=Wood_3_logs&belt=Other_belts_black&sash=Obi_walnut&legs=Cuffed_Pants_black&apron=Overskirt_brown&shoes=Armour_copper&shield=Crusader_shield_crusader
  // Generate URL (optional, based on layers)
  character.url =
    `https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/#?sex=${sex}` +
    character.layers
      .map((layer) => {
        return `&${layer.parentName}=${escape(layer.id)}`;
      })
      .join("");

  console.log("Generated character URL:", encodeURI(character.url));

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
