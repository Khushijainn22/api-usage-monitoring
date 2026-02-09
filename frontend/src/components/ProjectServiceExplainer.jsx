/**
 * Plain-language explainer for the project & service relationship.
 */
import InfoCard from "./InfoCard";

export default function ProjectServiceExplainer() {
  return (
    <InfoCard title="Track every deployment separately..." variant="muted">
      <p>
        <strong>Project</strong>: One backend app or API
      </p>
      <p>
        <strong>Service</strong>: One deployment of that backend. Could be
        dev/staging/prod, different regions, API versions, or separate instances
        — each gets its own key so we can track it separately.
      </p>
    </InfoCard>
  );
}
