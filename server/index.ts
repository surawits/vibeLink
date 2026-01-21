import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

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
        .icon { font-size: 3rem; margin-bottom: 1rem; color: #6b7280; }
        h2 { margin-top: 0; color: #111827; }
        p { color: #4b5563; margin-bottom: 1.5rem; }
        .btn { display: inline-block; padding: 0.5rem 1rem; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 0.375rem; font-size: 0.875rem; transition: background-color 0.2s; }
        .btn:hover { background-color: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">👻</div>
        <h2>${title}</h2>
        <p>${message}</p>
        <a href="${Bun.env.CLIENT_URL || 'http://localhost:4200'}" class="btn">Create Your Own Vibe</a>
    </div>
</body>
</html>`;

const app = new Elysia()
    .use(cors())
    .get("/api/links", async () => {
        return await prisma.link.findMany({
            orderBy: { createdAt: "desc" }
        });
    })
    .post("/api/shorten", async ({ body, set }) => {
        const { url, alias, hasIntermediatePage, intermediatePageDelay, isActive } = body;
        
        let shortCode = alias;
        
        if (shortCode) {
            const existing = await prisma.link.findUnique({
                where: { shortCode }
            });
            if (existing) {
                set.status = 400;
                return { error: "Alias already taken" };
            }
        } else {
            // Generate a random code and ensure it's unique
            let isUnique = false;
            while (!isUnique) {
                shortCode = nanoid(6);
                const existing = await prisma.link.findUnique({
                    where: { shortCode }
                });
                if (!existing) isUnique = true;
            }
        }

        const newLink = await prisma.link.create({
            data: {
                originalUrl: url,
                shortCode: shortCode!,
                hasIntermediatePage: hasIntermediatePage ?? false,
                intermediatePageDelay: intermediatePageDelay ?? 0,
                isActive: isActive ?? true
            }
        });

        return newLink;
    }, {
        body: t.Object({
            url: t.String({ format: 'uri' }),
            alias: t.Optional(t.String({ minLength: 1 })),
            hasIntermediatePage: t.Optional(t.Boolean()),
            intermediatePageDelay: t.Optional(t.Numeric({ minimum: 0 })),
            isActive: t.Optional(t.Boolean())
        })
    })
    .put("/api/links/:id", async ({ params, body, set }) => {
        const { id } = params;
        const { url, alias, hasIntermediatePage, intermediatePageDelay, isActive } = body;

        try {
            const updatedLink = await prisma.link.update({
                where: { id: parseInt(id) },
                data: {
                    originalUrl: url,
                    shortCode: alias, // Note: Changing alias might fail if not unique, needs error handling
                    hasIntermediatePage,
                    intermediatePageDelay,
                    isActive
                }
            });
            return updatedLink;
        } catch (error: any) {
             if (error.code === 'P2002') {
                set.status = 400;
                return { error: "Alias already taken" };
            }
            set.status = 500;
            return { error: "Failed to update link" };
        }
    }, {
        body: t.Object({
            url: t.Optional(t.String({ format: 'uri' })),
            alias: t.Optional(t.String({ minLength: 1 })),
            hasIntermediatePage: t.Optional(t.Boolean()),
            intermediatePageDelay: t.Optional(t.Numeric({ minimum: 0 })),
            isActive: t.Optional(t.Boolean())
        })
    })
    .delete("/api/links/:id", async ({ params }) => {
        const { id } = params;
        await prisma.link.delete({
            where: { id: parseInt(id) }
        });
        return { success: true };
    })
    .get("/api/links/:id/stats", async ({ params }) => {
        const { id } = params;
        const logs = await prisma.linkLog.findMany({
            where: { linkId: parseInt(id) },
            orderBy: { createdAt: "desc" }
        });
        return logs;
    })
    .get("/api/system-logs", async () => {
        return await prisma.systemLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 100 // Last 100 logs
        });
    })
    .delete("/api/links/:id/reset", async ({ params }) => {
        const { id } = params;
        const linkId = parseInt(id);
        
        // Transaction to ensure both operations happen or neither
        await prisma.$transaction([
            prisma.linkLog.deleteMany({
                where: { linkId }
            }),
            prisma.link.update({
                where: { id: linkId },
                data: { clicks: 0 }
            })
        ]);
        
        return { success: true };
    })
    .get("/api/links/:id/export", async ({ params, set }) => {
        const { id } = params;
        const linkId = parseInt(id);
        const link = await prisma.link.findUnique({ where: { id: linkId } });
        
        if (!link) {
            set.status = 404;
            return "Link not found";
        }

        const logs = await prisma.linkLog.findMany({
            where: { linkId },
            orderBy: { createdAt: "desc" }
        });

        // Generate CSV
        const header = "Date,IP,Device,OS,Browser,Referrer,City,Country\n";
        const rows = logs.map(log => {
            const date = log.createdAt.toISOString();
            const ip = log.ip || "";
            const device = log.device || "";
            const os = log.os || "";
            const browser = log.browser || "";
            // Escape commas in referrer
            const referrer = (log.referrer || "").replace(/"/g, '""'); 
            const city = log.city || "";
            const country = log.country || "";
            return `${date},${ip},${device},${os},${browser},"${referrer}",${city},${country}`;
        }).join("\n");

        const csv = header + rows;

        return new Response(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="vibeLink_stats_${link.shortCode}.csv"`
            }
        });
    })
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