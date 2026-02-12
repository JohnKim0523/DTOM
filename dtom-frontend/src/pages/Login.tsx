import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, setToken } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await auth.login({ email, password });
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
        <h2>Sign In</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Sign In</button>
        </form>
        <p>No account? <Link to="/register">Join the movement</Link></p>
      </div>
    </div>
  );
}
