// GET /api/air-quality?city=tashkent
// Server-side proxy to the optional live air-quality provider. The token stays
// on the server. Without a token the endpoint answers { status: 'unconfigured' }
// and the UI shows an honest "no live data" state — never made-up numbers.

import { AIR_QUALITY } from '@/config/dataSources';
import { getCityById } from '@/data/cities';
import { normalizeWaqi } from '@/lib/airQuality/waqi';

export const dynamic = 'force-dynamic';

const json = (body, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET(request) {
  const cityId = new URL(request.url).searchParams.get('city');
  const city = getCityById(cityId);
  if (!city) return json({ status: 'error', reason: 'unknown-city' }, 400);

  const token = process.env[AIR_QUALITY.tokenEnvVar];
  if (!token) return json({ status: 'unconfigured' });

  const url = `${AIR_QUALITY.endpoint}/geo:${city.lat};${city.lon}/?token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: AIR_QUALITY.revalidateSeconds },
      signal: AbortSignal.timeout(AIR_QUALITY.requestTimeoutMs),
    });
    if (!res.ok) return json({ status: 'error', reason: `upstream-${res.status}` }, 502);
    const payload = await res.json();
    const normalized = normalizeWaqi(payload, city, AIR_QUALITY);
    return json(normalized, normalized.status === 'error' ? 502 : 200);
  } catch (error) {
    const reason = error?.name === 'TimeoutError' ? 'timeout' : 'network';
    return json({ status: 'error', reason }, 502);
  }
}
