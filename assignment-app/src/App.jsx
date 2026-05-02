import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AssignmentList from './components/AssignmentList';
import GroupChat from './components/GroupChat';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assignments" element={<AssignmentList />} />
          <Route path="/chat" element={<GroupChat />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;