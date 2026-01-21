import { auth } from "./auth";

const email = "admin@vibelink.local";
const password = "adminpassword123";
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
    console.log("User created successfully:", user);
} catch (error) {
    console.error("Failed to create user:", error);
} finally {
    process.exit(0);
}
