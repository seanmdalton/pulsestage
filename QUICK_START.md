# PulseStage Quick Start

## 🚀 Pre-Flight Check (Use This Every Time!)

Before testing **anything**, run:

```bash
make preflight
```

**What it checks:**
- ✅ All services running (postgres, redis, mailpit, API, frontend)
- ✅ Database connectivity
- ✅ Authentication working
- ✅ Seed data valid
- ✅ Core endpoints responding

**Exit codes:**
- `0` = ✅ Ready to test
- `1` = ❌ Something broken, fix it first

---

## 🔥 Common Commands

### Daily Start
```bash
docker-compose up -d        # Start Docker services
make db-seed               # Fresh data
cd api && npm run dev      # Terminal 1
cd web && npm run dev      # Terminal 2
make preflight            # ✅ Validate!
```

### After Code Changes
```bash
# [Restart services if needed]
make preflight            # ✅ Always validate
```

### Troubleshooting
```bash
make preflight            # See what's broken
make db-seed             # Fix data issues
docker-compose restart   # Fix Docker issues

# Nuclear option (if all else fails)
sudo killall -9 node tsx
docker-compose restart
make db-seed
cd api && npm run dev &
cd web && npm run dev &
sleep 10 && make preflight
```

---

## 🎯 The Golden Rule

**NEVER ask user to test without running `make preflight` first!**

This prevents:
- ❌ "Site isn't running"
- ❌ "Can't log in"
- ❌ "No data showing"
- ❌ Wasting everyone's time

---

## 📚 More Info

- **Full Workflow**: `DEVELOPMENT_WORKFLOW.md`
- **Seed Data Guide**: `SEED_DATA_CHECKLIST.md`
- **Help**: `make help`

