import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const envAdminUser = process.env.ADMIN_USERNAME;
        const envAdminPass = process.env.ADMIN_PASSWORD;

        if (!credentials?.username || !credentials?.password) {
          throw new Error("Please enter both username and password.");
        }

        const inputUsername = credentials.username.toLowerCase().trim();
        const inputPassword = credentials.password;

        // 1. Pehle check karo ki kya ye Super Admin hai (Seedha .env se bina DB delay ke)
        if (envAdminUser && envAdminPass && inputUsername === envAdminUser.toLowerCase().trim() && inputPassword === envAdminPass) {
          return { 
            id: "000000000000000000000000", 
            name: envAdminUser, 
            role: "superadmin",
            status: "active",
            subscriptionEnd: new Date("9999-12-31").toISOString()
          };
        }

        // 2. Agar super admin nahi hai, toh database connect karo
        try {
          await connectToDatabase();
        } catch (dbErr) {
          console.error("Database connection error during login:", dbErr);
          throw new Error("Database connection error. Please try again.");
        }

        // 3. Database me user dhundo
        const user = await User.findOne({ username: inputUsername });
        
        if (!user) {
          throw new Error("User not found or incorrect password.");
        }

        // 3b. Check if account is disabled
        if (user.status === "disabled") {
          throw new Error("Your account has been disabled. Please contact the administrator.");
        }

        // 4. Password match karo
        const isValid = await bcrypt.compare(inputPassword, user.password);
        if (!isValid) {
          throw new Error("Incorrect password!");
        }

        // Sab sahi hai toh user details return karo
        return { 
          id: user._id.toString(), 
          name: user.username, 
          role: user.role,
          status: user.status,
          subscriptionEnd: user.subscriptionEnd ? user.subscriptionEnd.toISOString() : null
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.name = user.name || user.username;
        token.username = user.name || user.username;
        token.status = user.status;
        token.subscriptionEnd = user.subscriptionEnd;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.name = token.name || token.username;
        session.user.username = token.username || token.name;
        session.user.status = token.status;
        session.user.subscriptionEnd = token.subscriptionEnd;
        if (token.status === "disabled") {
          session.user = null;
          session.error = "disabled";
        }
      }
      return session;
    }
  },
  pages: {
    signIn: "/login", 
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days session validity
    updateAge: 24 * 60 * 60,   // Refresh session every 24 hours
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" && process.env.NEXTAUTH_URL?.startsWith("https://")
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production" && process.env.NEXTAUTH_URL?.startsWith("https://"),
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };