import { config,catalog,seed } from '../../../../cms/server';
import media from '../../../../cms/media-seed.json';
export function GET(){return Response.json({config,catalog,seed,media},{headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff'}});}
