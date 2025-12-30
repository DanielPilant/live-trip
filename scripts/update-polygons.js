const path = require("path");
// This tells the script: "Look for .env one folder up (..) from where I am (__dirname)"
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");

// 1. Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role to bypass RLS if needed
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Config
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const SLEEP_MS = 2000; // 2 seconds delay to be safe with Overpass Rate Limits

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function updateSites() {
  console.log("🚀 Starting Polygon update script...");

  // 3. Fetch sites that don't have a Polygon yet
  // We explicitly select the ID and the location column
  const { data: sites, error } = await supabase
    .from("sites")
    .select("id, location")
    .is("polygon", null); // Only sites without a polygon

  if (error) {
    console.error("❌ Error fetching sites:", error);
    return;
  }

  console.log(`found ${sites.length} sites to update.`);

  for (const site of sites) {
    // 4. Extract Lat/Lng safely
    // adjusting for common json formats: {lat, lng} or {latitude, longitude}
    const lat = site.location.lat || site.location.latitude;
    const lng = site.location.lng || site.location.longitude;

    if (!lat || !lng) {
      console.warn(
        `⚠️ Skipping Site ID ${site.id}: Invalid location JSON`,
        site.location
      );
      continue;
    }

    console.log(
      `\nProcessing Site (${sites.indexOf(site) + 1}/${sites.length}): ${
        site.id
      } (${lat}, ${lng})`
    );

    try {
      // 5. Run the Overpass Query
      const osmData = await fetchOverpassPolygon(lat, lng);

      if (osmData && osmData.elements && osmData.elements.length > 0) {
        // We take the first result as requested
        const firstElement = osmData.elements[0];

        // 6. Update the Database
        const { error: updateError } = await supabase
          .from("sites")
          .update({ polygon: firstElement }) // Storing the raw OSM element
          .eq("id", site.id);

        if (updateError)
          console.error(
            `❌ DB Update Failed for ${site.id}:`,
            updateError.message
          );
        else console.log(`✅ Success! Updated Polygon for ${site.id}`);
      } else {
        console.log(`🤷 No containing area found for coordinates.`);
      }
    } catch (err) {
      console.error(`❌ API Error for ${site.id}:`, err.message);
    }

    // 7. SLEEP to respect Overpass API limits
    await sleep(SLEEP_MS);
  }

  console.log("\n🏁 Script finished.");
}

async function fetchOverpassPolygon(lat, lng, retries = 5) {
  // Your exact query, dynamically injecting lat/lng
  const query = `
    [out:json][timeout:25];
    is_in(${lat},${lng})->.containingAreas;
    (
      area.containingAreas[amenity];
      area.containingAreas[landuse];
      area.containingAreas[place];
      area.containingAreas[leisure];
    )->.potentialAreas;
    (
      area.potentialAreas[admin_level!~".*"];
      area.potentialAreas[boundary!=administrative];
    )->.bestAreas;
    (
      way(pivot.bestAreas);
      relation(pivot.bestAreas);
    );
    out geom 1;
  `;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.post(
        OVERPASS_URL,
        `data=${encodeURIComponent(query)}`,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      return response.data;
    } catch (error) {
      if (i === retries - 1) throw error; // Throw if it's the last attempt
      console.warn(
        `⚠️ API Error (Attempt ${i + 1}/${retries}). Retrying in 2s...`,
        error.message
      );
      await sleep(2000);
    }
  }
}

updateSites();
