import { useNavigate } from "react-router-dom";

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/")}
      style={{
        marginBottom: "10px",
        cursor: "pointer",
        padding: "8px 14px",
        border: "none",
        borderRadius: "6px",
        background: "#ddd",
      }}
    >
      ⬅ Back
    </button>
  );
};

export default BackButton;