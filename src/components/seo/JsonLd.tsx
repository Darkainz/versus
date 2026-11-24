import { jsonLdString } from "@/lib/json-ld";

/** Balise `<script type="application/ld+json">` (composant serveur, contenu échappé). */
export function JsonLd({ data }: { data: object }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />
  );
}
