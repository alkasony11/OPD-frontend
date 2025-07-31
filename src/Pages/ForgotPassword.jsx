import { useState } from 'react';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setMsg('Check your email for a password reset link.');
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending reset link');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Forgot Password</h2>
        {msg && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{msg}</div>}
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
          <button type="submit" className="w-full bg-black text-white py-3 rounded-lg font-semibold">
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
}