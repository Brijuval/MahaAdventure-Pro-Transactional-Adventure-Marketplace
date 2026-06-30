import { NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/validators/authSchema';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Zod input validation
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.format() 
        }, 
        { status: 400 }
      );
    }
    
    const { username, email, password, role, companyName } = validation.data;
    
    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 4. Create user (and operator profile if operator role is requested)
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role,
        },
      });
      
      if (role === 'OPERATOR') {
        await tx.operatorProfile.create({
          data: {
            userId: user.id,
            companyName: companyName || `${username}'s Travel Co`,
            isApproved: false, // Operators require Admin approval before listing
          },
        });
      }
      
      return user;
    });
    
    // 5. Sign JWT token
    const token = await signToken({
      userId: result.id,
      role: result.role,
      email: result.email,
      username: result.username,
    });
    
    // 6. Set token in HTTP-only cookie
    const response = NextResponse.json(
      { 
        message: 'Registration successful',
        user: {
          id: result.id,
          username: result.username,
          email: result.email,
          role: result.role,
        }
      },
      { status: 201 }
    );
    
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
    
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
