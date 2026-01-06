import React from "react";
import { Typography, Card, Row, Col, Button, Space, Tag } from "antd";
import {
  EditOutlined,
  ReadOutlined,
  SoundOutlined,
  AudioOutlined,
  ArrowRightOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      key: "listening",
      title: "Listening",
      icon: <SoundOutlined style={{ fontSize: 32, color: "#722ed1" }} />,
      desc: "Immersive audio tests. Listen to AI-narrated monologues and dialogues to improve retention.",
      link: "/listening",
      color: "#f9f0ff",
      tag: "Text-to-Speech",
    },
    {
      key: "speaking",
      title: "Speaking",
      icon: <AudioOutlined style={{ fontSize: 32, color: "#52c41a" }} />,
      desc: "Real-time voice simulation. Practice Parts 1, 2, and 3 with an AI examiner that listens and responds.",
      link: "/speaking",
      color: "#f6ffed",
      tag: "Voice Interaction",
    },
    {
      key: "reading",
      title: "Reading",
      icon: <ReadOutlined style={{ fontSize: 32, color: "#faad14" }} />,
      desc: "Generate unlimited academic passages. Test your comprehension with MCQ and True/False questions.",
      link: "/reading",
      color: "#fffbe6",
      tag: "Auto-Generated",
    },
    {
      key: "writing",
      title: "Writing",
      icon: <EditOutlined style={{ fontSize: 32, color: "#1890ff" }} />,
      desc: "Instant AI grading for Task 2 essays. Get band scores, grammar corrections, and structural feedback.",
      link: "/writing",
      color: "#e6f7ff",
      tag: "Essay Grading",
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
      {/* Hero Section */}
      <div style={{ textAlign: "center", padding: "60px 20px 80px" }}>
        <Space direction="vertical" size="large">
          <Tag
            color="blue"
            style={{ padding: "4px 12px", fontSize: 14, borderRadius: 20 }}
          >
            <RocketOutlined /> Powered by Groq AI
          </Tag>
          <Title
            level={1}
            style={{ fontSize: 48, marginBottom: 0, letterSpacing: -1 }}
          >
            Master IELTS with{" "}
            <span style={{ color: "#1890ff" }}>Artificial Intelligence</span>
          </Title>
          <Paragraph
            type="secondary"
            style={{ fontSize: 18, maxWidth: 600, margin: "0 auto" }}
          >
            Unlimited practice for all four skills. Get instant feedback,
            generate unique test materials, and simulate real exam conditions
            24/7.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            shape="round"
            icon={<ArrowRightOutlined />}
            style={{
              height: 50,
              padding: "0 40px",
              fontSize: 16,
              marginTop: 16,
            }}
            onClick={() => navigate("/writing")}
          >
            Start Practicing Now
          </Button>
        </Space>
      </div>

      {/* Feature Grid */}
      <Row gutter={[32, 32]}>
        {features.map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.key}>
            <Card
              hoverable
              bordered={false}
              style={{
                height: "100%",
                borderRadius: 16,
                transition: "all 0.3s ease",
              }}
              bodyStyle={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                padding: 32,
              }}
              onClick={() => navigate(item.link)}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: item.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                {item.icon}
              </div>

              <Title level={4} style={{ marginBottom: 12 }}>
                {item.title}
              </Title>

              <div style={{ marginBottom: 16 }}>
                <Tag bordered={false}>{item.tag}</Tag>
              </div>

              <Text
                type="secondary"
                style={{ flex: 1, fontSize: 15, lineHeight: 1.6 }}
              >
                {item.desc}
              </Text>

              <div
                style={{
                  marginTop: 24,
                  fontWeight: 600,
                  color: "#1890ff",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Practice{" "}
                <ArrowRightOutlined style={{ fontSize: 12, marginLeft: 6 }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Home;
