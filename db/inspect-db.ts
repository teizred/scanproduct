import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  console.log("Inspecting database tables and columns...");
  try {
    const { db } = await import("./index");
    
    // List all tables
    const tables = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("\nTables in database:");
    console.log(tables.rows.map((r: any) => r.table_name));

    // List users columns
    const columns = await db.execute(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
    `);
    console.log("\nColumns in 'users' table:");
    console.log(columns.rows);

    // List drizzle migrations table contents if it exists
    try {
      const migrations = await db.execute("SELECT * FROM __drizzle_migrations");
      console.log("\n__drizzle_migrations table content:");
      console.log(migrations.rows);
    } catch (e) {
      console.log("\n__drizzle_migrations table does not exist or cannot be read:", (e as Error).message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Inspection failed:", error);
    process.exit(1);
  }
}

main();
