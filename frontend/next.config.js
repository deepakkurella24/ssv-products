const apiHost = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).host
  : "localhost";
const apiProtocol = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).protocol.replace(":", "")
  : "http";
module.exports = {
  turbopack: { root: __dirname },
  images: { remotePatterns: [{ protocol: apiProtocol, hostname: apiHost }] },
};
