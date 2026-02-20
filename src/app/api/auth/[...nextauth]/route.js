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
          throw new Error("Server Error: .env file me ADMIN_USERNAME ya ADMIN_PASSWORD set nahi hai!");
        }

        // 2. Database me user dhundo
        const user = await User.findOne({ username: credentials.username });
        
        // 3. Agar naya system hai aur database me koi nahi hai
        if (!user) {
          // Jo user ne likha hai, wo .env wale se exact match hona chahiye
          if (credentials.username === envAdminUser && credentials.password === envAdminPass) {
            const hashedPassword = await bcrypt.hash(envAdminPass, 10); // .env wale password ko hash karo
            const newUser = await User.create({
              username: envAdminUser,
              password: hashedPassword,
              role: "admin"
            });
            return { id: newUser._id.toString(), name: newUser.username, role: newUser.role };
          }
          throw new Error("User nahi mila. Kripya sahi username dalein.");
        }

        // 4. Agar user database me mil gaya, toh password match karo
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Galat password!");
        }

        // Sab sahi hai toh user details return karo
        return { id: user._id.toString(), name: user.username, role: user.role };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.id = token.id;
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