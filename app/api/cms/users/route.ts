import { env } from 'cloudflare:workers';
import config from '../../../../cms/config.json';
import {createUserHandler} from '../../../../cms/user-management.mjs';
// Read the deployed Worker binding at request time, not a build-time env value.
function userManagementSecret(){
 const bindings = env as { SUPABASE_SERVICE_ROLE_KEY?: string };
 return bindings.SUPABASE_SERVICE_ROLE_KEY;
}
export async function POST(request:Request){
 return createUserHandler(request,{config,secret:userManagementSecret()});
}
export async function DELETE(request:Request){
 const {deleteUserHandler}=await import('../../../../cms/user-management.mjs');
 return deleteUserHandler(request,{config,secret:userManagementSecret()});
}
