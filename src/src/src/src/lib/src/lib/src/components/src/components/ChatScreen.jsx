import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Play, Loader2, Terminal, Sparkles, LogOut } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";

const WELCOME = {
  role: "assistant",
  content:
    "Hey, welcome! I'm your coding tutor, and we're starting from zero — that's totally fine.\n\nThink of code like giving a very literal friend instructions. Let's try the first one together:\n\n```javascript\nconsole.log(\"Hello, world!\");\n```\n\nThat line just means \"show this message on screen.\" Hit Run and watch it happen!",
};

function extractCodeBlocks(text) {
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    parts.push({ type: "code", lang: match[1] || "text", content: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ type: "text", content: text.slice(lastIndex) });
  return parts;
}

function TypedCode({ code }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let i = 0;
    const speed = code.length > 300 ? 2 : 1;
    const id = setInterval(() => {
      i += speed;
      setShown(code.slice(0, i));
      if (i >= code.length) clearInterval(id);
    }, 8);
    return () => clearInterval(id);
  }, [code]);
  return <>{shown}</>;
}

function CodeBlock({ lang, content }) {
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [typed, setTyped] = useState(false);
  const isJs = /^(js|javascript)$/i.test(lang);

  useEffect(() => {
    const t = setTimeout(() => setTyped(true), Math.min(content.length * 8 + 200, 2500));
    return () => clearTimeout(t);
  }, [content]);

  const run = () => {
    setRunning(true);
    setOutput(null);
    const logs = [];
    const fakeConsole = {
      log: (...args) => logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")),
      error: (...args) => logs.push("⚠ " + args.map(String).join(" ")),
      warn: (...args) => logs.push("⚠ " + args.map(String).join(" ")),
    };
    setTimeout(() => {
      try {
        const fn = new Function("console", content);
        fn(fakeConsole);
        setOutput({ ok: true, lines: logs.length ? logs : ["(no output — try a console.log!)"] });
      } catch (err) {
        setOutput({ ok: false, lines: [err.message] });
      }
      setRunning(false);
    }, 300);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-[#2A2D35] bg-[#16181D]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1C1F26] border-b border-[#2A2D35]">
        <span className="text-[11px] uppercase tracking-wider text-[#6B7280] font-mono">{lang || "code"}</span>
        {isJs && (
          <button
            onClick={run}
            disabled={running}
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded bg-[#7EE787]/10 text-[#7EE787] hover:bg-[#7EE787]/20 transition-colors disabled:opacity-50"
          >
            {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            Run
          </button>
        )}
      </div>
      <pre className="px-3 py-2.5 text-[13px] leading-relaxed font-mono text-[#EDEDED] overflow-x-auto whitespace-pre-wrap break-words">
        {typed ? content : <TypedCode code={content} />}
      </pre>
      {output && (
        <div className={`px-3 py-2 border-t font-mono text-[12.5px] ${output.ok ? "border-[#2A2D35] bg-[#10130F]" : "border-[#3A2424] bg-[#1A1212]"}`}>
          {output.lines.map((line, i) => (
            <div key={i} className={output.ok ? "text-[#7EE787]" : "text-[#F2A0A0]"}>
              <span className="text-[#4B5563] mr-1.5">{output.ok ? "›" : "✕"}</span>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] bg-[#F2B544] text-[#16181D] rounded-2xl rounded-br-sm px-4 py-2.5 text-[14px] leading-relaxed font-medium">
          {msg.content}
        </div>
      </div>
    );
  }
  const parts = extractCodeBlocks(msg.content);
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[90%] w-full">
        <div className="flex items-center gap-1.5 mb-1.5 text-[#6B7280]">
          <Sparkles size={12} />
          <span className="text-[11px] font-medium uppercase tracking-wide">Tutor</span>
        </div>
        <div className="bg-[#1C1F26] border border-[#2A2D35] rounded-2xl rounded-tl-sm px-4 py-3 text-[14px] leading-relaxed text-[#EDEDED]">
          {parts.map((p, i) =>
            p.type === "text" ? (
              p.content.trim() && <p key={i} className="whitespace-pre-wrap mb-1 last:mb-0">{p.content.trim()}</p>
            ) : (
              <CodeBlock key={i} lang={p.lang} content={p.content} />
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatScreen() {
  const { user, signOut } = useAuth();
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("role, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        setMessages(data);
      }
      setHistoryLoaded(true);
    })();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const saveMessage = async (role, content) => {
    await supabase.from("messages").insert({ user_id: user.id, role, content });
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    saveMessage("user", text);

    try {
      const apiMessages = newMessages.filter((m) => m !== WELCOME);

      const { data, error } = await supabase.functions.invoke("tutor-chat", {
        body: { messages: apiMessages },
      });

      if (error) throw error;
      const reply = data?.reply || "Hmm, I didn't catch that — try asking again?";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      saveMessage("assistant", reply);
    } catch (err) {
      const fallback = "Something went wrong reaching the tutor. Mind trying again?";
      setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, user]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const suggestions = ["What's a variable?", "Explain functions like I'm new", "What does == vs === mean?"];

  return (
    <div className="h-screen w-full bg-[#0F1115] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl h-full max-h-[800px] bg-[#13151A] rounded-2xl border border-[#22252C] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#22252C] bg-[#16181D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7EE787]/15 flex items-center justify-center">
              <Terminal size={16} className="text-[#7EE787]" />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold text-[#EDEDED] leading-tight">Code Tutor</h1>
              <p className="text-[11px] text-[#6B7280] leading-tight">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="text-[#6B7280] hover:text-[#EDEDED] transition-colors p-1.5 rounded-md hover:bg-[#22252C]"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
          {messages.map((m, i) => (
            <MessageBubble key={i} msg={m} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-[#6B7280] text-[13px] mb-2">
              <Loader2 size={13} className="animate-spin" />
              Thinking...
            </div>
          )}
          {historyLoaded && messages.length === 1 && !loading && (
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-[12.5px] px-3 py-1.5 rounded-full border border-[#2A2D35] text-[#9CA3AF] hover:border-[#F2B544]/40 hover:text-[#F2B544] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-3.5 border-t border-[#22252C] bg-[#16181D]">
          <div className="flex items-end gap-2 bg-[#1C1F26] rounded-xl border border-[#2A2D35] focus-within:border-[#F2B544]/50 transition-colors px-3 py-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about any coding concept..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-[14px] text-[#EDEDED] placeholder-[#6B7280] py-1 max-h-28"
              style={{ minHeight: "24px" }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#F2B544] disabled:bg-[#2A2D35] disabled:text-[#6B7280] text-[#16181D] flex items-center justify-center transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
