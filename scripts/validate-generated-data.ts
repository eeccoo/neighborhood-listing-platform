import {
  readFileSync,
  writeFileSync,
} from "node:fs";

import { PropertyCollectionSchema } from "../src/schemas/property-data";

const inputPath = "data/generated/properties.raw.json";
const outputPath =
  "data/generated/properties.validated.json";

let unvalidatedData: unknown;

try {
  unvalidatedData = JSON.parse(
    readFileSync(inputPath, "utf8"),
  );
} catch (error) {
  console.error("JSON parsing failed:", error);
  process.exit(1);
}

const result =
  PropertyCollectionSchema.safeParse(unvalidatedData);

if (!result.success) {
  console.error("Property validation failed:");

  for (const issue of result.error.issues) {
    const field =
      issue.path.length > 0
        ? issue.path.join(".")
        : "(root)";

    console.error(`- ${field}: ${issue.message}`);
  }

  process.exit(1);
}

writeFileSync(
  outputPath,
  `${JSON.stringify(result.data, null, 2)}\n`,
  "utf8",
);

console.log(
  `Validation passed: ${result.data.length} property records`,
);
console.log(`Wrote ${outputPath}`);