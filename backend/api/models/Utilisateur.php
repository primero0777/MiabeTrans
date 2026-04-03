<?php
class Utilisateur {
    private $conn;
    private $table_name = "utilisateurs";

    public $id;
    public $nom;
    public $prenom;
    public $email;
    public $telephone;
    public $mot_de_passe;
    public $role;
    public $date_inscription;
    public $statut;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Inscription utilisateur
    public function register() {
        // Vérifier si l'email existe déjà
        if($this->emailExists()) {
            return false;
        }

        $query = "INSERT INTO " . $this->table_name . "
                SET nom=:nom, prenom=:prenom, email=:email, 
                    telephone=:telephone, mot_de_passe=:mot_de_passe, 
                    role=:role, statut='actif'";

        $stmt = $this->conn->prepare($query);

        // Nettoyage des données
        $this->nom = htmlspecialchars(strip_tags($this->nom));
        $this->prenom = htmlspecialchars(strip_tags($this->prenom));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->telephone = htmlspecialchars(strip_tags($this->telephone));

        // Hash du mot de passe
        $password_hash = password_hash($this->mot_de_passe, PASSWORD_DEFAULT);

        $stmt->bindParam(":nom", $this->nom);
        $stmt->bindParam(":prenom", $this->prenom);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":telephone", $this->telephone);
        $stmt->bindParam(":mot_de_passe", $password_hash);
        $stmt->bindParam(":role", $this->role);

        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    // Connexion utilisateur
    public function login($password) {
        $query = "SELECT id, nom, prenom, email, telephone, mot_de_passe, role, statut
                FROM " . $this->table_name . "
                WHERE email = :email AND statut = 'actif'";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();

        if($stmt->rowCount() == 1) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Vérifier le mot de passe
            if(password_verify($password, $row['mot_de_passe'])) {
                $this->id = $row['id'];
                $this->nom = $row['nom'];
                $this->prenom = $row['prenom'];
                $this->telephone = $row['telephone'];
                $this->role = $row['role'];
                $this->statut = $row['statut'];
                
                return true;
            }
        }
        return false;
    }

    // Vérifier si l'email existe
    private function emailExists() {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }

    // Obtenir le profil utilisateur
    public function getProfile($user_id) {
        $query = "SELECT id, nom, prenom, email, telephone, role, date_inscription
                FROM " . $this->table_name . "
                WHERE id = :id AND statut = 'actif'";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $user_id);
        $stmt->execute();

        if($stmt->rowCount() == 1) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        return false;
    }

    // Mettre à jour le profil
    public function updateProfile($user_id, $data) {
        $query = "UPDATE " . $this->table_name . "
                SET nom = :nom, prenom = :prenom, telephone = :telephone
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":nom", htmlspecialchars(strip_tags($data['nom'])));
        $stmt->bindParam(":prenom", htmlspecialchars(strip_tags($data['prenom'])));
        $stmt->bindParam(":telephone", htmlspecialchars(strip_tags($data['telephone'])));
        $stmt->bindParam(":id", $user_id);

        return $stmt->execute();
    }

    // Changer le mot de passe
    public function changePassword($user_id, $current_password, $new_password) {
        // Vérifier l'ancien mot de passe
        $query = "SELECT mot_de_passe FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $user_id);
        $stmt->execute();

        if($stmt->rowCount() == 1) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if(password_verify($current_password, $row['mot_de_passe'])) {
                // Mettre à jour avec le nouveau mot de passe
                $new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);
                
                $update_query = "UPDATE " . $this->table_name . "
                               SET mot_de_passe = :new_password
                               WHERE id = :id";
                
                $update_stmt = $this->conn->prepare($update_query);
                $update_stmt->bindParam(":new_password", $new_password_hash);
                $update_stmt->bindParam(":id", $user_id);
                
                return $update_stmt->execute();
            }
        }
        return false;
    }
}
?>