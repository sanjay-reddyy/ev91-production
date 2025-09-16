# 🌱 EV91 Auth Service - Complete Database Seed

This seed file contains all the essential data needed for the EV91 Auth Service to function properly. It sets up a complete working environment for team members to get started quickly.

## 📦 What's Included

### 🏙️ **Cities (6)**

- Bangalore, Mumbai, Delhi, Chennai, Hyderabad, Pune
- With proper coordinates, region codes, and operational status

### 🏢 **Departments (5)**

- Technology, Operations, HR, Finance, Sales
- With department codes and descriptions

### 👥 **Roles (6)**

- **Super Admin** (Level 10) - Full system access
- **Admin** (Level 8) - Administrative access
- **Manager** (Level 6) - Management level access
- **Operator** (Level 4) - Operational access
- **Telecaller** (Level 3) - Customer service access
- **Viewer** (Level 2) - Read-only access

### 🔐 **Permissions (75+)**

Complete permission matrix covering:

- **Auth Service**: Users, roles, permissions, departments, teams, employees
- **Vehicle Service**: Vehicles, hubs, models, OEMs
- **Rider Service**: Riders, assignments
- **Client Store Service**: Clients, stores
- **Spare Parts Service**: Parts, categories, suppliers, inventory, requests
- **System**: Dashboard, analytics, reports, settings

### 👤 **Default Users (6)**

Ready-to-use accounts with proper role assignments:

| Email               | Password       | Role        | Employee ID |
| ------------------- | -------------- | ----------- | ----------- |
| superadmin@ev91.com | SuperAdmin123! | Super Admin | EMP001      |
| admin@ev91.com      | Password123!   | Admin       | EMP002      |
| manager@ev91.com    | Password123!   | Manager     | EMP003      |
| operator@ev91.com   | Password123!   | Operator    | EMP004      |
| telecaller@ev91.com | Password123!   | Telecaller  | EMP005      |
| test@ev91.com       | Password123!   | Viewer      | -           |

### 👥 **Teams (3)**

- **Development Team** (Tech Dept, Bangalore)
- **Operations Team** (Operations Dept, Mumbai)
- **Sales Team** (Sales Dept, Delhi)

### 👷 **Employee Hierarchy**

- Super Admin → Admin, Manager
- Manager → Operator, Telecaller

## 🚀 Quick Setup

### Method 1: Windows Batch (Recommended)

```bash
# Run the automated setup
run-complete-seed.bat
```

### Method 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup database
npx prisma db push

# 3. Run the seed
node complete-seed.js
```

### Method 3: Using package.json scripts

```bash
# Add to package.json scripts:
"seed": "node complete-seed.js",
"db:seed": "npx prisma db push && npm run seed"

# Then run:
npm run db:seed
```

## ✅ Verification

After seeding, you can verify the setup by:

1. **Test Login**: Use the Super Admin account

   ```
   Email: superadmin@ev91.com
   Password: SuperAdmin123!
   ```

2. **Check Database**:

   ```bash
   node check-super-admin.js  # Verify super admin setup
   ```

3. **API Test**:
   ```bash
   # Test authentication endpoint
   curl -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"superadmin@ev91.com","password":"SuperAdmin123!"}'
   ```

## 📋 Permission Matrix

### Super Admin

- ✅ Full access to all services and resources
- ✅ Can manage users, roles, and permissions
- ✅ System administration capabilities

### Admin

- ✅ Most operational permissions
- ❌ Cannot create/delete roles and permissions
- ❌ Limited auth service administration

### Manager

- ✅ Read and update permissions across services
- ❌ No delete permissions
- ❌ No user/role management

### Operator

- ✅ Create, read, update for operational resources
- ❌ No delete permissions
- ❌ Limited auth service access

### Telecaller

- ✅ Read access to most data
- ✅ Update client-store information
- ❌ No access to sensitive admin functions

### Viewer

- ✅ Read-only access to all data
- ❌ No modification permissions

## 🔄 Re-seeding

**⚠️ Warning**: Re-running the seed will **completely reset** the database.

To re-seed:

```bash
# This will clear ALL data and re-create from scratch
run-complete-seed.bat
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check database connection
npx prisma db push
```

### Missing Dependencies

```bash
# Install required packages
npm install @prisma/client bcryptjs
```

### Permission Issues

```bash
# Reset and regenerate Prisma client
npx prisma generate
```

## 📁 Files Included

- `complete-seed.js` - Main seed script (JavaScript)
- `prisma/seed.ts` - TypeScript version (requires compilation)
- `run-complete-seed.bat` - Automated Windows setup
- `SEED_README.md` - This documentation

## 🤝 Team Handover Checklist

- [ ] Database server running (PostgreSQL)
- [ ] Environment variables configured (.env file)
- [ ] Dependencies installed (`npm install`)
- [ ] Seed executed successfully
- [ ] Super Admin login verified
- [ ] API endpoints tested
- [ ] Team members have login credentials

---

**🎯 Ready to go!** Your auth-service database is now fully seeded and ready for development.

For questions or issues, check the existing scripts or contact the development team.
