import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { Layout, Menu, ConfigProvider } from "antd";
import {
  AudioOutlined,
  ReadOutlined,
  EditOutlined,
  SoundOutlined,
  BookOutlined,
} from "@ant-design/icons";
import WritingBand from "./pages/WritingBand";
import SpeakingBand from "./pages/SpeakingBand";
import ReadingBand from "./pages/ReadingBand";
import ListeningBand from "./pages/ListeningBand";
import Home from "./pages/Home";
import "./App.css"; // Ensure CSS is imported

const { Header, Content, Footer } = Layout;

const AppContent = () => {
  const location = useLocation();

  // Dynamic active key based on route
  const currentKey = location.pathname.substring(1) || "";

  const items = [
    {
      key: "listening",
      icon: <SoundOutlined />,
      label: <Link to="/listening">Listening</Link>,
    },
    {
      key: "speaking",
      icon: <AudioOutlined />,
      label: <Link to="/speaking">Speaking</Link>,
    },
    {
      key: "reading",
      icon: <ReadOutlined />,
      label: <Link to="/reading">Reading</Link>,
    },
    {
      key: "writing",
      icon: <EditOutlined />,
      label: <Link to="/writing">Writing</Link>,
    },
  ];

  return (
    <Layout
      className="layout"
      style={{ minHeight: "100vh", background: "transparent" }}
    >
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          padding: "0 24px",
          height: 64,
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <Link to="/" style={{ textDecoration: "none" }}>
          <div
            style={{ display: "flex", alignItems: "center", marginRight: 40 }}
          >
            <BookOutlined
              style={{ fontSize: 24, color: "#5B8FF9", marginRight: 8 }}
            />
            <span
              style={{
                fontFamily: "Work Sans",
                fontWeight: 700,
                fontSize: 20,
                color: "#2c3e50",
                letterSpacing: "-0.5px",
              }}
            >
              IELTS<span style={{ color: "#5B8FF9" }}>.AI</span>
            </span>
          </div>
        </Link>

        <Menu
          mode="horizontal"
          selectedKeys={[currentKey]}
          items={items}
          style={{
            flex: 1,
            borderBottom: "none",
            background: "transparent",
            fontFamily: "Work Sans",
            fontWeight: 500,
          }}
        />
      </Header>

      <Content
        style={{
          padding: "40px 24px",
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listening" element={<ListeningBand />} />
          <Route path="/speaking" element={<SpeakingBand />} />
          <Route path="/reading" element={<ReadingBand />} />
          <Route path="/writing" element={<WritingBand />} />
        </Routes>
      </Content>

      <Footer
        style={{
          textAlign: "center",
          background: "transparent",
          color: "#8c8c8c",
        }}
      >
        IELTS AI Prep ©{new Date().getFullYear()} • Designed for Focus
      </Footer>
    </Layout>
  );
};

const App = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "'Work Sans', sans-serif",
          colorPrimary: "#5B8FF9",
          borderRadius: 12,
          colorBgContainer: "#ffffff",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        },
        components: {
          Button: {
            fontWeight: 600,
            controlHeightLG: 48,
          },
          Card: {
            boxShadowTertiary: "0 10px 30px rgba(0,0,0,0.05)", // Soft dreamy shadow
          },
          Typography: {
            fontFamilyCode: "'Work Sans', sans-serif",
          },
        },
      }}
    >
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
