import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { prisma } from "./db";
import { nanoid } from "nanoid";
import { auth } from "./auth";
import { userManagement } from "./user-management";
import { linkManagement } from "./link-management";

const logSystem = async (message: string, level = "INFO", context?: string) => {
    console.log(`[${level}] ${message}`);
    try {
        await prisma.systemLog.create({
            data: { message, level, context }
        });
    } catch (e) {
        console.error("Failed to write to SystemLog", e);
    }
};

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

// Helper for error pages
const errorPage = (title: string, message: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f3f4f6; color: #1f2937; }
        .container { text-align: center; background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 90%; width: 400px; }
        h1 { margin-bottom: 0.5rem; color: #ef4444; }
        p { color: #6b7280; }
        .btn { display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 0.375rem; font-size: 0.875rem; transition: background-color 0.2s; }
        .btn:hover { background-color: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <p>${message}</p>
        <a href="/" class="btn">Go Home</a>
    </div>
</body>
</html>
`;

const app = new Elysia()
    .use(cors({
        origin: Bun.env.CLIENT_URL || "http://localhost:4200",
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    }))
    .all("/api/auth/*", (ctx) => auth.handler(ctx.request))
    .group("/api", (app) => 
        app
            .derive(async ({ request }) => {
                const session = await auth.api.getSession({
                    headers: request.headers
                });
                return { session };
            })
            .onBeforeHandle(({ session, set, request, path }) => {
                // Public API routes
                if (path.startsWith("/api/auth")) return;

                // Allow change-password for authenticated users even if forced to change
                if (path === "/api/change-password") return;
                // Allow checking status (me)
                if (path === "/api/users/me") return;

                if (!session) {
                    set.status = 401;
                    return { error: "Unauthorized" };
                }
            })
            .use(userManagement)
            .use(linkManagement)
            .post("/change-password", async ({ body, session, set, request }) => {
                if (!session) {
                    set.status = 401;
                    return { error: "Unauthorized" };
                }

                const { currentPassword, newPassword } = body;
                const userId = session.user.id;

                if (!PASSWORD_REGEX.test(newPassword)) {
                    set.status = 400;
                    return { error: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character." };
                }

                if (currentPassword === newPassword) {
                    set.status = 400;
                    return { error: "New password cannot be the same as the current password." };
                }

                try {
                    // Call Better Auth to change password
                    const { error } = await auth.api.changePassword({
                        body: {
                            currentPassword,
                            newPassword,
                            revokeOtherSessions: true
                        },
                        headers: request.headers 
                    });

                    if (error) {
                        set.status = 400;
                        return { error: error.message || "Failed to change password" };
                    }

                    // Update local user flags
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            passwordChangedAt: new Date(),
                            forceChangePassword: false
                        }
                    });

                    return { success: true };

                } catch (e: any) {
                    console.error("Change password error:", e);
                    set.status = 500;
                    return { error: "Internal server error during password change" };
                }
            }, {
                body: t.Object({
                    currentPassword: t.String(),
                    newPassword: t.String()
                })
            })
            .get("/system-logs", async () => {
                return await prisma.systemLog.findMany({
                    orderBy: { createdAt: "desc" },
                    take: 100 // Last 100 logs
                });
            })
    )
    .get("/:code", async ({ request, params, set }) => {
        const { code } = params;
        logSystem(`Incoming redirect request for /${code}`, "DEBUG");
        
        const link = await prisma.link.findUnique({
            where: { shortCode: code }
        });

        if (!link) {
            logSystem(`Link /${code} not found`, "WARN");
            set.status = 404;
            return new Response(errorPage("Vibe Not Found", "The link you are looking for has faded away."), {
                headers: { "Content-Type": "text/html" }
            });
        }

        if (!link.isActive) {
            logSystem(`Link /${code} is inactive`, "WARN");
            set.status = 403; // Forbidden
            return new Response(errorPage("Vibe Check Failed", "This link is currently taking a break."), {
                headers: { "Content-Type": "text/html" }
            });
        }

        // Capture Analytics
        const ip = request.headers.get("x-forwarded-for") || app.server?.requestIP(request)?.address || "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";
        const referrer = request.headers.get("referer") || "direct";
        
        // Simple User Agent Parsing (Basic)
        let device = "Desktop";
        if (/mobile/i.test(userAgent)) device = "Mobile";
        else if (/tablet/i.test(userAgent)) device = "Tablet";

        let os = "Unknown OS";
        if (/windows/i.test(userAgent)) os = "Windows";
        else if (/macintosh|mac os x/i.test(userAgent)) os = "macOS";
        else if (/linux/i.test(userAgent)) os = "Linux";
        else if (/android/i.test(userAgent)) os = "Android";
        else if (/ios|iphone|ipad/i.test(userAgent)) os = "iOS";

        let browser = "Unknown Browser";
        if (/chrome|crios/i.test(userAgent)) browser = "Chrome";
        else if (/firefox|fxios/i.test(userAgent)) browser = "Firefox";
        else if (/safari/i.test(userAgent)) browser = "Safari";
        else if (/edg/i.test(userAgent)) browser = "Edge";

        logSystem(`Redirecting /${code} to ${link.originalUrl}`, "INFO", `IP: ${ip}, Browser: ${browser}`);

        // Async logging
        prisma.linkLog.create({
            data: {
                linkId: link.id,
                ip,
                userAgent,
                referrer,
                device,
                os,
                browser,
                country: "Unknown", 
                city: "Unknown"
            }
        }).catch(err => logSystem(`Failed to log visit for /${code}`, "ERROR", err.message));

        // Increment clicks asynchronously
        prisma.link.update({
            where: { id: link.id },
            data: { clicks: { increment: 1 } }
        }).catch(err => logSystem(`Failed to update clicks for /${code}`, "ERROR", err.message));

        const delay = link.hasIntermediatePage ? link.intermediatePageDelay : 0;

        if (delay > 0) {
            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redirecting...</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f3f4f6; color: #1f2937; }
        .container { text-align: center; background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 90%; width: 400px; }
        .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        #timer { font-weight: bold; color: #3b82f6; font-size: 1.25rem; }
        .url { color: #6b7280; font-size: 0.875rem; margin-top: 1rem; word-break: break-all; }
        .btn { display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 0.375rem; font-size: 0.875rem; transition: background-color 0.2s; border: none; cursor: pointer; }
        .btn:hover { background-color: #2563eb; }
        .btn-secondary { background-color: #9ca3af; margin-right: 0.5rem; }
        .btn-secondary:hover { background-color: #6b7280; }
        .btn-danger { background-color: #ef4444; margin-left: 0.5rem; }
        .btn-danger:hover { background-color: #dc2626; }
    </style>
</head>
<body>
    <div class="container">
        <div class="loader"></div>
        <h2>Vibing you there...</h2>
        <p>Redirecting in <span id="timer">${delay}</span> seconds</p>
        <div class="url">Destination: ${link.originalUrl}</div>
        <div style="margin-top: 1rem; display: flex; justify-content: center; flex-wrap: wrap; gap: 0.5rem;">
            <button id="backBtn" class="btn btn-secondary" style="display: none;" onclick="history.back()">Go Back</button>
            <a href="${link.originalUrl}" class="btn">Go Now</a>
            <button class="btn btn-danger" onclick="closeTab()">Close Tab</button>
        </div>
    </div>
    <script>
        let interval;
        function closeTab() {
            if (interval) clearInterval(interval);
            window.close();
        }
        if (window.history.length > 1) {
            document.getElementById('backBtn').style.display = 'inline-block';
        }
        let timeLeft = ${delay};
        const timerElement = document.getElementById('timer');
        interval = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(interval);
                window.location.href = "${link.originalUrl}";
            }
        }, 1000);
    </script>
</body>
</html>`;
            return new Response(html, {
                headers: { "Content-Type": "text/html" }
            });
        }

        return Response.redirect(link.originalUrl);
    })
    .listen(Bun.env.PORT || 3000);

console.log(`🚀 vibeLink server is running at ${app.server?.hostname}:${app.server?.port}`);
