import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { StudentGaming } from '@/lib/models';

export async function POST(request) {
  try {
    const { name, contact, altContact, type } = await request.json();

    if (!name || !contact || !type) {
      return NextResponse.json(
        { success: false, message: 'name, contact and type are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await StudentGaming.create({ name, contact, altContact, type });

    return NextResponse.json(
      { success: true, message: 'StudentGaming registered successfully', user },
      { status: 201 }
    );
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'This contact number is already registered.' },
        { status: 409 }
      );
    }
    console.error('register error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// export async function GET() {
//   try {
//     await connectDB();
//     const users = await StudentGaming.find().sort({ createdAt: -1 });
//     return NextResponse.json({ success: true, users });
//   } catch (err) {
//     console.error('fetch users error:', err);
//     return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
//   }
// }