import { auth } from "./auth";
import { prisma } from "./db";

const email = "admin@vibelink.local";
const password = "AdminPassword123!"; // Initial password satisfying policy
const name = "Admin";

console.log(`Creating user: ${email}...`);

try {
    const user = await auth.api.signUpEmail({
        body: {
            email,
            password,
            name,
        }
    });
    
    // Update to admin role and force password change
    if (user) {
         await prisma.user.update({
            where: { email },
            data: { 
                role: 'admin',
                forceChangePassword: true
            }
        });
        console.log("User created and promoted to admin successfully:", user);
    }

} catch (error) {
    console.error("Failed to create user:", error);
} finally {
    process.exit(0);
}
