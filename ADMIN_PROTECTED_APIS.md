// Script to add admin protection to multiple API endpoints
// This is a helper file - the actual protection is in each endpoint

const ADMIN_PROTECTED_ENDPOINTS = [
    'gallery/upload.ts',
    'products/upload.ts',
    'popups/upload.ts',
    'categories/upload.ts',
    'categories/create.ts',
    'orders/update-status.ts',
    'newsletter/send-campaign.ts'
];

// Each of these endpoints should have:
// 1. Import: import { verifyAdminSession, unauthorizedResponse } from '../../../lib/auth';
// 2. At start of handler:
//    const session = await verifyAdminSession(context);
//    if (!session) return unauthorizedResponse();
