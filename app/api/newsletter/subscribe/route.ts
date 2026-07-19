import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Subscriber } from '@/lib/models';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email address is required.', data: {}, errors: ['Missing email'] }, { status: 400 });
    }

    const cleanEmail = email.toString().trim().toLowerCase();

    if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
      return NextResponse.json({ success: false, message: 'Invalid email address format.', data: {}, errors: ['Invalid email format'] }, { status: 400 });
    }

    const existing = await Subscriber.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json({ success: true, message: 'You are already subscribed to the newsletter!', data: { alreadySubscribed: true } });
    }

    const subscriber = new Subscriber({
      email: cleanEmail,
      subscribedAt: new Date()
    });
    await subscriber.save();

    return NextResponse.json({
      success: true,
      message: 'Subscribed to the newsletter successfully!',
      data: { subscriber },
      errors: []
    });

  } catch (error: any) {
    console.error('Newsletter Subscribe API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to register subscription.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}
