/**
 * Unified logo combining API Usage Monitor with a distinct font.
 */
import './AppLogo.css';

export default function AppLogo({ variant = 'nav' }) {
  return (
    <span className={`app-logo app-logo--${variant}`}>
      <span className="app-logo__api">API</span>
      {' '}
      <span className="app-logo__usage">Usage</span>
      {' '}
      <span className="app-logo__monitor">Monitor</span>
    </span>
  );
}
