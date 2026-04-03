import { useEffect, useState } from "react";
import { getTrajets } from "./api";

function App() {
  const [trajets, setTrajets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrajets() {
      try {
        const data = await getTrajets();
        console.log("Réponse API :", data); // 🧠 Vérifie la structure ici
        setTrajets(data.data || []); // ✅ Sécurité si data.data est undefined
      } catch (error) {
        console.error("Erreur lors du chargement des trajets :", error);
      } finally {
        setLoading(false);
      }
    }
    loadTrajets();
  }, []);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1>🚍 Liste des trajets MiabeTrans</h1>

      {loading ? (
        <p>Chargement des trajets...</p>
      ) : trajets.length > 0 ? (
        <ul>
          {trajets.map((t) => (
            <li key={t.id_trajet}>
              <strong>{t.ville_depart}</strong> ➜{" "}
              <strong>{t.ville_arrivee}</strong> — Prix : {t.prix} F CFA
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucun trajet trouvé 😕</p>
      )}
    </div>
  );
}

export default App;
