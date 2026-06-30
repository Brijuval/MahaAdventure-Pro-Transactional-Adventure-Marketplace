import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CUSTOMER', 'OPERATOR']).default('CUSTOMER'),
  companyName: z.string().optional(),
}).refine(data => {
  if (data.role === 'OPERATOR' && (!data.companyName || data.companyName.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'Company name is required for operators',
  path: ['companyName'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
