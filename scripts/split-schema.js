const fs = require("fs");
const path = require("path");

// 1. Config
const INPUT_FILE = path.join(__dirname, "../supabase/schema/full_dump.sql");
const OUTPUT_DIR = path.join(__dirname, "../supabase/schema");

async function splitSchema() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(
      "❌ full_dump.sql not found! Run 'npx supabase db dump' first."
    );
    return;
  }

  const sqlContent = fs.readFileSync(INPUT_FILE, "utf8");

  // 2. Regex to find CREATE TABLE statements
  // This looks for "CREATE TABLE " followed by the table name
  const tableRegex =
    /CREATE TABLE IF NOT EXISTS "?public"?\."?(\w+)"? \(([\s\S]*?);\n/g;

  let match;
  let count = 0;

  console.log("✂️  Splitting schema into individual files...");

  while ((match = tableRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const tableDefinition = match[0]; // The full SQL statement

    // 3. Write to separate file
    const filePath = path.join(OUTPUT_DIR, `${tableName}.sql`);
    fs.writeFileSync(filePath, tableDefinition);

    console.log(`   --> Created ${tableName}.sql`);
    count++;
  }

  console.log(`✅ Done! Extracted ${count} tables to ${OUTPUT_DIR}`);
}

splitSchema();