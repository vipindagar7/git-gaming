import { NextResponse } from 'next/server';
import otpGenerator from 'otp-generator';
import { connectDB } from '@/lib/db';
import { OTP } from '@/lib/models';
import twilio from 'twilio';

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

        // TODO (production): replace with Twilio / MSG91
        // Twilio
        
        const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
        await client.messages.create({
            to: `+91${contact}`,
            from: process.env.TWILIO_FROM,
            body: `Your OTP is ${otp}. Valid for 5 minutes.`,
        });

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