const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

if (!MAPTILER_KEY) {
  console.warn("MapTiler key is missing! Map may not load correctly.");
}

export const lightStyle = `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`;
export const darkStyle = `https://api.maptiler.com/maps/basic-v2-dark/style.json?key=${MAPTILER_KEY}`;
