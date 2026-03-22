import React, { useState } from 'react';
import { USERS } from '../game/types';

interface Props {
  onLogin: (username: string) => void;
}

export const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = username.toLowerCase().trim();

    if (USERS[user] && USERS[user] === password) {
      onLogin(user);
    } else {
      setError('Wrong username or password');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bg} />
      <div style={styles.content}>
        <div style={styles.logoSection}>
          <h1 style={styles.title}>SNAKE</h1>
          <div style={styles.divider} />
          <span style={styles.subtitle}>25|OCHO</span>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            ...styles.form,
            animation: shake ? 'shake 0.5s ease-in-out' : 'none',
          }}
        >
          <style>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              20% { transform: translateX(-8px); }
              40% { transform: translateX(8px); }
              60% { transform: translateX(-4px); }
              80% { transform: translateX(4px); }
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="Enter username"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              style={styles.input}
              placeholder="Enter password"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button}>
            Enter
          </button>
        </form>

        <p style={styles.footer}>Multiplayer Snake</p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(6,182,212,0.06) 0%, transparent 60%)',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 40,
    padding: '0 24px',
    width: '100%',
    maxWidth: 360,
    animation: 'fadeIn 0.6s ease-out',
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 56,
    fontWeight: 900,
    letterSpacing: '-0.04em',
    color: '#e4e4e7',
    lineHeight: 1,
  },
  divider: {
    width: 48,
    height: 2,
    background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
    borderRadius: 1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 500,
    color: '#71717a',
    letterSpacing: '0.2em',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: '#71717a',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    background: '#111113',
    border: '1px solid #27272a',
    borderRadius: 12,
    color: '#e4e4e7',
    fontSize: 16,
    transition: 'border-color 0.2s',
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center' as const,
    fontWeight: 500,
  },
  button: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    marginTop: 4,
  },
  footer: {
    fontSize: 13,
    color: '#3f3f46',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },
};
