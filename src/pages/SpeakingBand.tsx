import { useState, useEffect, useRef } from "react";
import { Button, Typography, Avatar, Tag, Space } from "antd";
import {
  AudioOutlined,
  StopFilled,
  RobotOutlined,
  UserOutlined,
  ClearOutlined,
  RightCircleOutlined,
} from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { fetchAIResponse } from "../services/ai";

const { Title, Text } = Typography;

// --- Types ---
type Speaker = "examiner" | "candidate";
interface ChatMessage {
  role: Speaker;
  content: string;
}

type ExamStage = "intro" | "part1" | "part2" | "part3" | "feedback";

const SpeakingBand = () => {
  // --- State ---
  const [isListening, setIsListening] = useState(false);
  const [stage, setStage] = useState<ExamStage>("intro");
  const [history, setHistory] = useState<ChatMessage[]>([
    {
      role: "examiner",
      content: "Good afternoon. Can you tell me your full name?",
    },
  ]);
  const [processing, setProcessing] = useState(false);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Initial Greeting Audio
  useEffect(() => {
    // Small delay to allow interaction
    const timer = setTimeout(() => {
      if (history.length === 1) speak(history[0].content);
    }, 1000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Speech Logic ---

  const speak = (text: string) => {
    window.speechSynthesis.cancel(); // Stop previous
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;

    // Try to find a "Google US English" or similar natural voice
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.name.includes("Google") && v.lang.includes("en-US")
    );
    if (naturalVoice) utterance.voice = naturalVoice;

    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    // Browser support check
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        "Your browser does not support speech recognition. Please use Chrome."
      );
      return;
    }

    window.speechSynthesis.cancel(); // Stop AI from speaking if user interrupts
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setIsListening(false);
      handleUserTurn(text);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  };

  // --- Core Conversation Logic ---

  const handleUserTurn = async (userText: string) => {
    if (!userText.trim()) return;

    // 1. Add User Message
    const newHistory = [
      ...history,
      { role: "candidate", content: userText } as ChatMessage,
    ];
    setHistory(newHistory);
    setProcessing(true);

    // 2. Build Context for AI
    // We send the last 6 messages to keep context without hitting token limits
    const recentContext = newHistory
      .slice(-6)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const systemPrompt = getSystemPrompt(stage);
    const userPrompt = `
      CONTEXT (Last 6 turns):
      ${recentContext}
      
      INSTRUCTION:
      You are the Examiner. Respond to the CANDIDATE's last statement naturally.
      - Keep it conversational (1-3 sentences max).
      - Do not repeat "CANDIDATE" or "EXAMINER" labels in output.
      - If in Part 2, give them the topic.
      - If in Part 3, ask deeper questions.
      `;

    try {
      // 3. Get AI Response
      const reply = await fetchAIResponse(userPrompt, systemPrompt);

      // 4. Add AI Message
      setHistory((prev) => [...prev, { role: "examiner", content: reply }]);
      speak(reply);
    } catch (error) {
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const getSystemPrompt = (currentStage: ExamStage) => {
    // IELTS Examiners are formal, neutral, and adhere to a strict script.
    // They do NOT give feedback during the test, only at the very end (simulated here).
    const base = `You are an official IELTS Speaking Examiner. 
    Your demeanor is professional, neutral, and strictly timed. 
    Do not be overly conversational or chatty. 
    Your goal is to elicit language from the candidate, not to have a friendly chat.
    Keep your responses short (1-2 sentences) so the candidate does most of the talking.`;

    switch (currentStage) {
      case "intro":
        return `${base} 
        Current Phase: INTRODUCTION & IDENTITY CHECK.
        Script: "Good afternoon. My name is [AI Name]. Can you tell me your full name?"
        Then ask: "What can I call you?"
        Do not ask "How are you?" or make small talk. Stick to the protocol.`;

      case "part1":
        return `${base} 
        Current Phase: PART 1 (Interview).
        Instruction: Ask the candidate about familiar topics.
        1. Start with ONE mandatory topic: Work, Study, or Accommodation.
        2. Then move to ONE other random topic (e.g., Mirrors, Robots, Fishing, Gifts).
        3. Ask one question at a time.
        4. If the candidate answers "Yes" or "No" only, ask "Why?" or "Why not?" to extend them.`;

      case "part2":
        return `${base} 
        Current Phase: PART 2 (The Long Turn).
        Instruction: Provide a Topic Card (Cue Card).
        Script: "I'm going to give you a topic and I'd like you to talk about it for one to two minutes. Before you talk, you have one minute to think about what you're going to say. You can make some notes if you wish. Do you understand?"
        
        Then, present a topic (e.g., Describe a time you were late).
        List 4 bullet points they should cover.
        Tell them: "You may start speaking now."`;

      case "part3":
        return `${base} 
        Current Phase: PART 3 (Discussion).
        Instruction: Ask questions THEMATICALLY LINKED to the Part 2 topic, but shift to ABSTRACT/GENERAL ideas.
        - Do NOT ask about the candidate's personal life. Ask about "people in your country" or "society in general".
        - Use complex grammar in your questions (conditionals, speculation).
        - If they give a surface-level answer, ask a follow-up: "Can you give me an example?" or "Do you think this is true for everyone?"`;

      case "feedback":
        return `${base} 
        Current Phase: EVALUATION.
        The test is finished. Break character now.
        Provide a structured evaluation based on the 4 IELTS criteria:
        1. Fluency & Coherence
        2. Lexical Resource (Vocabulary)
        3. Grammatical Range & Accuracy
        4. Pronunciation
        
        Give an estimated Band Score (0-9) and 3 specific actionable tips to improve.`;

      default:
        return base;
    }
  };

  const advanceStage = () => {
    const stages: ExamStage[] = [
      "intro",
      "part1",
      "part2",
      "part3",
      "feedback",
    ];
    const currentIndex = stages.indexOf(stage);
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      setStage(nextStage);

      // Trigger the AI to start this section
      handleUserTurn(
        `(System: The exam is moving to ${nextStage}. Please start this section.)`
      );
    }
  };

  const resetExam = () => {
    window.speechSynthesis.cancel();
    setStage("intro");
    setHistory([
      {
        role: "examiner",
        content: "Good afternoon. Can you tell me your full name?",
      },
    ]);
    speak("Good afternoon. Can you tell me your full name?");
  };

  // --- Render ---

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        height: "80vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Speaking Simulator
          </Title>
          <Space>
            <Tag color="blue">{stage.toUpperCase()}</Tag>
            {isListening && (
              <Tag color="red" icon={<AudioOutlined spin />}>
                Listening...
              </Tag>
            )}
          </Space>
        </div>
        <Space>
          <Button onClick={advanceStage} disabled={stage === "feedback"}>
            Next Part <RightCircleOutlined />
          </Button>
          <Button icon={<ClearOutlined />} onClick={resetExam} danger>
            Reset
          </Button>
        </Space>
      </div>

      {/* Chat Area - Scrollable */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 20,
          background: "#f5f7fa",
          borderRadius: 16,
          border: "1px solid #e8e8e8",
          marginBottom: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {history.map((msg, idx) => {
          const isAi = msg.role === "examiner";
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: isAi ? "row" : "row-reverse",
                gap: 12,
              }}
            >
              <Avatar
                size={40}
                icon={isAi ? <RobotOutlined /> : <UserOutlined />}
                style={{
                  backgroundColor: isAi ? "#1890ff" : "#52c41a",
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  maxWidth: "80%",
                  background: isAi ? "#fff" : "#d9f7be",
                  padding: "12px 16px",
                  borderRadius: isAi ? "0 16px 16px 16px" : "16px 0 16px 16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <Text
                  strong
                  style={{
                    fontSize: 12,
                    color: "#888",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {isAi ? "EXAMINER" : "YOU"}
                </Text>
                <div
                  className="markdown-body"
                  style={{ fontSize: 15, lineHeight: 1.5 }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}
        {processing && (
          <div style={{ display: "flex", gap: 12 }}>
            <Avatar
              icon={<RobotOutlined />}
              style={{ backgroundColor: "#1890ff" }}
            />
            <div
              style={{
                padding: 12,
                background: "#fff",
                borderRadius: "0 16px 16px 16px",
              }}
            >
              <Text type="secondary">Thinking...</Text>
            </div>
          </div>
        )}
      </div>

      {/* Mic Control */}
      <div style={{ textAlign: "center", position: "relative" }}>
        {isListening && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: "2px solid #ff4d4f",
              opacity: 0.6,
              animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
            }}
          />
        )}
        <Button
          type="primary"
          shape="circle"
          size="large"
          danger={isListening}
          icon={isListening ? <StopFilled /> : <AudioOutlined />}
          style={{
            width: 64,
            height: 64,
            fontSize: 24,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            position: "relative",
            zIndex: 2,
          }}
          onClick={isListening ? stopListening : startListening}
          disabled={processing}
        />
        <div style={{ marginTop: 12, color: "#888", fontSize: 14 }}>
          {isListening
            ? "Listening... (Tap to stop)"
            : processing
            ? "Examiner is speaking..."
            : "Tap to Speak"}
        </div>
      </div>

      <style>{`@keyframes ping { 75%, 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }`}</style>
    </div>
  );
};

export default SpeakingBand;
