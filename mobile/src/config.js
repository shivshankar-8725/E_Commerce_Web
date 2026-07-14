// Where the Spring Boot backend lives. Override with EXPO_PUBLIC_API_URL.
//
//  • Android emulator  -> http://10.0.2.2:8080      (maps to your machine's localhost)
//  • iOS simulator     -> http://localhost:8080
//  • Physical phone    -> http://<your-PC-LAN-IP>:8080  (same Wi-Fi)
//  • Deployed backend  -> https://api.yourdomain.com
//
// Set it for a session like:  EXPO_PUBLIC_API_URL=http://192.168.1.5:8080 npx expo start
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080'
