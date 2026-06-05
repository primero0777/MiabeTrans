<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/responseHandler.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

class DashboardController {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }
    
    public function getStats() {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->authenticate();
            
            $period = $_GET['period'] ?? 'week';
            $stats = [];
            
            if ($user['role'] === 'admin') {
                $stats = $this->getAdminStats($period);
            } elseif ($user['role'] === 'chauffeur') {
                $stats = $this->getChauffeurStats($user['id'], $period);
            } else {
                $stats = $this->getClientStats($user['id'], $period);
            }
            
            ResponseHandler::sendSuccess($stats, "Statistiques récupérées avec succès");
            
        } catch (PDOException $e) {
            error_log("Erreur récupération stats: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de la récupération des statistiques", 500);
        }
    }
    
    private function getAdminStats($period) {
        $dateRange = $this->getDateRange($period);
        
        return [
            'revenue' => $this->getRevenueStats($dateRange),
            'bookings' => $this->getBookingStats($dateRange),
            'users' => $this->getUserStats($dateRange),
            'occupancy' => $this->getOccupancyStats($dateRange),
            'revenueChart' => $this->getRevenueChartData($dateRange),
            'bookingsDistribution' => $this->getBookingsDistribution(),
            'topDestinations' => $this->getTopDestinations($dateRange),
            'driversPerformance' => $this->getDriversPerformance()
        ];
    }
    
    private function getChauffeurStats($userId, $period) {
        $dateRange = $this->getDateRange($period);
        $chauffeurId = $this->getChauffeurId($userId);
        
        return [
            'trajetsAujourdhui' => $this->getTrajetsAujourdhui($chauffeurId),
            'trajetsTermines' => $this->getTrajetsTermines($chauffeurId, $dateRange),
            'noteMoyenne' => $this->getNoteMoyenne($chauffeurId),
            'revenuMensuel' => $this->getRevenuChauffeur($chauffeurId, $dateRange),
            'prochainTrajet' => $this->getProchainTrajet($chauffeurId)
        ];
    }
    
    private function getClientStats($userId, $period) {
        $dateRange = $this->getDateRange($period);
        
        return [
            'reservationsTotal' => $this->getClientReservationsTotal($userId),
            'reservationsEnCours' => $this->getClientReservationsEnCours($userId),
            'depensesTotal' => $this->getClientDepensesTotal($userId, $dateRange),
            'prochaineReservation' => $this->getProchaineReservation($userId)
        ];
    }
    
    private function getDateRange($period) {
        $now = new DateTime();
        
        switch ($period) {
            case 'today':
                $start = $now->format('Y-m-d');
                $end = $now->format('Y-m-d');
                break;
            case 'week':
                $start = $now->modify('-7 days')->format('Y-m-d');
                $end = $now->modify('+7 days')->format('Y-m-d');
                break;
            case 'month':
                $start = $now->modify('-30 days')->format('Y-m-d');
                $end = $now->modify('+30 days')->format('Y-m-d');
                break;
            case 'year':
                $start = $now->modify('-365 days')->format('Y-m-d');
                $end = $now->modify('+365 days')->format('Y-m-d');
                break;
            default:
                $start = $now->modify('-7 days')->format('Y-m-d');
                $end = $now->modify('+7 days')->format('Y-m-d');
        }
        
        return ['start' => $start, 'end' => $end];
    }
    
    private function getRevenueStats($dateRange) {
        $query = "SELECT 
                     SUM(prix_total) as total,
                     COUNT(*) as count,
                     (SELECT SUM(prix_total) FROM reservations 
                      WHERE date_reservation BETWEEN DATE_SUB(:start, INTERVAL 7 DAY) AND DATE_SUB(:end, INTERVAL 7 DAY)) as previous_total
                  FROM reservations 
                  WHERE date_reservation BETWEEN :start AND :end 
                  AND statut IN ('paye', 'complete')";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':start', $dateRange['start']);
        $stmt->bindParam(':end', $dateRange['end']);
        $stmt->execute();
        
        $data = $stmt->fetch();
        $current = floatval($data['total'] ?? 0);
        $previous = floatval($data['previous_total'] ?? 0);
        
        $trend = $previous > 0 ? (($current - $previous) / $previous) * 100 : 0;
        
        return [
            'total' => $current,
            'count' => intval($data['count']),
            'trend' => round($trend, 1)
        ];
    }
    
    private function getBookingStats($dateRange) {
        $query = "SELECT 
                     COUNT(*) as total,
                     (SELECT COUNT(*) FROM reservations 
                      WHERE date_reservation BETWEEN DATE_SUB(:start, INTERVAL 7 DAY) AND DATE_SUB(:end, INTERVAL 7 DAY)) as previous_total
                  FROM reservations 
                  WHERE date_reservation BETWEEN :start AND :end";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':start', $dateRange['start']);
        $stmt->bindParam(':end', $dateRange['end']);
        $stmt->execute();
        
        $data = $stmt->fetch();
        $current = intval($data['total']);
        $previous = intval($data['previous_total']);
        
        $trend = $previous > 0 ? (($current - $previous) / $previous) * 100 : 0;
        
        return [
            'total' => $current,
            'trend' => round($trend, 1)
        ];
    }
    
    private function getUserStats($dateRange) {
        $query = "SELECT 
                     COUNT(*) as total,
                     (SELECT COUNT(*) FROM utilisateurs 
                      WHERE date_inscription BETWEEN DATE_SUB(:start, INTERVAL 7 DAY) AND DATE_SUB(:end, INTERVAL 7 DAY)) as previous_total
                  FROM utilisateurs 
                  WHERE date_inscription BETWEEN :start AND :end";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':start', $dateRange['start']);
        $stmt->bindParam(':end', $dateRange['end']);
        $stmt->execute();
        
        $data = $stmt->fetch();
        $current = intval($data['total']);
        $previous = intval($data['previous_total']);
        
        $trend = $previous > 0 ? (($current - $previous) / $previous) * 100 : 0;
        
        return [
            'total' => $current,
            'trend' => round($trend, 1)
        ];
    }
    
    private function getOccupancyStats($dateRange) {
        $query = "SELECT 
                     AVG((nombre_places - places_disponibles) / nombre_places * 100) as rate,
                     (SELECT AVG((nombre_places - places_disponibles) / nombre_places * 100) 
                      FROM trajets WHERE date_depart BETWEEN DATE_SUB(:start, INTERVAL 7 DAY) AND DATE_SUB(:end, INTERVAL 7 DAY)) as previous_rate
                  FROM trajets 
                  WHERE date_depart BETWEEN :start AND :end";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':start', $dateRange['start']);
        $stmt->bindParam(':end', $dateRange['end']);
        $stmt->execute();
        
        $data = $stmt->fetch();
        $current = floatval($data['rate'] ?? 0);
        $previous = floatval($data['previous_rate'] ?? 0);
        
        $trend = $previous > 0 ? ($current - $previous) : 0;
        
        return [
            'rate' => round($current, 1),
            'trend' => round($trend, 1)
        ];
    }
    
    private function getRevenueChartData($dateRange) {
        $query = "SELECT DATE(date_reservation) as date, SUM(prix_total) as revenue
                  FROM reservations 
                  WHERE date_reservation BETWEEN :start AND :end 
                  AND statut IN ('paye', 'complete')
                  GROUP BY DATE(date_reservation)
                  ORDER BY date";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':start', $dateRange['start']);
        $stmt->bindParam(':end', $dateRange['end']);
        $stmt->execute();
        
        $data = $stmt->fetchAll();
        
        $labels = [];
        $revenues = [];
        
        foreach ($data as $row) {
            $labels[] = $row['date'];
            $revenues[] = floatval($row['revenue']);
        }
        
        return [
            'labels' => $labels,
            'data' => $revenues
        ];
    }
    
    private function getBookingsDistribution() {
        $query = "SELECT 
                     SUM(CASE WHEN statut = 'confirme' THEN 1 ELSE 0 END) as confirmees,
                     SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
                     SUM(CASE WHEN statut = 'annule' THEN 1 ELSE 0 END) as annulees,
                     SUM(CASE WHEN statut = 'complete' THEN 1 ELSE 0 END) as terminees
                  FROM reservations";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $data = $stmt->fetch();
        
        return [
            intval($data['confirmees']),
            intval($data['en_attente']),
            intval($data['annulees']),
            intval($data['terminees'])
        ];
    }
    
    private function getTopDestinations($dateRange) {
        $query = "SELECT CONCAT(ville_depart, ' - ', ville_arrivee) as route, COUNT(*) as count
                  FROM reservations r
                  INNER JOIN trajets t ON r.trajet_id = t.id
                  WHERE r.date_reservation BETWEEN :start AND :end
                  GROUP BY ville_depart, ville_arrivee
                  ORDER BY count DESC
                  LIMIT 5";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':start', $dateRange['start']);
        $stmt->bindParam(':end', $dateRange['end']);
        $stmt->execute();
        
        $data = $stmt->fetchAll();
        
        $labels = [];
        $counts = [];
        
        foreach ($data as $row) {
            $labels[] = $row['route'];
            $counts[] = intval($row['count']);
        }
        
        return [
            'labels' => $labels,
            'data' => $counts
        ];
    }
    
    private function getDriversPerformance() {
        $query = "SELECT 
                     AVG(ponctualite) as ponctualite,
                     AVG(securite) as securite,
                     AVG(service) as service,
                     AVG(confort) as confort,
                     AVG((ponctualite + securite + service + confort) / 4) as communication
                  FROM avis 
                  WHERE statut = 'approuve'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $data = $stmt->fetch();
        
        return [
            round(floatval($data['ponctualite'] ?? 0), 1),
            round(floatval($data['securite'] ?? 0), 1),
            round(floatval($data['service'] ?? 0), 1),
            round(floatval($data['confort'] ?? 0), 1),
            round(floatval($data['communication'] ?? 0), 1)
        ];
    }
    
    // Méthodes pour les chauffeurs
    private function getChauffeurId($userId) {
        $query = "SELECT id FROM chauffeurs WHERE utilisateur_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        $data = $stmt->fetch();
        return $data['id'] ?? null;
    }
    
    private function getTrajetsAujourdhui($chauffeurId) {
        $query = "SELECT COUNT(*) as count 
                  FROM trajets 
                  WHERE chauffeur_id = :chauffeur_id 
                  AND date_depart = CURDATE()";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':chauffeur_id', $chauffeurId);
        $stmt->execute();
        
        return intval($stmt->fetchColumn());
    }
    
    private function getTrajetsTermines($chauffeurId, $dateRange) {
        $query = "SELECT COUNT(*) as count 
                  FROM trajets t
                  INNER JOIN reservations r ON t.id = r.trajet_id
                  WHERE t.chauffeur_id = :chauffeur_id 
                  AND r.statut = 'complete'
                  AND r.date_reservation BETWEEN :start AND :end";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':chauffeur_id', $chauffeurId);
        $stmt->bindParam(':start', $dateRange['start']);
        $stmt->bindParam(':end', $dateRange['end']);
        $stmt->execute();
        
        return intval($stmt->fetchColumn());
    }
    
    private function getNoteMoyenne($chauffeurId) {
        $query = "SELECT AVG(note) as moyenne 
                  FROM avis 
                  WHERE chauffeur_id = :chauffeur_id 
                  AND statut = 'approuve'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':chauffeur_id', $chauffeurId);
        $stmt->execute();
        
        return round(floatval($stmt->fetchColumn() ?? 0), 1);
    }
    
    private function getRevenuChauffeur($chauffeurId, $dateRange) {
        $query = "SELECT SUM(r.prix_total) as revenu
                  FROM reservations r
                  INNER JOIN trajets t ON r.trajet_id = t.id
                  WHERE t.chauffeur_id = :chauffeur_id
                  AND r.statut IN ('paye', 'complete')
                  AND r.date_reservation BETWEEN :start AND :end";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':chauffeur_id', $chauffeurId);
        $stmt->bindParam(':start', $dateRange['start']);
        $stmt->bindParam(':end', $dateRange['end']);
        $stmt->execute();
        
        return floatval($stmt->fetchColumn() ?? 0);
    }
    
    private function getProchainTrajet($chauffeurId) {
        $query = "SELECT t.*, v.marque, v.modele, v.immatriculation
                  FROM trajets t
                  LEFT JOIN vehicules v ON t.vehicule_id = v.id
                  WHERE t.chauffeur_id = :chauffeur_id
                  AND t.date_depart >= CURDATE()
                  AND t.statut = 'actif'
                  ORDER BY t.date_depart ASC, t.heure_depart ASC
                  LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':chauffeur_id', $chauffeurId);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    // Méthodes pour les clients
    private function getClientReservationsTotal($userId) {
        $query = "SELECT COUNT(*) as count 
                  FROM reservations 
                  WHERE utilisateur_id = :user_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        return intval($stmt->fetchColumn());
    }
    
    private function getClientReservationsEnCours($userId) {
        $query = "SELECT COUNT(*) as count 
                  FROM reservations 
                  WHERE utilisateur_id = :user_id
                  AND statut IN ('en_attente', 'confirme', 'paye')";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        return intval($stmt->fetchColumn());
    }
    
    private function getClientDepensesTotal($userId, $dateRange) {
        $query = "SELECT SUM(prix_total) as total
                  FROM reservations 
                  WHERE utilisateur_id = :user_id
                  AND statut IN ('paye', 'complete')
                  AND date_reservation BETWEEN :start AND :end";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':start', $dateRange['start']);
        $stmt->bindParam(':end', $dateRange['end']);
        $stmt->execute();
        
        return floatval($stmt->fetchColumn() ?? 0);
    }
    
    private function getProchaineReservation($userId) {
        $query = "SELECT r.*, t.ville_depart, t.ville_arrivee, t.date_depart, t.heure_depart
                  FROM reservations r
                  INNER JOIN trajets t ON r.trajet_id = t.id
                  WHERE r.utilisateur_id = :user_id
                  AND r.statut IN ('en_attente', 'confirme', 'paye')
                  AND t.date_depart >= CURDATE()
                  ORDER BY t.date_depart ASC, t.heure_depart ASC
                  LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        return $stmt->fetch();
    }
}
?>