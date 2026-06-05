const API_BASE = "http://localhost/sout/MiabeTrans_Structure_chat/MiabeTrans/backend/api/routes/";

export async function getTrajets() {
  const response = await fetch(`${API_BASE}trajets.php`);
  const data = await response.json();
  return data;
}
