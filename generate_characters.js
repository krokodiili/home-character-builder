#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Helper to ensure a directory exists
function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Main function to batch generate characters
async function batchGenerateCharacters(inputDir, outputDir, count) {
  ensureDirectory(outputDir);

  for (let i = 0; i < count; i++) {
    const jsonFile = path.join(__dirname, outputDir, `character_${i + 1}.json`);
    const pngFile = path.join(__dirname, outputDir, `character_${i + 1}.png`);

    console.log(`Generating character ${i + 1}...`);

    // Generate JSON file
    execSync(`node generate_character_json.js ${inputDir} ${jsonFile}`, {
      stdio: "inherit",
    });

    // Generate PNG file
    execSync(`node generate_character.js ${jsonFile}`, { stdio: "inherit" });

    // Move PNG file to the output directory
    const generatedPng = path.join(__dirname, "output.png");
    fs.renameSync(generatedPng, pngFile);

    console.log(
      `Character ${i + 1} saved: JSON -> ${jsonFile}, PNG -> ${pngFile}`,
    );
  }

  console.log(`All ${count} characters generated and saved to: ${outputDir}`);
}

// CLI handling
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error(
    `use it like this : node batch_generate_characters.js sheet_definitions characters 10`,
  );
  process.exit(1);
}

const [inputDir, outputDir, count] = args;
batchGenerateCharacters(inputDir, outputDir, parseInt(count, 10)).catch(
  (err) => {
    console.error("Error generating characters:", err);
    console.info(
      `use it like this : node batch_generate_characters.js sheet_definitions characters 10`,
    );
  },
);
