import { useNavigate } from 'react-router-dom';

const BackButton = () => {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate(-1)} 
      style={{ marginBottom: '10px', cursor: 'pointer' }}
    >
      ⬅ Back
    </button>
  );
};

export default BackButton;