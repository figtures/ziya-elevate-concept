import config from '../../../../cms/config.json';
import {createUserHandler} from '../../../../cms/user-management.mjs';
export async function POST(request:Request){
 return createUserHandler(request,{config,secret:process.env.SUPABASE_SERVICE_ROLE_KEY});
}
