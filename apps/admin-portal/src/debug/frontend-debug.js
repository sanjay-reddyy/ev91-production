// Comprehensive Frontend Role Permission Debugging
// Run this in the browser console on the admin portal roles page

window.debugRolePermissions = function () {
  console.log("🔍 Frontend Role Permission Debug Tool\n");

  // Try to access React component state (if available)
  console.log("📋 Checking React component state...");

  // Look for common React DevTools patterns
  const reactFiber =
    document.querySelector("#root")?._reactInternalFiber ||
    document.querySelector("#root")?._reactInternalInstance ||
    document.querySelector("[data-reactroot]")?._reactInternalFiber;

  if (reactFiber) {
    console.log("✅ React fiber found - component state may be accessible");
  } else {
    console.log("❌ React fiber not found - manual testing required");
  }

  // Check localStorage for auth token
  const token = localStorage.getItem("authToken");
  if (token) {
    console.log("✅ Auth token found in localStorage");

    // Make API calls to check current state
    fetch("/api/roles", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.data?.roles) {
          console.log(`📊 API Response: ${data.data.roles.length} roles found`);

          const viewerRole = data.data.roles.find(
            (r) => r.id === "cmele31n9000kj4cst5ahljf8"
          );
          if (viewerRole) {
            console.log(`\n🎭 Viewer Role (${viewerRole.id}):`);
            console.log(`   Name: ${viewerRole.name}`);
            console.log(
              `   Permissions: ${viewerRole.permissions?.length || 0}`
            );

            if (viewerRole.permissions) {
              console.log("   Permission structures:");
              viewerRole.permissions.slice(0, 3).forEach((p, i) => {
                console.log(
                  `     ${i + 1}. Keys: [${Object.keys(p).join(", ")}]`
                );
                if (p.permissionId)
                  console.log(`        permissionId: ${p.permissionId}`);
                if (p.permission?.id)
                  console.log(`        permission.id: ${p.permission.id}`);
              });
            }

            // Test permission checking logic
            const testPermissionId = "cmele31la0006j4cs5zzem65b";
            const isAssigned =
              viewerRole.permissions?.some((rp) => {
                if ("permissionId" in rp && rp.permissionId) {
                  return rp.permissionId === testPermissionId;
                }
                if ("permission" in rp && rp.permission && rp.permission.id) {
                  return rp.permission.id === testPermissionId;
                }
                return rp.id === testPermissionId;
              }) || false;

            console.log(`\n🔍 Test Permission Check:`);
            console.log(`   Permission ID: ${testPermissionId}`);
            console.log(`   Currently assigned: ${isAssigned}`);
          }
        }
      })
      .catch((error) => {
        console.error("❌ API call failed:", error);
      });
  } else {
    console.log("❌ No auth token found - please login first");
  }

  // Check for open dialogs or forms
  setTimeout(() => {
    console.log("\n🔍 Checking UI state...");

    // Look for role dialogs
    const roleDialog = document.querySelector('[role="dialog"]');
    if (roleDialog) {
      console.log("✅ Dialog found - checking content...");

      // Look for checkboxes in manage permissions dialog
      const checkboxes = roleDialog.querySelectorAll('input[type="checkbox"]');
      if (checkboxes.length > 0) {
        console.log(`   Found ${checkboxes.length} checkboxes`);

        // Check first few checkboxes
        Array.from(checkboxes)
          .slice(0, 5)
          .forEach((cb, i) => {
            const label = cb.closest("label") || cb.parentElement;
            const labelText = label?.textContent || "Unknown";
            console.log(
              `     ${i + 1}. ${cb.checked ? "☑️" : "☐"} ${labelText.slice(
                0,
                50
              )}...`
            );
          });
      }
    } else {
      console.log("❌ No dialog currently open");
    }

    // Check for forms
    const forms = document.querySelectorAll("form");
    if (forms.length > 0) {
      console.log(`✅ Found ${forms.length} form(s)`);
    }

    // Instructions
    console.log("\n📝 Next Steps:");
    console.log('1. Open "Manage Permissions" for Viewer role');
    console.log('2. Look for "vehicle.vehicles.read" permission');
    console.log("3. Toggle it and check if UI updates immediately");
    console.log("4. Run this debug function again to see state changes");
  }, 1000);

  return {
    testPermissionId: "cmele31la0006j4cs5zzem65b",
    roleId: "cmele31n9000kj4cst5ahljf8",
    message: "Debug tool loaded. Check console output above.",
  };
};

// Check if we're on the right page
if (
  window.location.pathname.includes("/roles") ||
  window.location.hash.includes("roles")
) {
  console.log("✅ On roles page - debug tool ready");
  console.log("Run window.debugRolePermissions() to start debugging");
} else {
  console.log("❌ Not on roles page - navigate to roles page first");
}

return window.debugRolePermissions;
