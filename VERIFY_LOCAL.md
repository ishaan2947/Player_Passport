# Local Verification Checklist

**Estimated Time**: 15 minutes  
**Prerequisites**: Docker Desktop running, services started (`docker compose up -d`)

---

## Quick Health Check (2 minutes)

### 1. API Health
```bash
curl http://localhost:8000/health
```
**Expected**: `{"status":"healthy","environment":"development","version":"1.0.0"}`

### 2. Frontend Accessible
Open in browser: http://localhost:3000

**Expected**: Landing page loads, no errors in console

### 3. Database Connected
```bash
docker compose exec postgres psql -U emg_user -d explain_my_game -c "SELECT COUNT(*) FROM users;"
```
**Expected**: Returns a count (0 or more)

---

## Authentication Bypass (2 minutes)

### 4. Dev Token Works
```bash
curl -H "Authorization: Bearer dev_user_seed_001" http://localhost:8000/users/me
```
**Expected**: Returns user JSON (or 401 if seed data not loaded)

### 5. Invalid Token Rejected
```bash
curl -H "Authorization: Bearer invalid_token" http://localhost:8000/users/me
```
**Expected**: `{"detail":"..."}` with 401 status

---

## Core API Endpoints (5 minutes)

### 6. List Teams
```bash
curl -H "Authorization: Bearer dev_user_seed_001" http://localhost:8000/teams
```
**Expected**: JSON array (may be empty)

### 7. Create Team
```bash
curl -X POST -H "Authorization: Bearer dev_user_seed_001" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Team","sport":"basketball"}' \
  http://localhost:8000/teams
```
**Expected**: Created team JSON with `id` field

### 8. CSV Template Download
```bash
curl http://localhost:8000/stats/csv-template
```
**Expected**: CSV content with headers (points_for, points_against, etc.)

### 9. API Documentation
Open in browser: http://localhost:8000/docs

**Expected**: Swagger UI loads with all endpoints listed

---

## Frontend Pages (4 minutes)

### 10. Dashboard
Open: http://localhost:3000/dashboard

**Expected**: Dashboard loads (may show "No teams yet" if empty)

### 11. Teams Page
Open: http://localhost:3000/dashboard/teams

**Expected**: Teams list or empty state with "Create Team" button

### 12. Settings Page
Open: http://localhost:3000/dashboard/settings

**Expected**: Account info, export data button, danger zone section

### 13. Sign-In Page (Dev Mode)
Open: http://localhost:3000/sign-in

**Expected**: "Development Mode" message with "Continue to Dashboard" button  
*(This will show Clerk sign-in if auth is configured)*

---

## New Features (2 minutes)

### 14. Onboarding Flow
Clear localStorage and refresh dashboard:
```javascript
// In browser console at http://localhost:3000/dashboard
localStorage.removeItem('emg_onboarding_complete');
location.reload();
```
**Expected**: Onboarding wizard appears

### 15. PDF Export (requires report)
If you have a game with a report:
```bash
curl -H "Authorization: Bearer dev_user_seed_001" \
  http://localhost:8000/reports/{REPORT_ID}/pdf --output test.pdf
```
**Expected**: PDF file downloads successfully

---

## Verification Summary Checklist

| # | Check | Status |
|---|-------|--------|
| 1 | API health endpoint | ⬜ |
| 2 | Frontend loads | ⬜ |
| 3 | Database connected | ⬜ |
| 4 | Dev token works | ⬜ |
| 5 | Invalid token rejected | ⬜ |
| 6 | List teams endpoint | ⬜ |
| 7 | Create team endpoint | ⬜ |
| 8 | CSV template download | ⬜ |
| 9 | API docs accessible | ⬜ |
| 10 | Dashboard page | ⬜ |
| 11 | Teams page | ⬜ |
| 12 | Settings page | ⬜ |
| 13 | Sign-in page | ⬜ |
| 14 | Onboarding flow | ⬜ |
| 15 | PDF export (optional) | ⬜ |

---

## Troubleshooting

### Services not starting
```bash
docker compose logs api
docker compose logs web
docker compose logs postgres
```

### Database not seeded
```bash
docker compose exec api python -c "from scripts.seed import seed; seed()"
```

### Port conflicts
```bash
# Check what's using ports
netstat -ano | findstr :8000
netstat -ano | findstr :3000
netstat -ano | findstr :5432
```

### Reset everything
```bash
docker compose down -v
docker compose up -d --build
```

