import { toNodeHandler } from "./_lib/node";
import { weather } from "./_lib/openweather";

export default toNodeHandler(weather, () => process.env.OPENWEATHER_API_KEY);
