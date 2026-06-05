import './Legal.css';

export default function MentionsLegales() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div className="container">
          <p className="legal-eyebrow">Informations légales</p>
          <h1>Mentions légales</h1>
          <p className="legal-hero-sub">Dernière mise à jour : mai 2026</p>
        </div>
      </div>

      <div className="container legal-body">

        <section className="legal-section">
          <h2>1. Éditeur du site</h2>
          <p>Le site <strong>MiabeTrans</strong> est édité par :</p>
          <div className="legal-info-box">
            <p><strong>Raison sociale :</strong> MiabeTrans</p>
            <p><strong>Activité :</strong> Transport interurbain de voyageurs au Togo</p>
            <p><strong>Siège social :</strong> Lomé, Togo</p>
            <p><strong>Téléphone :</strong> +228 90 00 00 01</p>
            <p><strong>Email :</strong> contact@miabetrans.tg</p>
            <p><strong>Développeur :</strong> NATO Komi Ephraïm Dieudonné — FORMATEC</p>
          </div>
        </section>

        <section className="legal-section">
          <h2>2. Hébergement</h2>
          <p>Ce site est hébergé localement via un serveur WAMP dans un environnement de développement. Pour la mise en production, le site sera hébergé par un prestataire agréé au Togo ou en Afrique de l'Ouest.</p>
        </section>

        <section className="legal-section">
          <h2>3. Propriété intellectuelle</h2>
          <p>
            L'ensemble des contenus présents sur ce site (textes, images, logos, icônes, structure) sont la propriété exclusive de MiabeTrans ou de ses partenaires. Toute reproduction, distribution ou utilisation sans autorisation préalable est strictement interdite.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Responsabilité</h2>
          <p>
            MiabeTrans met tout en œuvre pour assurer l'exactitude des informations publiées. Cependant, nous ne pouvons garantir l'exhaustivité ou l'absence d'erreur des informations présentes sur ce site. MiabeTrans décline toute responsabilité pour tout dommage résultant de l'utilisation de ces informations.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Liens hypertextes</h2>
          <p>
            Le site MiabeTrans peut contenir des liens vers des sites tiers. Ces liens sont fournis à titre indicatif uniquement. MiabeTrans n'est pas responsable du contenu de ces sites externes.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Droit applicable</h2>
          <p>
            Les présentes mentions légales sont régies par le droit togolais. Tout litige relatif à l'utilisation de ce site sera soumis à la compétence exclusive des tribunaux de Lomé, Togo.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Contact</h2>
          <p>
            Pour toute question concernant ces mentions légales, vous pouvez nous contacter à :<br/>
            <strong>contact@miabetrans.tg</strong> ou au <strong>+228 90 00 00 01</strong>
          </p>
        </section>

      </div>
    </div>
  );
}
