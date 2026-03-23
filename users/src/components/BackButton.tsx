import { useNavigate, useLocation } from 'react-router-dom';

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Don't show on dashboard (home page)
  if (location.pathname === '/dashboard') return null;
  
  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition mb-4"
    >
      ← Back
    </button>
  );
};

export default BackButton;
