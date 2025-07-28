# Team Service Integration Test

## Test 1: Health Check
```bash
curl -X GET http://localhost:3002/health
```

Expected Response:
```json
{
  "success": true,
  "message": "Team service is healthy",
  "timestamp": "..."
}
```

## Test 2: Get Teams (requires auth)
```bash
curl -X GET http://localhost:3002/api/teams \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "teams": []
  }
}
```

## Test 3: Frontend Integration
The admin portal should now route team API calls to the team service:
- Frontend: http://localhost:3003
- Teams page calls: `/api/teams` → proxied to `http://localhost:3002/api/teams`

## Service Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Admin Portal   │    │  Auth Service   │    │  Team Service   │
│  :3003          │    │  :4001          │    │  :3002          │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Teams Page  │ │────│ │ Auth APIs   │ │    │ │ Team APIs   │ │
│ │ /api/teams  │ │    │ │ JWT Verify  │ │    │ │ CRUD Ops    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Migration Summary ✅
1. ✅ Created dedicated team-service
2. ✅ Moved team controller and routes  
3. ✅ Set up authentication middleware
4. ✅ Configured Prisma database
5. ✅ Updated frontend proxy routing
6. ✅ Removed team code from auth-service
7. ✅ Added VS Code tasks for easy development

## Next Steps
1. Start team service: `npm run dev` in `services/team-service/`
2. Start auth service: `npm run dev` in `services/auth-service/`
3. Start frontend: `npm run dev` in `apps/admin-portal/`
4. Test team functionality in the UI
