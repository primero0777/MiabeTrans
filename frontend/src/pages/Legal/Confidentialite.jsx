import './Legal.css';

export default function Confidentialite() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div className="container">
          <p className="legal-eyebrow">Vie privée</p>
          <h1>Politique de confidentialité</h1>
          <p className="legal-hero-sub">Dernière mise à jour : mai 2026</p>
        </div>
      </div>

      <div className="container legal-body">

        <section className="legal-section">
          <h2>1. Données collectées</h2>
          <p>Dans le cadre de l'utilisation de la plateforme MiabeTrans, nous collectons les données suivantes :</p>
          <ul className="legal-list">
            <li><strong>Informations d'identité :</strong> nom, prénom, numéro de téléphone</li>
            <li><strong>Données de connexion :</strong> adresse email, mot de passe (chiffré)</li>
            <li><strong>Données de réservation :</strong> trajets, dates, nombre de places, mode de paiement</li>
            <li><strong>Données techniques :</strong> adresse IP, type de navigateur (via logs serveur)</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>2. Finalité du traitement</h2>
          <p>Les données collectées sont utilisées pour :</p>
          <ul className="legal-list">
            <li>Gérer votre compte et vos réservations</li>
            <li>Envoyer des confirmations de réservation par email</li>
            <li>Assurer la sécurité et le bon fonctionnement du service</li>
            <li>Améliorer notre plateforme via des statistiques anonymes</li>
            <li>Vous contacter en cas de modification ou annulation d'un trajet</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Conservation des données</h2>
          <p>
            Vos données personnelles sont conservées pour la durée nécessaire à la fourniture du service, et au maximum <strong>3 ans</strong> après votre dernière activité sur la plateforme. Les données de réservation sont conservées 5 ans à des fins comptables et légales.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Partage des données</h2>
          <p>
            MiabeTrans ne vend ni ne loue vos données personnelles à des tiers. Vos données peuvent être partagées uniquement avec :
          </p>
          <ul className="legal-list">
            <li>Les chauffeurs concernés par votre réservation (nom et trajet uniquement)</li>
            <li>Les autorités compétentes en cas d'obligation légale</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Sécurité</h2>
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou divulgation. Les mots de passe sont chiffrés et les tokens d'authentification sont sécurisés via JWT.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Vos droits</h2>
          <p>Conformément aux lois en vigueur, vous disposez des droits suivants :</p>
          <ul className="legal-list">
            <li><strong>Droit d'accès :</strong> consulter les données que nous détenons sur vous</li>
            <li><strong>Droit de rectification :</strong> corriger vos informations personnelles</li>
            <li><strong>Droit à l'effacement :</strong> demander la suppression de votre compte et données</li>
            <li><strong>Droit d'opposition :</strong> vous opposer à certains traitements de vos données</li>
          </ul>
          <p>Pour exercer ces droits, contactez-nous à <strong>contact@miabetrans.tg</strong>.</p>
        </section>

        <section className="legal-section">
          <h2>7. Cookies</h2>
          <p>
            MiabeTrans utilise le stockage local du navigateur (<code>localStorage</code>) pour maintenir votre session de connexion. Aucun cookie de tracking tiers n'est utilisé.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Contact</h2>
          <p>
            Pour toute question relative à cette politique de confidentialité :<br/>
            <strong>contact@miabetrans.tg</strong> · <strong>+228 90 00 00 01</strong>
          </p>
        </section>

      </div>
    </div>
  );
}
