/**
 * Attractive info card for explanatory content.
 * Use instead of plain section subtexts.
 */
import './InfoCard.css';

export default function InfoCard({ icon, title, children, variant = 'default' }) {
  return (
    <div className={`info-card info-card--${variant}`}>
      {icon && <span className="info-card__icon">{icon}</span>}
      <div className="info-card__content">
        {title && <h3 className="info-card__title">{title}</h3>}
        <div className="info-card__body">{children}</div>
      </div>
    </div>
  );
}
