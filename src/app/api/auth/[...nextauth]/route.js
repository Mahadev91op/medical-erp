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

        // 2. Pehle check karo ki kya ye Super Admin hai (Seedha .env se)
        if (credentials.username === envAdminUser && credentials.password === envAdminPass) {
          return { 
            id: "000000000000000000000000", 
            name: envAdminUser, 
            role: "superadmin",
            status: "active",
            subscriptionEnd: new Date("9999-12-31").toISOString()
          };
        }

        // 3. Agar admin nahi hai, toh database me doosre users dhundo (Staff ke liye)
        const user = await User.findOne({ username: credentials.username.toLowerCase().trim() });
        
        if (!user) {
          throw new Error("User not found or incorrect password.");
        }

        // 3b. Check if account is disabled
        if (user.status === "disabled") {
          throw new Error("Your account has been disabled. Please contact the administrator.");
        }

        // 4. Agar user database me mil gaya, toh password match karo
        const isValid = await bcrypt.compare(credentials.password, user.password);
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
      } else if (token?.id && token.id !== "000000000000000000000000") {
        try {
          await connectToDatabase();
          const dbUser = await User.findById(token.id).select("status role subscriptionEnd").lean();
          if (dbUser) {
            token.role = dbUser.role;
            token.status = dbUser.status;
            token.subscriptionEnd = dbUser.subscriptionEnd ? dbUser.subscriptionEnd.toISOString() : null;
          }
        } catch (error) {
          console.error("JWT Sync Error:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        await connectToDatabase();
        
        // Skip DB check for env superadmin
        if (token.id === "000000000000000000000000") {
          session.user.role = "superadmin";
          session.user.id = token.id;
          session.user.status = "active";
          session.user.subscriptionEnd = new Date("9999-12-31").toISOString();
          return session;
        }

        const dbUser = await User.findById(token.id).select("status role subscriptionEnd").lean();
        if (!dbUser || dbUser.status === "disabled") {
          session.user = null;
          session.error = "disabled";
          return session;
        }

        session.user.role = dbUser.role;
        session.user.id = token.id;
        session.user.status = dbUser.status;
        session.user.subscriptionEnd = dbUser.subscriptionEnd ? dbUser.subscriptionEnd.toISOString() : null;
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
export { handler as GET, handler as POST };