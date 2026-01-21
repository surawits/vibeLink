import { spawn } from "bun";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

// Configuration
const DEFAULT_SERVER_PORT = "3000";
const DEFAULT_CLIENT_PORT = "4200";

// Helper to prompt user
const prompt = (question: string, defaultValue: string): string => {
    process.stdout.write(`${question} [${defaultValue}]: `);
    // Since we can't easily read stdin synchronously in this environment without complex readline setup,
    // we'll simulate it or just use defaults if running non-interactively.
    // For this specific environment, we'll assume defaults if no input can be captured easily,
    // but the script is designed to be run in a terminal.
    return defaultValue; 
    // In a real terminal, one would use:
    // const prompt = promptSync(); return prompt(question, defaultValue);
};

console.log("🚀 Starting vibeLink App Orchestrator...");

// 1. Get Configuration (Using defaults for now to ensure automation, in a real CLI we'd use 'prompt-sync')
const serverPort = process.env.SERVER_PORT || DEFAULT_SERVER_PORT;
const clientPort = process.env.CLIENT_PORT || DEFAULT_CLIENT_PORT;

console.log(`
📋 Configuration:`);
console.log(`   - Server Port: ${serverPort}`);
console.log(`   - Client Port: ${clientPort}`);

const clientUrl = `http://localhost:${clientPort}`;
const serverUrl = `http://localhost:${serverPort}`;
const apiUrl = `${serverUrl}/api`;

// 2. Update Angular Environments
console.log(`
⚙️  Updating Angular Environment Files...`);
const envContent = `export const environment = {
  production: false,
  apiUrl: '${apiUrl}',
  baseUrl: '${serverUrl}'
};
`;

const envProdContent = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  baseUrl: '${serverUrl}'
};
`;

const envPath = join(process.cwd(), "client/src/environments");
try {
    writeFileSync(join(envPath, "environment.ts"), envContent);
    writeFileSync(join(envPath, "environment.development.ts"), envContent); // Use same for dev
    console.log("   ✅ Client environments updated.");
} catch (e) {
    console.error("   ❌ Failed to update client environments:", e);
    process.exit(1);
}

// 3. Start Processes
console.log(`
🏁 Launching Services...`);

// Start Server
const serverProcess = spawn({
    cmd: ["bun", "run", "dev"],
    cwd: "./server",
    env: {
        ...process.env,
        PORT: serverPort,
        CLIENT_URL: clientUrl
    },
    stdout: "inherit",
    stderr: "inherit"
});
console.log(`   🟢 Server started on port ${serverPort} (PID: ${serverProcess.pid})`);

// Start Client
const clientProcess = spawn({
    cmd: ["ng", "serve", "--port", clientPort],
    cwd: "./client",
    stdout: "inherit",
    stderr: "inherit"
});
console.log(`   🟢 Client started on port ${clientPort} (PID: ${clientProcess.pid})`);

console.log(`
✨ Application is running!`);
console.log(`   👉 Admin UI: ${clientUrl}`);
console.log(`   👉 Redirector: ${serverUrl}`);
console.log(`
(Press Ctrl+C to stop all services)`);

// Keep alive
process.on("SIGINT", () => {
    console.log("\n🛑 Stopping services...");
    serverProcess.kill();
    clientProcess.kill();
    process.exit();
});
