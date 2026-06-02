import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = path
  .join(root, "src", "sandbox", "test-input.sample.json")
  .replace(/\\/g, "/");
const volume = `${inputPath}:/usr/src/app/input.json:ro`;

process.stderr.write(
  `[sandbox:test] docker run -v ${volume} certia-sandbox\n`,
);

const output = execFileSync(
  "docker",
  ["run", "--rm", "--network", "none", "-m", "128m", "-v", volume, "certia-sandbox"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);

process.stdout.write(output);
