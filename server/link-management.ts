import { Elysia, t } from "elysia";
import { prisma } from "./db";
import { nanoid } from "nanoid";
import { auth } from "./auth";

// Helper for error pages (used in redirects, might need to be shared or duplicated if redirect logic stays in index)
// Actually, redirect logic /:code is public, while management is protected.
// We will separate the "Management API" from the "Public Redirector".

export const linkManagement = (app: Elysia) => app
    .group("/links", (app) => app
        .derive(async ({ request }) => {
            const session = await auth.api.getSession({
                headers: request.headers
            });
            return { session };
        })
        .onBeforeHandle(({ session, set }) => {
            if (!session) {
                set.status = 401;
                return { error: "Unauthorized" };
            }
        })
        .get("/", async ({ session }) => {
            const user = await prisma.user.findUnique({ where: { id: session.user.id } });
            
            // Standard users only see their own links
            // Admin sees their own links on dashboard too (for consistent UX), 
            // but we will add a separate endpoint for ALL links.
            // Or should Admin see ALL links on dashboard?
            // "Verify that user can see only them created link, also as admin" -> Admin also sees only theirs on dashboard.
            return await prisma.link.findMany({
                where: { userId: session.user.id },
                orderBy: { createdAt: "desc" }
            });
        })
        .get("/admin/all", async ({ session, set }) => {
             const user = await prisma.user.findUnique({ where: { id: session.user.id } });
             if (user?.role !== 'admin') {
                 set.status = 403;
                 return { error: "Forbidden" };
             }
             
             return await prisma.link.findMany({
                 include: {
                     user: {
                         select: { name: true, email: true }
                     }
                 },
                 orderBy: { createdAt: "desc" }
             });
        })
        .post("/", async ({ body, set, session }) => {
            const { url, alias, hasIntermediatePage, intermediatePageDelay, isActive, expiresAt, maxClicks } = body;
            const user = await prisma.user.findUnique({ where: { id: session.user.id } });
            
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

            let finalHasIntermediatePage = hasIntermediatePage ?? false;
            let finalDelay = intermediatePageDelay ?? 0;

            if (user?.role !== 'admin') {
                // Enforce 5 second delay for non-admins (or config)
                const configDelay = await prisma.systemConfig.findUnique({ where: { key: 'redirect_delay' } });
                const delay = configDelay ? parseInt(configDelay.value) : 5;
                
                finalHasIntermediatePage = true;
                finalDelay = delay;
            }

            const newLink = await prisma.link.create({
                data: {
                    originalUrl: url,
                    shortCode: shortCode!,
                    hasIntermediatePage: finalHasIntermediatePage,
                    intermediatePageDelay: finalDelay,
                    isActive: isActive ?? true,
                    userId: session.user.id,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    maxClicks: maxClicks ?? 0
                }
            });

            return newLink;
        }, {
            body: t.Object({
                url: t.String({ format: 'uri' }),
                alias: t.Optional(t.String({ minLength: 1 })),
                hasIntermediatePage: t.Optional(t.Boolean()),
                intermediatePageDelay: t.Optional(t.Numeric({ minimum: 0 })),
                isActive: t.Optional(t.Boolean()),
                expiresAt: t.Optional(t.String()), // Expect ISO string
                maxClicks: t.Optional(t.Numeric({ minimum: 0 }))
            })
        })
        .put("/:id", async ({ params, body, set, session }) => {
            const { id } = params;
            const { url, alias, hasIntermediatePage, intermediatePageDelay, isActive, expiresAt, maxClicks } = body;

            try {
                // Verify ownership or admin
                const link = await prisma.link.findUnique({ where: { id: parseInt(id) } });
                if (!link) {
                    set.status = 404;
                    return { error: "Link not found" };
                }
                
                const user = await prisma.user.findUnique({ where: { id: session.user.id } });
                
                if (link.userId !== session.user.id && user?.role !== 'admin') {
                    set.status = 403;
                    return { error: "Forbidden" };
                }

                let finalHasIntermediatePage = hasIntermediatePage;
                let finalDelay = intermediatePageDelay;

                if (user?.role !== 'admin') {
                    // Enforce policy even on update
                    const configDelay = await prisma.systemConfig.findUnique({ where: { key: 'redirect_delay' } });
                    const delay = configDelay ? parseInt(configDelay.value) : 5;
                    
                    finalHasIntermediatePage = true;
                    finalDelay = delay;
                }

                const updatedLink = await prisma.link.update({
                    where: { id: parseInt(id) },
                    data: {
                        originalUrl: url,
                        shortCode: alias, 
                        hasIntermediatePage: finalHasIntermediatePage,
                        intermediatePageDelay: finalDelay,
                        isActive,
                        expiresAt: expiresAt ? new Date(expiresAt) : null,
                        maxClicks: maxClicks ?? 0
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
                isActive: t.Optional(t.Boolean()),
                expiresAt: t.Optional(t.String()),
                maxClicks: t.Optional(t.Numeric({ minimum: 0 }))
            })
        })
        .get("/config/delay", async ({ session, set }) => {
             const user = await prisma.user.findUnique({ where: { id: session.user.id } });
             if (user?.role !== 'admin') {
                 set.status = 403;
                 return { error: "Forbidden" };
             }
             const config = await prisma.systemConfig.findUnique({ where: { key: 'redirect_delay' } });
             return { value: config ? parseInt(config.value) : 5 };
        })
        .post("/config/delay", async ({ body, session, set }) => {
             const user = await prisma.user.findUnique({ where: { id: session.user.id } });
             if (user?.role !== 'admin') {
                 set.status = 403;
                 return { error: "Forbidden" };
             }
             
             const { value } = body;
             await prisma.systemConfig.upsert({
                 where: { key: 'redirect_delay' },
                 update: { value: value.toString() },
                 create: { key: 'redirect_delay', value: value.toString() }
             });
             
             return { success: true };
        }, {
            body: t.Object({
                value: t.Numeric({ minimum: 0 })
            })
        })
        .delete("/:id", async ({ params, set, session }) => {
            const { id } = params;
            const linkId = parseInt(id);

            const link = await prisma.link.findUnique({ where: { id: linkId } });
            if (!link) {
                set.status = 404;
                return { error: "Link not found" };
            }

            const user = await prisma.user.findUnique({ where: { id: session.user.id } });
            
            if (link.userId !== session.user.id && user?.role !== 'admin') {
                set.status = 403;
                return { error: "Forbidden" };
            }

            await prisma.link.delete({
                where: { id: linkId }
            });
            return { success: true };
        })
        .get("/:id/stats", async ({ params }) => {
            const { id } = params;
            const logs = await prisma.linkLog.findMany({
                where: { linkId: parseInt(id) },
                orderBy: { createdAt: "desc" }
            });
            return logs;
        })
        .get("/:id/stats/aggregated", async ({ params, set, session }) => {
            const { id } = params;
            const linkId = parseInt(id);
            
            const link = await prisma.link.findUnique({ where: { id: linkId } });
            if (!link) {
                set.status = 404;
                return { error: "Link not found" };
            }
            
            // Check ownership
            const user = await prisma.user.findUnique({ where: { id: session.user.id } });
            if (link.userId !== session.user.id && user?.role !== 'admin') {
                set.status = 403;
                return { error: "Forbidden" };
            }

            // Aggregate data (last 7 days clicks)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const clicksOverTime = await prisma.linkLog.groupBy({
                by: ['createdAt'],
                where: {
                    linkId: linkId,
                    createdAt: { gte: sevenDaysAgo }
                },
                _count: { _all: true }
            });
            
            // Note: SQLite group by date is tricky with standard Prisma.
            // We might need to fetch logs and aggregate in JS for simplicity with SQLite.
            // For robust prod, we'd use raw query `strftime`.
            // Let's fetch last 7 days logs and map manually.
            
            const logs = await prisma.linkLog.findMany({
                where: {
                    linkId: linkId,
                    createdAt: { gte: sevenDaysAgo }
                },
                select: { createdAt: true, device: true }
            });
            
            const clicksByDate: Record<string, number> = {};
            const deviceStats: Record<string, number> = {};
            
            logs.forEach(log => {
                const date = log.createdAt.toISOString().split('T')[0];
                clicksByDate[date] = (clicksByDate[date] || 0) + 1;
                
                const device = log.device || 'Unknown';
                deviceStats[device] = (deviceStats[device] || 0) + 1;
            });
            
            // Fill missing dates
            const chartData = {
                labels: [] as string[],
                data: [] as number[]
            };
            
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                chartData.labels.push(dateStr);
                chartData.data.push(clicksByDate[dateStr] || 0);
            }
            
            return {
                clicksOverTime: chartData,
                deviceStats
            };
        })
        .delete("/:id/reset", async ({ params }) => {
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
        .get("/:id/export", async ({ params, set }) => {
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
    );
