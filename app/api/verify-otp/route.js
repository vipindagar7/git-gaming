import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { OTP } from '@/lib/models';

export async function POST(request) {
    try {
        const { contact, otp } = await request.json();

        if (!contact || !otp) {
            return NextResponse.json(
                { success: false, message: 'contact and otp are required' },
                { status: 400 }
            );
        }

        await connectDB();

        const record = await OTP.findOne({ contact });

        if (!record) {
            return NextResponse.json(
                { success: false, message: 'No OTP found. Please request a new one.' },
                { status: 400 }
            );
        }

        if (new Date() > record.expiresAt) {
            await OTP.findOneAndDelete({ contact });
            return NextResponse.json(
                { success: false, message: 'OTP has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        if (record.otp !== otp) {
            return NextResponse.json(
                { success: false, message: 'Invalid OTP. Please try again.' },
                { status: 400 }
            );
        }

        // OTP valid — delete it so it can't be reused
        await OTP.findOneAndDelete({ contact });

        return NextResponse.json({ success: true, message: 'OTP verified successfully' });
    } catch (err) {
        console.error('verify-otp error:', err);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}