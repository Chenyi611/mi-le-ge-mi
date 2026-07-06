const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = process.cwd();
const preferredPort = Number(process.argv[2]) || 5173;
const host = process.argv[3] || "0.0.0.0";
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".md": "text/markdown; charset=utf-8"
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  const filePath = path.normalize(path.join(root, pathname));
  const relativePath = path.relative(root, filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    response.end(data);
  });
});

function localNetworkUrls(port) {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => `http://${item.address}:${port}/index.html`);
}

server.listen(preferredPort, host, () => {
  const phoneUrls = localNetworkUrls(preferredPort);
  console.log("");
  console.log("Mi Le Ge Mi preview server is running.");
  console.log(`PC: http://127.0.0.1:${preferredPort}/index.html`);
  if (phoneUrls.length === 0) {
    console.log("Phone: no LAN address found. Connect this computer to Wi-Fi and restart.");
  } else {
    phoneUrls.forEach((url) => {
      console.log(`Phone on same Wi-Fi: ${url}`);
    });
  }
  console.log("Keep this window open while others are playing.");
  console.log("If a phone cannot open the address, allow Node.js through Windows Firewall for private networks.");
});
