import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Typography,
  Radio,
  Space,
  Tag,
  Alert,
  message,
  Spin,
} from "antd";
import {
  PlayCircleFilled,
  PauseCircleFilled,
  ReloadOutlined,
  SoundOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  StopFilled,
} from "@ant-design/icons";
import { fetchAIResponse } from "../services/ai";

const { Title, Text, Paragraph } = Typography;

// --- Interfaces ---
interface Question {
  id: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
}
interface ListeningTest {
  topic: string;
  script: string;
  questions: Question[];
}

const ListeningBand: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState<ListeningTest | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // Track pause state specifically

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // --- Logic ---

  const generateListeningTest = async () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);

    setLoading(true);
    setTestData(null);
    setAnswers({});
    setSubmitted(false);

    const systemPrompt = `You are an IELTS Listening Exam generator. Output STRICT VALID JSON only.`;

    // UPDATED PROMPT WITH MORE TOPICS
    const userPrompt = `Generate a generic IELTS Section 2 Monologue (approx 200-250 words). 
    
    Pick a RANDOM topic from this list below:
    - A tour guide describing a historic building or museum layout.
    - A radio presenter talking about a local charity event or festival.
    - A club secretary explaining membership rules (e.g., Hiking club, Gym, Drama society).
    - An HR manager giving an orientation talk to new employees.
    - A park ranger explaining rules and wildlife in a national park.
    - A librarian explaining new digital resources.
    - A volunteer coordinator describing a tree-planting project.

    Followed by 4 Multiple Choice Questions based on specific details (numbers, times, names, locations).
    
    Required JSON Structure:
    {
        "topic": "Title",
        "script": "Full text of the audio...",
        "questions": [
            {
                "id": 1,
                "questionText": "Question?",
                "options": ["Option A", "Option B", "Option C"],
                "correctAnswer": "Option A"
            }
        ]
    }`;

    try {
      const raw = await fetchAIResponse(userPrompt, systemPrompt);
      const validatedData = parseAndValidateJson(raw);
      setTestData(validatedData);
    } catch (e) {
      console.error(e);
      message.error("Failed to generate valid test data.");
    } finally {
      setLoading(false);
    }
  };

  const parseAndValidateJson = (responseString: string): ListeningTest => {
    try {
      const jsonMatch = responseString.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseString;
      const data = JSON.parse(jsonStr);

      if (!data.topic) data.topic = "Listening Exercise";
      if (!data.script) data.script = "Audio script missing.";
      if (!Array.isArray(data.questions)) data.questions = [];

      data.questions = data.questions.map((q: any, idx: number) => ({
        id: q.id || idx + 1,
        questionText: q.questionText || "Question missing",
        options: Array.isArray(q.options) ? q.options : ["True", "False"],
        correctAnswer: q.correctAnswer || "",
      }));

      return data as ListeningTest;
    } catch (e) {
      throw new Error("Invalid JSON structure");
    }
  };

  // --- Native TTS Control ---

  const handlePlay = () => {
    if (!testData) return;

    // Case 1: Resuming from pause
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    // Case 2: Already playing (do nothing or safeguard)
    if (window.speechSynthesis.speaking) {
      return;
    }

    // Case 3: Start fresh
    const utterance = new SpeechSynthesisUtterance(testData.script);
    utterance.lang = "en-US";
    utterance.rate = 0.9; // Slightly slower for IELTS clarity
    utterance.pitch = 1;

    // Attempt to pick a British voice
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.name.includes("Google") && v.lang.includes("en-US")
    );
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      console.error("Browser TTS Error");
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false); // UI state update
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  // --- Render ---

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 40 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Listening Practice
          </Title>
          <Text type="secondary">
            Listen to the audio and answer the questions.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={generateListeningTest}
          loading={loading}
          shape="round"
        >
          New Audio
        </Button>
      </div>

      {!testData && !loading && (
        <Alert
          message="Ready to start?"
          description="Click 'New Audio' to generate a listening test."
          type="info"
          showIcon
        />
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 50 }}>
          <Spin size="large" />
        </div>
      )}

      {testData && (
        <Card
          bordered={false}
          style={{
            marginBottom: 32,
            background: "linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)",
            borderRadius: 24,
            color: "white",
            boxShadow: "0 20px 40px rgba(38, 208, 206, 0.3)",
          }}
          bodyStyle={{ padding: 40, textAlign: "center" }}
        >
          <SoundOutlined
            style={{
              fontSize: 40,
              color: "rgba(255,255,255,0.8)",
              marginBottom: 16,
            }}
          />
          <Title level={3} style={{ color: "white", margin: 0 }}>
            {testData.topic}
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.8)" }}>
            IELTS Section 2 • Audio Stream
          </Text>

          <div
            style={{
              marginTop: 32,
              display: "flex",
              justifyContent: "center",
              gap: 24,
            }}
          >
            {/* Play/Resume Button */}
            {!isPlaying ? (
              <Button
                shape="circle"
                size="large"
                onClick={handlePlay}
                style={{
                  width: 80,
                  height: 80,
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <PlayCircleFilled style={{ fontSize: 48, color: "white" }} />
              </Button>
            ) : (
              <Button
                shape="circle"
                size="large"
                onClick={handlePause}
                style={{
                  width: 80,
                  height: 80,
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <PauseCircleFilled style={{ fontSize: 48, color: "white" }} />
              </Button>
            )}

            {/* Stop Button (to reset) */}
            {(isPlaying || isPaused) && (
              <Button
                shape="circle"
                size="large"
                onClick={handleStop}
                style={{
                  width: 80,
                  height: 80,
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255, 77, 79, 0.6)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <StopFilled style={{ fontSize: 32, color: "white" }} />
              </Button>
            )}
          </div>

          <div style={{ marginTop: 16, fontSize: 14, opacity: 0.8 }}>
            {isPlaying ? "Playing..." : isPaused ? "Paused" : "Tap to Play"}
          </div>
        </Card>
      )}

      {testData && (
        <div className="questions-container">
          {testData.questions?.map((q, idx) => (
            <Card
              key={q.id}
              style={{ marginBottom: 16, borderRadius: 16 }}
              bordered={false}
            >
              <Text strong style={{ fontSize: 16 }}>
                {idx + 1}. {q.questionText}
              </Text>
              <div style={{ marginTop: 12 }}>
                <Radio.Group
                  onChange={(e) =>
                    !submitted &&
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  value={answers[q.id]}
                  style={{ width: "100%" }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {q.options?.map((opt) => {
                      const isSelected = answers[q.id] === opt;
                      const isCorrect = q.correctAnswer === opt;
                      let style: React.CSSProperties = {
                        fontSize: 15,
                        padding: 8,
                        borderRadius: 8,
                        display: "block",
                      };

                      if (submitted) {
                        if (isCorrect) style.background = "#f6ffed";
                        if (isSelected && !isCorrect)
                          style.background = "#fff1f0";
                      }

                      return (
                        <Radio
                          key={opt}
                          value={opt}
                          style={{ ...style, margin: 0 }}
                        >
                          {opt}
                          {submitted && isCorrect && (
                            <Tag color="success" style={{ marginLeft: 8 }}>
                              <CheckCircleFilled /> Correct
                            </Tag>
                          )}
                          {submitted && isSelected && !isCorrect && (
                            <Tag color="error" style={{ marginLeft: 8 }}>
                              <CloseCircleFilled /> Incorrect
                            </Tag>
                          )}
                        </Radio>
                      );
                    })}
                  </Space>
                </Radio.Group>
              </div>
            </Card>
          ))}

          {!submitted && testData.questions?.length > 0 && (
            <Button
              type="primary"
              size="large"
              block
              shape="round"
              onClick={() => {
                let s = 0;
                testData.questions.forEach((q) => {
                  if (answers[q.id] === q.correctAnswer) s++;
                });
                setScore(s);
                setSubmitted(true);
              }}
              style={{ marginTop: 16 }}
            >
              Submit Answers
            </Button>
          )}

          {submitted && (
            <div>
              <Alert
                message={`Score: ${score} / ${testData.questions.length}`}
                type={score === testData.questions.length ? "success" : "info"}
                showIcon
                style={{ marginTop: 24, marginBottom: 24 }}
              />

              <Card title="Audio Transcript" size="small" type="inner">
                <Paragraph type="secondary" style={{ fontSize: 14 }}>
                  {testData.script}
                </Paragraph>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ListeningBand;
