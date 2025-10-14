# 🔄 Demo Reset System

**Purpose**: Automatically reset demo instance to clean state on a schedule or on-demand.

---

## 🎯 **Requirements**

### **What Needs to Reset**
- ✅ Delete all user-generated questions
- ✅ Delete all upvotes
- ✅ Reset demo user data (keep users, reset their activity)
- ✅ Preserve demo users (alice, bob, moderator, admin)
- ✅ Preserve teams (General, Engineering, Product, People)
- ✅ Preserve tags
- ✅ Re-seed sample questions

### **What to Preserve**
- ✅ Demo users (credentials stay the same)
- ✅ Teams (structure stays the same)
- ✅ Tags (categories stay the same)
- ✅ Team memberships

---

## 🔐 **Security Approach**

### **Option 1: Use Existing ADMIN_KEY** (Recommended)
- Endpoint: `POST /admin/reset-demo`
- Authentication: `x-admin-key` header with `ADMIN_KEY`
- **Pros**: Reuses existing auth, no new secret to manage
- **Cons**: Shares key with other admin endpoints

### **Option 2: Dedicated Reset Token**
- Endpoint: `POST /admin/reset-demo`
- Authentication: `x-demo-reset-token` header with `DEMO_RESET_TOKEN`
- New environment variable: `DEMO_RESET_TOKEN`
- **Pros**: Separate token for reset only
- **Cons**: Another secret to manage

**Recommendation**: Use **Option 1** (ADMIN_KEY) since it's already secure and scoped to admin operations.

---

## 🛠️ **Implementation**

### **Backend: API Endpoint**

**Location**: `api/src/app.ts`

```typescript
/**
 * POST /admin/reset-demo
 * Resets demo instance to clean state
 * Requires: x-admin-key header
 */
app.post('/admin/reset-demo', async (req, res) => {
  try {
    // 1. Check if demo mode is enabled
    if (!authManager.isModeEnabled('demo')) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: 'Demo mode is not enabled',
      });
    }

    // 2. Verify admin key
    const adminKey = req.headers['x-admin-key'] as string;
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Invalid or missing admin key',
      });
    }

    // 3. Get tenant ID
    const tenantId = req.tenant?.tenantId;
    if (!tenantId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Tenant not resolved',
      });
    }

    console.log('🔄 Starting demo reset...');

    // 4. Delete user-generated data (in transaction)
    await prisma.$transaction(async (tx) => {
      // Delete upvotes
      await tx.questionUpvote.deleteMany({
        where: { tenantId },
      });

      // Delete question tags
      await tx.questionTag.deleteMany({
        where: { 
          question: { tenantId } 
        },
      });

      // Delete questions
      await tx.question.deleteMany({
        where: { tenantId },
      });

      // Delete audit logs (optional - keeps history clean)
      await tx.auditLog.deleteMany({
        where: { tenantId },
      });

      console.log('✅ Cleared existing data');
    });

    // 5. Re-seed demo data
    const { seedDemoData } = await import('./seed-multi-tenant-data.js');
    await seedDemoData(prisma, tenantId);

    console.log('✅ Re-seeded demo data');

    // 6. Return success
    res.json({
      success: true,
      message: 'Demo instance reset successfully',
      timestamp: new Date().toISOString(),
      resetItems: {
        questionsCleared: true,
        upvotesCleared: true,
        auditLogsCleared: true,
        demoDataReseeded: true,
      },
    });

    console.log('🎉 Demo reset complete');
  } catch (error) {
    console.error('❌ Demo reset failed:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to reset demo instance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
```

### **Seed Script Updates**

**Update**: `api/src/seed-multi-tenant-data.ts`

Make it exportable and reusable:

```typescript
/**
 * Export main seeding function for reuse
 */
export async function seedDemoData(
  prisma: PrismaClient, 
  tenantId: string
): Promise<void> {
  // Existing seeding logic here
  // Create questions, assign tags, etc.
}

// If run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findFirst();
  if (tenant) {
    await seedDemoData(prisma, tenant.id);
  }
  await prisma.$disconnect();
}
```

---

## 📅 **Scheduling Options**

### **Option A: GitHub Actions** (Recommended)

**Pros**:
- ✅ Free (GitHub Actions minutes)
- ✅ Version controlled
- ✅ Easy to modify schedule
- ✅ Can trigger manually
- ✅ Logs visible in GitHub

**File**: `.github/workflows/reset-demo.yml`

```yaml
name: Reset Demo Instance

on:
  schedule:
    # Run daily at 3 AM UTC (11 PM EST)
    - cron: '0 3 * * *'
  
  # Allow manual trigger
  workflow_dispatch:

jobs:
  reset-demo:
    runs-on: ubuntu-latest
    
    steps:
      - name: Reset demo instance
        run: |
          curl -X POST https://api-demo.pulsestage.app/admin/reset-demo \
            -H "x-admin-key: ${{ secrets.ADMIN_KEY }}" \
            -H "Content-Type: application/json"
      
      - name: Verify reset
        run: |
          # Check that demo is healthy after reset
          curl https://api-demo.pulsestage.app/health/ready
      
      - name: Notify on failure
        if: failure()
        run: |
          echo "Demo reset failed! Check logs."
          # Could add Slack/Discord notification here
```

**Setup**:
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add secret: `ADMIN_KEY` (same as Render environment variable)
3. Commit workflow file
4. Test with "Run workflow" button

---

### **Option B: Render Cron Job**

**Pros**:
- ✅ Built into Render
- ✅ No external dependencies
- ✅ Runs close to the database

**Cons**:
- ❌ Requires separate Render service ($7/month)
- ❌ Less flexible than GitHub Actions

**Setup**:
1. Create new Render service → "Cron Job"
2. Connect same repo
3. **Command**: 
   ```bash
   curl -X POST https://api-demo.pulsestage.app/admin/reset-demo \
     -H "x-admin-key: $ADMIN_KEY"
   ```
4. **Schedule**: Daily at 3 AM UTC
5. Add `ADMIN_KEY` environment variable

---

### **Option C: Render Shell Script**

**Pros**:
- ✅ Free (runs in existing API service)
- ✅ Direct database access (faster)

**File**: `api/scripts/reset-demo.sh`

```bash
#!/bin/bash
set -e

echo "🔄 Resetting demo data..."

# Run reset script
node dist/scripts/reset-demo.js

echo "✅ Demo reset complete"
```

**Schedule**: Use Render's built-in cron or external cron-job.org

---

## 🧪 **Testing the Reset**

### **Manual Test**

```bash
# Test reset endpoint
curl -X POST https://api-demo.pulsestage.app/admin/reset-demo \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json"

# Expected response:
{
  "success": true,
  "message": "Demo instance reset successfully",
  "timestamp": "2025-10-14T...",
  "resetItems": {
    "questionsCleared": true,
    "upvotesCleared": true,
    "auditLogsCleared": true,
    "demoDataReseeded": true
  }
}
```

### **Verification Steps**

After reset:
1. Visit `https://demo.pulsestage.app`
2. Login as Alice
3. Verify you see exactly 12 sample questions (or your seeded count)
4. Check each team has questions
5. Verify no user-submitted questions remain

---

## 📊 **Monitoring**

### **Add Metrics**

Track reset operations:
```typescript
// In endpoint
const resetCount = await redis.incr('demo:reset:count');
await redis.set('demo:reset:last', new Date().toISOString());

// Add to /admin/health endpoint
const lastReset = await redis.get('demo:reset:last');
const resetCount = await redis.get('demo:reset:count');
```

### **Logs**

The endpoint logs:
- `🔄 Starting demo reset...`
- `✅ Cleared existing data`
- `✅ Re-seeded demo data`
- `🎉 Demo reset complete`

Check in Render: Dashboard → API Service → Logs

---

## 🚨 **Safety Features**

### **1. Demo Mode Check**
- Endpoint only works if `AUTH_MODE_DEMO=true`
- Prevents accidental reset of production instances

### **2. Admin Authentication**
- Requires `ADMIN_KEY` header
- Invalid key returns 401 Unauthorized

### **3. Transaction Safety**
- All deletions in a single transaction
- If any step fails, entire reset rolls back

### **4. Preserves Core Structure**
- Never deletes users, teams, or tags
- Only clears questions and upvotes

---

## 📝 **Implementation Checklist**

- [ ] Create reset endpoint in `api/src/app.ts`
- [ ] Update seed script to be exportable
- [ ] Test locally with `make dev`
- [ ] Deploy to Render
- [ ] Test reset endpoint with curl
- [ ] Create GitHub Actions workflow
- [ ] Add `ADMIN_KEY` to GitHub Secrets
- [ ] Test workflow manually
- [ ] Enable scheduled run
- [ ] Monitor first few resets
- [ ] Document in main README

---

## 🎯 **Recommended Approach**

**Best Setup**:
1. ✅ Implement reset endpoint (secure with ADMIN_KEY)
2. ✅ Use GitHub Actions for scheduling (free, flexible)
3. ✅ Set schedule to daily at 3 AM UTC
4. ✅ Add manual workflow trigger for on-demand resets
5. ✅ Monitor logs for first week

**Total Cost**: $0 extra (uses existing infrastructure)

---

## 🔮 **Future Enhancements**

### **Phase 2 Features**
- Notification on reset (Slack/Discord)
- Reset history/audit trail
- Configurable reset scope (what to clear)
- Multiple demo snapshots (reset to different states)
- Automatic reset after X hours of activity

### **Analytics**
- Track demo usage between resets
- Most active demo user
- Most popular questions
- Peak usage times

---

## 📖 **User Communication**

Add to demo banner:
```
⚠️ Demo Mode - Data resets daily at 3 AM UTC. 
   Feel free to experiment!
```

Update login page:
```
This is a demo instance. Data resets automatically every 24 hours.
Your activity won't affect others' experience.
```

---

**Ready to implement?** I can:
1. Create the reset endpoint
2. Update seed scripts to be reusable
3. Create GitHub Actions workflow
4. Test the entire flow locally
5. Prepare for deployment

Want me to start implementing now?

