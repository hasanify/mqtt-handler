import "dotenv/config";
import "module-alias/register";

import handleMqtt from "@/handler";
import { readFileSync } from "fs";
import path from "path";

const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
console.log("--------------------------------------------");
console.log(`Started v${packageJson.version}! 🚀`);
console.log("--------------------------------------------");
handleMqtt();
