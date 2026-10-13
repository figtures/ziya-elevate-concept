import seed from '../../../cms/seed.json';
import schema from '../../../cms/installation-schema.json';
import {installationSQL} from '../../../cms/installation.mjs';
const headers={
 'Content-Type':'text/plain; charset=utf-8',
 'Content-Disposition':'attachment; filename="ziya-cms-kurulum.sql"',
 'Cache-Control':'no-store',
 'X-Robots-Tag':'noindex, nofollow, noarchive',
 'X-Content-Type-Options':'nosniff'
};
export function GET(){return new Response(installationSQL(seed,schema),{headers});}
export function HEAD(){return new Response(null,{headers});}
