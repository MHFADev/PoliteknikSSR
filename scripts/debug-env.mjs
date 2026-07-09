import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const result = config({ path: resolve(__dirname, "../.env.local") });
console.log("Dotenv Result:", result);
console.log("\nNEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("SUPABASE_SERVICE_ROLE_KEY (start):", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20));
