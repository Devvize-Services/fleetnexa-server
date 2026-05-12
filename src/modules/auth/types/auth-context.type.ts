import { Tenant, User } from 'src/generated/prisma/client.js';

export interface AuthContext {
  tenant: Tenant;
  user: User;
}
