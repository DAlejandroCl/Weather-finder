import { toNodeHandler } from "./_lib/node";
import { geocode } from "./_lib/openweather";

export default toNodeHandler(geocode, () => process.env.OPENWEATHER_API_KEY);
