import { customerSession } from '@/lib/shop/server';
export async function GET(){const user=await customerSession();return Response.json({signedIn:!!user},{headers:{'Cache-Control':'private, no-store'}});}
