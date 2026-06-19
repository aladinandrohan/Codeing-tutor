import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import AuthScreen from "./components/AuthScreen";
import ChatScreen from "./components/ChatScreen";

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0F1115] flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-[#6B7280]" />
      </div>
    );
  }

  return user ? <ChatScreen /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
