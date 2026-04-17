import { NextResponse } from 'next/server';
import otpGenerator from 'otp-generator';
import { connectDB } from '@/lib/db';
import { OTP } from '@/lib/models';
import { sendOTP } from '@/lib/sendOtp';

export async function POST(request) {
    try {
        const { contact } = await request.json();

        if (!contact || !/^\d{10}$/.test(contact)) {
            return NextResponse.json(
                { success: false, message: 'Valid 10-digit number required' },
                { status: 400 }
            );
        }

        await connectDB();

        const otp = otpGenerator.generate(6, {
            digits: true,
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Delete any existing OTP for this contact, then create fresh
        await OTP.findOneAndDelete({ contact });
        await OTP.create({ contact, otp, expiresAt });

        console.log(otp)
       await sendOTP(contact, otp); 
       
       // Implement this function to call your SMS API
        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully',
           // ← REMOVE in production
        });
    } catch (err) {
        console.error('send-otp error:', err);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
}