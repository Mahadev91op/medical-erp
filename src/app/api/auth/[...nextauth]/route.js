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
        await connectToDatabase();
        
        // 1. Pura data sirf aur sirf .env se liya jayega (Koi default text nahi)
        const envAdminUser = process.env.ADMIN_USERNAME;
        const envAdminPass = process.env.ADMIN_PASSWORD;

        // Agar galti se .env me data set karna bhul gaye, toh error aayega
        if (!envAdminUser || !envAdminPass) {
          throw new Error("Server Error: ADMIN_USERNAME or ADMIN_PASSWORD is not set in the .env file!");
        }

        if (!credentials?.username || !credentials?.password) {
          throw new Error("Please enter both username and password.");
        }

        const inputUsername = credentials.username.toLowerCase().trim();
        const inputPassword = credentials.password;

        // 2. Pehle check karo ki kya ye Super Admin hai (Seedha .env se)
        if (inputUsername === envAdminUser.toLowerCase().trim() && inputPassword === envAdminPass) {
          return { 
            id: "000000000000000000000000", 
            name: envAdminUser, 
            role: "superadmin",
            status: "active",
            subscriptionEnd: new Date("9999-12-31").toISOString()
          };
        }

        // 3. Agar admin nahi hai, toh database me doosre users dhundo (Staff ke liye)
        const user = await User.findOne({ username: inputUsername });
        
        if (!user) {
          throw new Error("User not found or incorrect password.");
        }

        // 3b. Check if account is disabled
        if (user.status === "disabled") {
          throw new Error("Your account has been disabled. Please contact the administrator.");
        }

        // 4. Agar user database me mil gaya, toh password match karo
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
        token.status = user.status;
        token.subscriptionEnd = user.subscriptionEnd;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.role = token.role;
        session.user.id = token.id;
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
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export async function GET(req, context) {
  const params = await context.params;
  return handler(req, { ...context, params });
}

export async function POST(req, context) {
  const params = await context.params;
  return handler(req, { ...context, params });
}