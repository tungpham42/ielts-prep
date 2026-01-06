import React, { useState } from "react";
import {
  Button,
  Card,
  Typography,
  Radio,
  Space,
  Spin,
  Row,
  Col,
  Tag,
  Alert,
  message,
} from "antd";
import {
  ReadOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ReloadOutlined,
} from "@ant-design/icons";
import { fetchAIResponse } from "../services/ai";

const { Title, Paragraph, Text } = Typography;

// --- Interfaces ---
interface Question {
  id: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  type: "MCQ" | "TFNG";
}

interface ReadingTest {
  topic: string;
  passage: string;
  questions: Question[];
}

const ReadingBand: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState<ReadingTest | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // --- Logic ---

  const generateReadingTest = async () => {
    setLoading(true);
    setTestData(null);
    setAnswers({});
    setSubmitted(false);

    const systemPrompt = `You are an IELTS Reading Exam generator. Output STRICT VALID JSON only.`;
    const userPrompt = `Generate a short academic reading passage (approx 250 words, Topic: Random). 
    Followed by 4 questions (2 MCQ, 2 TFNG). 
    
    Structure:
    {
        "topic": "Title",
        "passage": "Text...",
        "questions": [
            { "id": 1, "questionText": "...", "options": ["A", "B"], "correctAnswer": "A", "type": "MCQ" }
        ]
    }`;

    try {
      const rawResponse = await fetchAIResponse(userPrompt, systemPrompt);
      const parsedData = parseAndValidateJson(rawResponse); // Use the new validator
      setTestData(parsedData);
    } catch (error) {
      console.error(error);
      message.error("Failed to generate a valid test. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- ROBUST PARSER & VALIDATOR ---
  const parseAndValidateJson = (responseString: string): ReadingTest => {
    try {
      // 1. Extract JSON from potential Markdown wrappers
      const jsonMatch = responseString.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseString;

      // 2. Parse
      const data = JSON.parse(jsonStr);

      // 3. VALIDATION: Ensure arrays exist to prevent .map() crashes
      if (!data.topic) data.topic = "Unknown Topic";
      if (!data.passage) data.passage = "No passage generated.";

      // Ensure 'questions' is an array
      if (!Array.isArray(data.questions)) {
        data.questions = [];
      }

      // Ensure 'options' inside questions are arrays
      data.questions = data.questions.map((q: any, idx: number) => ({
        id: q.id || idx + 1,
        questionText: q.questionText || "Question text missing",
        options: Array.isArray(q.options)
          ? q.options
          : ["True", "False", "Not Given"], // Fallback options
        correctAnswer: q.correctAnswer || "",
        type: q.type || "MCQ",
      }));

      return data as ReadingTest;
    } catch (e) {
      console.error("JSON Parsing Error:", e);
      throw new Error("Invalid structure");
    }
  };

  const handleSubmit = () => {
    if (!testData) return;
    let s = 0;
    testData.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) s++;
    });
    setScore(s);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Render ---

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
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
            Reading Comprehension
          </Title>
          <Text type="secondary">Academic Reading Module</Text>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={generateReadingTest}
          loading={loading}
          shape="round"
          size="large"
        >
          {testData ? "Generate Fresh Test" : "Start Practice"}
        </Button>
      </div>

      {!testData && !loading && (
        <div
          style={{
            textAlign: "center",
            padding: "80px 0",
            background: "#fff",
            borderRadius: 16,
          }}
        >
          <ReadOutlined
            style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 16 }}
          />
          <Title level={4} style={{ color: "#8c8c8c" }}>
            No Test Loaded
          </Title>
          <Text type="secondary">
            Click the button above to generate an AI-powered reading test.
          </Text>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 100 }}>
          <Spin size="large" tip="Composing academic passage..." />
        </div>
      )}

      {testData && (
        <Row gutter={[32, 32]}>
          {/* Passage Column */}
          <Col xs={24} md={12}>
            <Card
              bordered={false}
              style={{
                height: "calc(100vh - 140px)",
                overflowY: "auto",
                background: "#fffbf2",
                border: "1px solid #f0e6d2",
              }}
            >
              <Tag color="orange" style={{ marginBottom: 16 }}>
                PASSAGE
              </Tag>
              <Title
                level={3}
                style={{ marginTop: 0, fontFamily: "Work Sans" }}
              >
                {testData.topic}
              </Title>
              <Paragraph
                style={{
                  fontSize: 17,
                  lineHeight: "2",
                  textAlign: "justify",
                  color: "#333",
                }}
              >
                {testData.passage}
              </Paragraph>
            </Card>
          </Col>

          {/* Questions Column */}
          <Col xs={24} md={12}>
            <div
              style={{
                height: "calc(100vh - 140px)",
                overflowY: "auto",
                paddingRight: 8,
              }}
            >
              {submitted && (
                <Alert
                  message={
                    <span style={{ fontWeight: 600, fontSize: 16 }}>
                      Score: {score} / {testData.questions.length}
                    </span>
                  }
                  description={
                    score === testData.questions.length
                      ? "Perfect score! Outstanding reading skills."
                      : "Review your mistakes below."
                  }
                  type={
                    score === testData.questions.length ? "success" : "info"
                  }
                  showIcon
                  style={{
                    marginBottom: 24,
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                />
              )}

              {/* SAFE RENDERING: Note the optional chaining ?. just in case */}
              {testData.questions?.map((q, index) => (
                <Card
                  key={q.id}
                  bordered={false}
                  style={{ marginBottom: 16, borderRadius: 12 }}
                >
                  <div style={{ display: "flex", gap: 12 }}>
                    <div
                      style={{
                        background: "#E6F7FF",
                        color: "#1890FF",
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text
                        strong
                        style={{
                          fontSize: 16,
                          display: "block",
                          marginBottom: 12,
                        }}
                      >
                        {q.questionText}
                      </Text>
                      <Radio.Group
                        onChange={(e) =>
                          !submitted &&
                          setAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        value={answers[q.id]}
                        style={{ width: "100%" }}
                      >
                        <Space direction="vertical" style={{ width: "100%" }}>
                          {/* Validate options exists before mapping */}
                          {q.options && q.options.length > 0 ? (
                            q.options.map((option) => {
                              const isSelected = answers[q.id] === option;
                              const isCorrect = q.correctAnswer === option;

                              let style: React.CSSProperties = {
                                padding: "12px 16px",
                                borderRadius: 8,
                                border: "1px solid #f0f0f0",
                                width: "100%",
                                display: "flex",
                                background: "#fff",
                                alignItems: "center",
                              };

                              if (isSelected)
                                style.border = "1px solid #1890FF";
                              if (submitted) {
                                if (isCorrect)
                                  style = {
                                    ...style,
                                    background: "#F6FFED",
                                    border: "1px solid #B7EB8F",
                                  };
                                else if (isSelected && !isCorrect)
                                  style = {
                                    ...style,
                                    background: "#FFF1F0",
                                    border: "1px solid #FFA39E",
                                  };
                              }

                              return (
                                <Radio
                                  value={option}
                                  key={option}
                                  style={{
                                    width: "100%",
                                    margin: 0,
                                    padding: 0,
                                  }}
                                >
                                  <div style={{ ...style, cursor: "pointer" }}>
                                    <span style={{ flex: 1 }}>{option}</span>
                                    {submitted && isCorrect && (
                                      <CheckCircleFilled
                                        style={{
                                          color: "#52c41a",
                                          fontSize: 18,
                                        }}
                                      />
                                    )}
                                    {submitted && isSelected && !isCorrect && (
                                      <CloseCircleFilled
                                        style={{
                                          color: "#ff4d4f",
                                          fontSize: 18,
                                        }}
                                      />
                                    )}
                                  </div>
                                </Radio>
                              );
                            })
                          ) : (
                            <Text type="danger">
                              Error: No options generated for this question.
                            </Text>
                          )}
                        </Space>
                      </Radio.Group>
                    </div>
                  </div>
                </Card>
              ))}

              {!submitted && testData.questions?.length > 0 && (
                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={handleSubmit}
                  shape="round"
                  style={{ marginTop: 16, height: 50 }}
                >
                  Submit Answers
                </Button>
              )}
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default ReadingBand;
