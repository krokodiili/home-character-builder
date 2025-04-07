#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

async function generateCharacter(jsonPath) {
  const outputPath = path.join(__dirname, "output.png");
  const oldFileExists = fs.existsSync(outputPath);

  if (oldFileExists) {
    fs.unlinkSync(outputPath);
  }

  console.log(`Generating character PNG using Puppeteer from: ${jsonPath}`);

  const browser = await puppeteer.launch({
    args: ["--disable-web-security", "--allow-file-access-from-files"],
    // headless: false,
  });
  const context = browser.defaultBrowserContext();
  await context
    .overridePermissions(`file://${__dirname}`, [
      "clipboard-write",
      "clipboard-read",
      "clipboard-sanitized-write",
    ])
    .catch((err) => {
      console.error("Error overriding permissions:", err);
    });

  const page = await browser.newPage();

  // Load the HTML file in the same folder
  const htmlPath = path.join(__dirname, "index.html");
  await page.goto(`file://${htmlPath}`);

  // Read JSON data
  const jsonData = fs.readFileSync(jsonPath, "utf8");

  // Interact with the page
  await page.evaluate(async (data) => {
    // Simulate clicking "Import from Clipboard" and providing JSON
    const importButton = document.querySelector("button.importFromClipboard");
    await navigator.clipboard.writeText(data);
    await importButton.click();
  }, jsonData);

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Wait for the "Spritesheet single image" button to be enabled and click it
  await page.waitForSelector("a#saveAsPNG:not([disabled])");
  await page.click("a#saveAsPNG:not([disabled])");

  // Wait for the canvas or image to be generated
  const canvasSelector = "canvas#spritesheet"; // Adjust selector if needed
  await page.waitForSelector(canvasSelector);

  // Extract the image data from the canvas
  const imageData = await page.evaluate((selector) => {
    const canvas = document.querySelector(selector);
    return canvas.toDataURL("image/png");
  }, canvasSelector);

  // Decode the base64 image data and save it as a PNG file
  const base64Data = imageData.replace(/^data:image\/png;base64,/, "");
  const outputExists = fs.existsSync(outputPath, base64Data, "base64");
  fs.writeFileSync(outputPath, base64Data, "base64");

  console.log(`Character PNG saved to: ${outputPath}`);

  await browser.close();
}

// CLI handling
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node generate_character.js <input.json>");
  process.exit(1);
}

const [jsonPath] = args;
generateCharacter(jsonPath).catch((err) => {
  console.error("Error generating character:", err);
});
