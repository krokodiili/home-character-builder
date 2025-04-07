const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

// Paths
const indexHtmlPath = path.join(__dirname, "index.html");
const sheetDefinitionsDir = path.join(__dirname, "sheet_definitions");

// Parse the index.html file
const indexHtmlContent = fs.readFileSync(indexHtmlPath, "utf-8");
const dom = new JSDOM(indexHtmlContent);
const document = dom.window.document;

// Extract id and parentName from radio inputs and group by parentName
const radioInputs = Array.from(
  document.querySelectorAll('input[type="radio"]'),
);
const radioData = radioInputs.reduce((acc, radio) => {
  const id = radio.id;
  const parentName = radio.getAttribute("parentName");
  if (id && parentName) {
    if (!acc[parentName]) {
      acc[parentName] = [];
    }
    acc[parentName].push(id);
  }
  return acc;
}, {});

// Process each JSON file in the sheet_definitions directory
fs.readdirSync(sheetDefinitionsDir).forEach((file) => {
  if (file.endsWith(".json")) {
    const jsonPath = path.join(sheetDefinitionsDir, file);

    // Load the JSON file
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    // Replace spaces with underscores in the "name" value
    const jsonName = jsonData.name?.replace(/ /g, "_");

    // Find matching ids for the name
    if (radioData[jsonName]) {
      const data = radioData[jsonName];

      const variantIdMap = data.reduce((acc, id) => {
        // const idSplit = id.split("_");
        // const variant = idSplit[idSplit.length - 1];
        const variant = jsonData.variants.find((variant) =>
          id.includes(variant),
        );

        acc[variant] = id;
        return acc;
      }, {});

      jsonData.ids = variantIdMap; // Assign the object of variants and ids

      // Save the updated JSON file
      fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), "utf-8");
    } else {
      // delete the file
      fs.rmSync(jsonPath);
      console.log(`Deleted ${jsonPath}`);
    }
  }
});
