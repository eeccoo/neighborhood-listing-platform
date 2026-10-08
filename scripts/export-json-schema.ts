import { mkdirSync, writeFileSync } from "node:fs";

import { z } from "zod";

import { PropertyCollectionSchema } from "../src/schemas/property-data";

const outputDirectory = "schemas";
const outputPath =
  `${outputDirectory}/property-collection.schema.json`;

const generatedSchema = z.toJSONSchema(
  PropertyCollectionSchema,
  {
    target: "draft-2020-12",
  },
);

const documentedSchema = {
  $id: "https://example.com/schemas/property-collection.schema.json",
  title: "Synthetic Property Collection",
  description:
    "Five fictional property records validated before entering the UI or database.",
  ...generatedSchema,
};

mkdirSync(outputDirectory, { recursive: true });

writeFileSync(
  outputPath,
  `${JSON.stringify(documentedSchema, null, 2)}\n`,
  "utf8",
);

console.log(`Generated ${outputPath}`);