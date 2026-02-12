import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import CreateEvent from './pages/CreateEvent';
import EventDetail from './pages/EventDetail';
import Account from './pages/Account';
import UserProfile from './pages/UserProfile';
import MessagesPage from './pages/Messages';
import Conversation from './pages/Conversation';
import NotificationsPage from './pages/Notifications';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
        <Route path="/events/new" element={<PrivateRoute><CreateEvent /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
        <Route path="/messages/:userId" element={<PrivateRoute><Conversation /></PrivateRoute>} />
        <Route path="/users/:id" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
        <Route path="/events/:id" element={<PrivateRoute><EventDetail /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
