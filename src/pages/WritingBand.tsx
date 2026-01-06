import { useState } from "react";
import {
  Input,
  Button,
  Card,
  Typography,
  Space,
  Spin,
  message,
  Divider,
} from "antd";
import { ReloadOutlined, ThunderboltFilled } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { fetchAIResponse } from "../services/ai";

const { TextArea } = Input;
const { Title, Text } = Typography;

const WritingBand = () => {
  const [topic, setTopic] = useState(
    "Some people believe that AI will replace teachers. Others think that students will always need human interaction. Discuss both views and give your opinion."
  );

  const [essay, setEssay] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loadingGrade, setLoadingGrade] = useState(false);
  const [loadingTopic, setLoadingTopic] = useState(false);

  const generateNewTopic = async () => {
    setLoadingTopic(true);
    setFeedback("");
    setEssay("");
    const systemPrompt = "You are an IELTS exam coordinator.";

    // UPDATED PROMPT: Added more diverse topics
    const userPrompt = `Generate a single, unique IELTS Writing Task 2 prompt.
    Pick ONE random topic from this list:
    - Technology & AI
    - Environment & Climate Change
    - Education & University Costs
    - Government Spending (Art vs. Public Services)
    - Crime & Punishment
    - Globalization & Culture
    - Health & Diet
    - Remote Work & Employment
    - Media & Advertising

    Output ONLY the prompt text. Do not output anything else.`;

    try {
      const newTopic = await fetchAIResponse(userPrompt, systemPrompt);
      setTopic(newTopic);
    } catch (error) {
      message.error("Failed to generate new topic.");
    } finally {
      setLoadingTopic(false);
    }
  };

  const handleGrade = async () => {
    if (!essay.trim() || essay.length < 50) {
      message.warning("Your essay is too short to grade properly.");
      return;
    }
    setLoadingGrade(true);

    const systemPrompt = `You are a strict IELTS examiner. Evaluate based on prompt: "${topic}". 
    Output Markdown: 
    1. **Overall Band Score** (Bold H2). 
    2. Markdown Table for criteria (Task Response, Coherence, Lexical, Grammar). 
    3. Detailed bullets on strengths/weaknesses. 
    4. Corrected paragraph.`;

    try {
      const result = await fetchAIResponse(essay, systemPrompt);
      setFeedback(result);
    } catch (error) {
      setFeedback("Error generating feedback.");
    } finally {
      setLoadingGrade(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
            Writing Laboratory
          </Title>
          <Text type="secondary">Task 2: Essay Writing</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={generateNewTopic}
          loading={loadingTopic}
          shape="round"
        >
          New Topic
        </Button>
      </div>

      <Card
        bordered={false}
        style={{
          marginBottom: 24,
          background: "#fff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        }}
      >
        <Space align="start">
          <ThunderboltFilled
            style={{ fontSize: 24, color: "#FAAD14", marginTop: 4 }}
          />
          <div>
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 1,
                fontWeight: 600,
              }}
            >
              Current Prompt
            </Text>
            <Spin spinning={loadingTopic}>
              <div
                style={{
                  fontSize: 18,
                  marginTop: 8,
                  lineHeight: 1.6,
                  color: "#2c3e50",
                }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {topic}
                </ReactMarkdown>
              </div>
            </Spin>
          </div>
        </Space>
      </Card>

      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        }}
      >
        <TextArea
          rows={15}
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          placeholder="Start writing your response here..."
          style={{
            border: "none",
            fontSize: 16,
            padding: 32,
            resize: "none",
            background: "#fff",
            lineHeight: 1.8,
          }}
          disabled={loadingGrade}
        />
        <div
          style={{
            padding: "16px 32px",
            background: "#fafafa",
            borderTop: "1px solid #f0f0f0",
            textAlign: "right",
          }}
        >
          <Text type="secondary" style={{ marginRight: 16 }}>
            {essay.split(" ").filter((w) => w !== "").length} words
          </Text>
          <Button
            type="primary"
            onClick={handleGrade}
            loading={loadingGrade}
            size="large"
            shape="round"
            disabled={loadingTopic}
            style={{ minWidth: 160 }}
          >
            {loadingGrade ? "Analyzing..." : "Grade My Essay"}
          </Button>
        </div>
      </Card>

      {feedback && (
        <Card
          style={{ marginTop: 40, border: "none", background: "transparent" }}
          bodyStyle={{ padding: 0 }}
        >
          <Divider style={{ fontSize: 20, borderColor: "#d9d9d9" }}>
            Examiner Report
          </Divider>
          <div
            className="markdown-body"
            style={{
              background: "#fff",
              padding: 40,
              borderRadius: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {feedback}
            </ReactMarkdown>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WritingBand;
