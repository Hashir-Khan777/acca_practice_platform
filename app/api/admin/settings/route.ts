import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Settings, AuditLog } from '@/lib/models';
import { getAuthUser } from '@/lib/jwt';

async function checkAdmin(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== 'admin') return null;
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role
  };
}

// ==========================================
// GET: READ SYSTEM SETTINGS
// ==========================================
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const settings = await Settings.find();
    
    // Map list to key-value object
    const config: any = {};
    settings.forEach((s: any) => {
      config[s.key] = s.value;
    });

    // Provide default fallbacks if database is not fully initialized
    const data = {
      monthlyPrice: config.monthlyPrice || '19',
      aiThrottling: config.aiThrottling || '50',
      activeLlmTarget: config.activeLlmTarget || 'gemini-3.5-flash'
    };

    return NextResponse.json({
      success: true,
      message: 'Global system configurations retrieved.',
      data,
      errors: []
    });

  } catch (error: any) {
    console.error('Admin GET Settings Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve system settings.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}

// ==========================================
// PUT: SAVE SYSTEM SETTINGS
// ==========================================
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const admin = await checkAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin role required.', data: {}, errors: ['Forbidden'] }, { status: 403 });
    }

    const body = await req.json();
    const { monthlyPrice, aiThrottling, activeLlmTarget } = body;

    const updates = [
      { key: 'monthlyPrice', value: monthlyPrice || '19' },
      { key: 'aiThrottling', value: aiThrottling || '50' },
      { key: 'activeLlmTarget', value: activeLlmTarget || 'gemini-3.5-flash' }
    ];

    for (const item of updates) {
      await Settings.findOneAndUpdate(
        { key: item.key },
        { value: item.value },
        { upsert: true, new: true }
      );
    }

    // Create Audit Log
    const audit = new AuditLog({
      user: admin.email,
      action: 'SETTINGS_UPDATE',
      details: 'Updated global system pricing and AI throttling settings.',
      timestamp: new Date()
    });
    await audit.save();

    return NextResponse.json({
      success: true,
      message: 'Global system configurations successfully synchronized.',
      data: {
        monthlyPrice,
        aiThrottling,
        activeLlmTarget
      },
      errors: []
    });

  } catch (error: any) {
    console.error('Admin PUT Settings Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update system settings.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 550 });
  }
}
