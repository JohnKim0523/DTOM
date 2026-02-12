import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, setToken } from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await auth.register({ username, email, password });
      setToken(res.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <h1>DTOM</h1>
        <p>Don't Tread On Me — Organize. Assemble. Speak Freely.</p>
      </div>
      <div className="auth-card">
        <h2>Create Account</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Join DTOM</button>
        </form>
        <p>Already a member? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
